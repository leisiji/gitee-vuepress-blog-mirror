---
title: Memory Model
date: 2020-12-27 21:26:24
tags:
 - memory
categories:
 - linux
---

# memory-model

[参考](mp.weixin.qq.com/s/5INg0GlniXcZ1nLJWRwq4Q)，详细参考 memory-model.rst

linux 的 3 种内存模型，代表了物理内存页的 3 种管理方式：

- flat memory model
- Discontiguous memory model (deprecated)
- sparse memory model

## FLATMEM

物理地址空间是一个连续的，没有空洞的地址空间，管理非常简单：

- `struct page` 的数组（`mem_map`），每个条目指向一个 page frame
- `PFN - ARCH_PFN_OFFSET` 就是 `mem_map` 数组的索引

```c
/* include/asm-generic/memory_model.h */
#define __pfn_to_page(pfn)  (mem_map + ((pfn) - ARCH_PFN_OFFSET))
```

## SPARSEMEM

因为 DISCONTIGMEM 的 `node_mem_map` 是连续的数组，hotplug 会导致数组不连续

SPARSEMEM 主要是为了支持 memory hotplug

- 分配足够多的 `mem_section`，组成一个数组 `mem_sections`
- 没有对应内存的 `mem_section` 指向 NULL，hotplug 后指向对应的 `struct page` 数组

`mem_section` 相比 FLATMEM 就是内存的粒度更细了：比如一个 `mem_section` 可以表示 128M 内存，`mem_map` 表示支持的最大内存

### 实现

- 物理内存由多个任意大小的 section（`struct mem_section`）构成，因此物理内存可视为一个 `mem_section` 数组
- `mem_section::section_mem_map` 会指向 `struct page` 数组
- PFN 的高位用作查找哪个 `mem_section`，而 PFN 的低位则是 `struct page` 的索引

```c
/* include/linux/mmzone.h */
struct mem_section {
    unsigned long section_mem_map; // 指向 struct page 数组的指针
    struct mem_section_usage *usage;
};

#define __pfn_to_page(pfn)                                   \
    ({                                                       \
        unsigned long __pfn = (pfn);                         \
        struct mem_section *__sec = __pfn_to_section(__pfn); \
        __section_mem_map_addr(__sec) + __pfn;               \
    })

// 1. 通过 PFN 的高位获取 mem_section：pfn -> nr -> section
struct mem_section *__pfn_to_section(unsigned long pfn) {
    return __nr_to_section(pfn_to_section_nr(pfn));
}
unsigned long pfn_to_section_nr(unsigned long pfn) {
    return pfn >> PFN_SECTION_SHIFT;
}
struct mem_section *__nr_to_section(unsigned long nr) {
    // CONFIG_SPARSEMEM_EXTREME 没有开启，mem_section 二维数组每行只有一个元素
    return &mem_section[SECTION_NR_TO_ROOT(nr)][nr & SECTION_ROOT_MASK];
}
/* mm/sparse.c */
struct mem_section mem_section[NR_SECTION_ROOTS][SECTIONS_PER_ROOT];

// 2. 返回 mem_section 所指向的 struct page 数组
struct page *__section_mem_map_addr(struct mem_section *section)
{
    unsigned long map = section->section_mem_map;
    map &= SECTION_MAP_MASK;
    return (struct page *)map;
}
```

缺点：

1. `mem_section` 如果太大，初始化的时间太长
2. `pfn_to_page` 中间多了一次 `mem_section` 的转化，多了一次内存访问

## SPARSEMEM_VMEMMAP

通过 `CONFIG_SPARSEMEM_VMEMMAP` 打开该功能：

- 只有一个 `struct page` 数组，`struct page *vmemmap` 是数组的起始地址
- `vmemmap` 指向的数组是在虚拟地址上连续的，需要预留一段虚拟地址来保存映射关系
- PFN 就是对应的 `struct page` 在 `vmemmap` 的索引

```c
#define __pfn_to_page(pfn) (vmemmap + (pfn))
```

x86-64 linux 默认使用 `SPARSEMEM_VMEMMAP`

`vmemmap` 的实现和具体的处理器体系有关

```c
/* arch/x86/include/asm/pgtable_64.h */
#define vmemmap ((struct page *)VMEMMAP_START)
#define VMEMMAP_START      vmemmap_base
/* arch/x86/kernel/head64.c */
unsigned long vmemmap_base = __VMEMMAP_BASE_L4; // 0xffffea0000000000UL
```

完成 `vmemmap` 虚拟地址映射的是 `vmemmap_populate_basepages()`（也会根据 arch 来实现 `vmemmap_populate`）

```c
int vmemmap_populate_basepages(unsigned long start, unsigned long end, int node)
{
    unsigned long addr = start;
    for (; addr < end; addr += PAGE_SIZE) {
        pgd = vmemmap_pgd_populate(addr, node);
        // 之后是分别对 pud, pmd, pte 进行类似的初始化
    }
}
pgd_t * vmemmap_pgd_populate(unsigned long addr, int node)
{
    pgd_t *pgd = pgd_offset_k(addr);
    vmemmap_alloc_block_zero(PAGE_SIZE, node);
    return pgd;
}

/* 使用内核的 pgd，而不是用户程序的，说明内核也可以使用类似用户态的虚拟地址 */
// 内核的 pgd 被保存在 init_mm::pgd
#define pgd_offset_k(address)       pgd_offset(&init_mm, (address))
```
