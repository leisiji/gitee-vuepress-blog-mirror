---
title: linux 页表机制
date: 2020-12-27 18:26:24
tags:
 - memory
categories:
 - linux
---

# 页表

分页会导致访问内存的次数增多，TLB 就是用于加速查找 page frame 的硬件

页表作用：**每个进程都有一份页表**，用以实现进程隔离

逻辑地址：页面号（page number）+页内偏移（也称为页框号，page frame number），逻辑地址到物理地址的转换是 MMU 实现的，当然也可以通过 kernel API 计算

多级页表：

- 为了避免页表占用连续内存，又将页表拆散，通过页表找页表，拆散后的页表最小分割依旧是一页，这样的一页叫做页表页
- 页表页内的页表号必然是连续的
- 这时，逻辑地址变为：页表页号+页号+页内偏移
- x86-64 linux 使用 4 级页表，实际只使用了 48 位，x86-32 使用 2 级页表

单级页表和多级页表对比：

- 假如内存是 4G，页框大小是 4K，则需要 1M 个页表项，一个页表项 4 字节，页表的大小是 4M，需要的连续内存是 4M
- 假如变为 2 级页表，只需要页目录 1024 个，页表项 1024 个，假设页目录项占用 4 字节，需要的连续内存只需要 4K

映射是由 MMU 完成的，映射的建立是由操作系统完成的，页表映射建立：

- 页表和物理地址的映射会在缺页异常时建立
- `mmap()` 只是告诉操作系统某个范围的地址可以进行映射，但是没有真正去映射

## 物理内存地址排布

下面的两个表格参考 Documentation/arm64/memory.rst

AArch64 Linux memory layout with 4KB pages + 4 levels (48-bit):

| Start			   | End			  | Size   | Use					   |
| ---			   | ---			  | ---    | ---					   |
| 0000000000000000 | 0000ffffffffffff | 256TB  | user					   |
| ffff000000000000 | ffff7fffffffffff | 128TB  | kernel logical memory map |
| ffff800000000000 | ffff9fffffffffff | 32TB   | kasan shadow region	   |
| ffffa00000000000 | ffffa00007ffffff | 128MB  | bpf jit region			   |
| ffffa00008000000 | ffffa0000fffffff | 128MB  | modules				   |
| ffffa00010000000 | fffffdffbffeffff | ~93TB  | vmalloc				   |
| fffffdffbfff0000 | fffffdfffe5f8fff | ~998MB | [guard region]			   |
| fffffdfffe5f9000 | fffffdfffe9fffff | 4124KB | fixed mappings			   |
| fffffdfffea00000 | fffffdfffebfffff | 2MB    | [guard region]			   |
| fffffdfffec00000 | fffffdffffbfffff | 16MB   | PCI I/O space			   |
| fffffdffffc00000 | fffffdffffdfffff | 2MB    | [guard region]			   |
| fffffdffffe00000 | ffffffffffdfffff | 2TB    | vmemmap				   |
| ffffffffffe00000 | ffffffffffffffff | 2MB    | [guard region]			   |

Translation table lookup with 4KB pages:
```
+--------+--------+--------+--------+--------+--------+--------+--------+
|63    56|55    48|47    40|39    32|31    24|23    16|15     8|7      0|
+--------+--------+--------+--------+--------+--------+--------+--------+
 |                 |         |         |         |         |
 |                 |         |         |         |         v
 |                 |         |         |         |   [11:0]  in-page offset
 |                 |         |         |         +-> [20:12] L3 index
 |                 |         |         +-----------> [29:21] L2 index
 |                 |         +---------------------> [38:30] L1 index
 |                 +-------------------------------> [47:39] L0 index
 +-------------------------------------------------> [63] TTBR0/1
```

# linux 多级页表实现

4 级页表：

- PGD：page global directory (47-39)，页全局目录
- PUD：Page upper directory (38-30)，页上级目录
- PMD：page middle directory (29-21)，页中间目录
- PTE：page table entry (20-12)，页表项

计算：

- 32 位 CPU：指针大小是 4 字节，页表大小为 4K，则 pgd 项数为 1K，2 级页目录就是 2K*2K*4K = 2^32
- 64 位 CPU：指针大小是 8 字节，页表大小为 4K，则 pgd 项数为 512，4 级页目录就是 (2^9)^4*4K = 2^48，所以 4 级页目录只使用了 48 位

x86-64 **虚拟地址**的 63-48 位是没有作用的； 由于页面起始地址是 4K 对齐，pte 的 11-0 位用作 page 的标志位 (`pgprot_t`)

对于 MMU 和软件，pte 的 47-12 位有不同的含义：

- 对于 MMU，表示物理页的起始地址
- 对于软件，为物理页面的索引，即对应的 struct page 在 `mem_map` 中的索引

## 页表的处理函数

pte 通用工具函数（pmd, pud 类似）：
```c
// 将 pte_t 转化为 unsigned long
pteval_t native_pte_val(pte_t pte) {
	return pte.pte;
}
// 将 unsigned long 转化为 pte_t
pte_t native_make_pte(pteval_t val) {
	return (pte_t) { .pte = val };
}
// 设置 pte
void native_set_pte(pte_t *ptep, pte_t pte) {
	WRITE_ONCE(*ptep, pte);
}
// 取 flag
pteval_t pte_flags(pte_t pte) {
	return native_pte_val(pte) & PTE_FLAGS_MASK;
}
```
用于分析页表项的函数：xxx 表示 pgd, pud, pmd, pte

| 函数          | 描述                                 |
| ---           | ---                                  |
| `xxx_val`     | 将 `pte_t` 等转换为 `unsigned long`  |
| `__xxx`       | 将 `unsigned long` 转换为 `pte_t` 等 |
| `xxx_index`   | 返回虚拟地址对应的页表页中的索引     |
| `xxx_present` | 检查对应的 `_PRESENT` 是否被设置     |
| `xxx_none`    | 表项值是否为 0                       |
| `xxx_clear`   | 将页表项置 0                         |
| `xxx_page`    | 获取描述页表的 page 地址             |
| `xxx_offset`  | 找到虚拟地址对应页表项的地址         |
| `set_xxx`     | 设置页表中某项的值                   |

页表项和 unsigned long 转化：
```c
/* arch/x86/include/asm/pgtable.h */
#define pte_val(x)	native_pte_val(x)
#define __pte(x)	native_make_pte(x)
```
xxx_present:
```c
int pte_present(pte_t a) {
	return pte_flags(a) & (_PAGE_PRESENT | _PAGE_PROTNONE);
}
int pmd_present(pmd_t pmd) {
	return pmd_flags(pmd) & (_PAGE_PRESENT | _PAGE_PROTNONE | _PAGE_PSE);
}
```
xxx_index，页表页 (page table page) 是一个数组: `pXd_t[PTRS_PER_PxD]`:
```c
/* include/linux/pgtable.h */
unsigned long pte_index(unsigned long address) {
	return (address >> PAGE_SHIFT) & (PTRS_PER_PTE - 1);
	// PAGE_SHIFT = 12, PTRS_PER_PTE = 1024
}
unsigned long pmd_index(unsigned long address) {
	return (address >> PMD_SHIFT) & (PTRS_PER_PMD - 1);
	// PMD_SHIFT = 21, PTRS_PER_PMD = 512
}
#define pgd_index(a)  (((a) >> PGDIR_SHIFT) & (PTRS_PER_PGD - 1))
// PGDIR_SHIFT = 39, PTRS_PER_PGD = 512
```
xxx_clear:
```c
#define pte_clear(mm, addr, ptep)  native_pte_clear(mm, addr, ptep)
void native_pte_clear(struct mm_struct *mm, unsigned long addr, pte_t *ptep) {
	native_set_pte(ptep, native_make_pte(0));
}
```
pte 转化为 page (pgd, pud, pmd 也有对应的)：
```c
/* arch/x86/include/asm/pgtable.h */
// (pte>>12) & (!protnone_mask) -> pfn -> mem_map[pfn] -> struct page*
#define pte_page(pte) pfn_to_page(pte_pfn(pte))
#define pfn_to_page   (vmemmap + (pfn))
unsigned long pte_pfn(pte_t pte) {
	return (pte_val(pte) & PTE_PFN_MASK) >> PAGE_SHIFT;
	// pte 不为 0 时，可以简化为上面这一行
}

#define pgd_page(pgd) pfn_to_page(pgd_pfn(pgd))
unsigned long pgd_pfn(pgd_t pgd) {
	return (pgd_val(pgd) & PTE_PFN_MASK) >> PAGE_SHIFT;
}
```
xxx_offset:
```c
// 根据 mm 和 va，找到对应的 pgd 项地址
#define pgd_offset(mm, address) pgd_offset_pgd((mm)->pgd, (address))
pgd_t *pgd_offset_pgd(pgd_t *pgd, unsigned long address) {
	return (pgd + pgd_index(address));
}

pmd_t *pmd_offset(pud_t *pud, unsigned long address) {
	return (pmd_t *)pud_page_vaddr(*pud) + pmd_index(address);
}

// pmd 项保存的是物理地址，需要转化为 va
pte_t *pte_offset_map(pmd_t *pmd, unsigned long address) {
	return (pte_t *)pmd_page_vaddr(*pmd) + pte_index(address);
}
unsigned long pmd_page_vaddr(pmd_t pmd) {
	return (unsigned long)__va(pmd_val(pmd) & PTE_PFN_MASK);
}
```

### 页表页分配

| 函数        | 描述                                 |
| ---         | ---                                  |
| `xxx_alloc` | 分配并初始化可容纳一个完整页表的内存 |
| `xxx_free`  | 释放页表占据的内存                   |

分配页表页：
```c
/* arch/x86/mm/pgtable.c */
pgd_t *pgd_alloc(struct mm_struct *mm);
/* include/linux/mm.h */
pud_t *pud_alloc(struct mm_struct *mm, p4d_t *p4d, unsigned long address);
pmd_t *pmd_alloc(struct mm_struct *mm, pud_t *pud, unsigned long address);
#define pte_alloc(mm, pmd) (unlikely(pmd_none(*(pmd))) && __pte_alloc(mm, pmd))
/* mm/memory.c */
int __pte_alloc(struct mm_struct *mm, pmd_t *pmd);
```

## 内存检查标志位以及 API

虚拟地址的标志位，63-48 用作标志位：
```c
/* arch/x86/include/asm/pgtable_types.h */
#define _PAGE_BIT_PRESENT	0	/* 映射是否建立 */
#define _PAGE_BIT_RW		1	/* 是否可以读写 */
#define _PAGE_BIT_USER		2	/* userspace addressable */
#define _PAGE_BIT_PWT		3	/* page write through */
#define _PAGE_BIT_PCD		4	/* page cache disabled */
#define _PAGE_BIT_ACCESSED	5	/* was accessed (raised by CPU) */
#define _PAGE_BIT_DIRTY		6	/* was written to (raised by CPU) */
// ...
#define _PAGE_BIT_NX		63	/* No execute: only valid after cpuid check */
```
pte 各个位的作用：

- 若 pte 为 0，表示尚未建立物理地址和虚拟地址的映射
- pte 的 47-12 位可以找到对应的 struct page
- pte 的 11-0 位叫做 `pgprot_t`，被用作页面保护标志位，这个和 CPU 相关

同样地，pud/pmd 的 11-0 位也是相同的作用

| 名称                 | 作用                                             |
| ---                  | ---                                              |
| `_PAGE_BIT_PRESENT`  | 该位检查 pte 指向的页是否在内存（如换出到 swap） |
| `_PAGE_BIT_ACCESSED` | 每次 CPU 访问页会自动设置该位，反映页的活跃程度  |
| `_PAGE_BIT_DIRTY`    | 页的内容是否被修改过，自动被 CPU 设置            |
| `_PAGE_BIT_USER`     | 是否允许用户空间访问此页                         |

处理 pte 标志位的函数：

| 函数            | 描述                               |
| ---             | ---                                |
| `pte_present`   | 页在内存中吗                       |
| `pte_write`     | 可以写入到该页吗                   |
| `pte_exec`      | 页中的数据可以作为二进制代码执行吗 |
| `pte_dirty`     | 页的内容是否被修改过               |
| `pte_young`     | `_PAGE_BIT_ACCESSED` 被设置了吗    |
| `pte_wrprotect` | 清除该页的写权限                   |
| `pte_mkwrite`   | 设置写权限                         |
| `pte_mkexec`    | 允许执行页的内容                   |
| `pte_mkdirty`   | 将页标记为脏                       |
| `pte_mkclean`   | 清除 `_PAGE_BIT_DIRTY`             |
| `pte_mkyoung`   | 设置 `_PAGE_BIT_ACCESSED`          |
| `pte_mkold`     | 清除 `_PAGE_BIT_ACCESSED`          |

pte 的创建和操作：

| 函数       | 描述                               |
| ---        | ---                                |
| `mk_pte`   | 参数为 page 和访问权限，创建页表项 |
| `pte_page` | 获得页表项描述的页对应的 page      |


## 内核虚拟内存

内核内存的映射方式是线性的，没有使用分页：内核虚拟地址 x，其物理地址是 x 减去 `PAGE_OFFSET`
```c
/* arch/x86/include/asm/page.h */
// physical addr
unsigned long __pa(unsigned long x) {
	unsigned long y = x - __START_KERNEL_map;
	/* use the carry flag to determine if x was < __START_KERNEL_map */
	x = y + ((x > y) ? phys_base : (__START_KERNEL_map - PAGE_OFFSET));
	return x;
}
/* arch/x86/include/asm/page_64_types.h */
#define __START_KERNEL_map	0xffffffff80000000UL

// virtual addr
#define __va(x) ((void *)((unsigned long)(x)+PAGE_OFFSET))
```
CPU 并不是使用 `__pa` 来得出物理地址的，`__pa` 只是为内核代码需要知道物理地址时提供方便，比如切换进程要将 CR3 指向新的 PGD：
```c
/* arch/x86/mm/tlb.c */
// 切换 CR3 的精简核心代码
void switch_mm_irqs_off(struct mm_struct *prev, struct mm_struct *next,
			struct task_struct *tsk) {
	// ...
	load_new_mm_cr3(next->pgd, new_asid, true);
}
void load_new_mm_cr3(pgd_t *pgdir, u16 new_asid, bool need_flush) {
	write_cr3(__pa(pgd));
}
void native_write_cr3(unsigned long val) {
	asm volatile("mov %0,%%cr3": : "r" (val), "m" (__force_order));
}
```

