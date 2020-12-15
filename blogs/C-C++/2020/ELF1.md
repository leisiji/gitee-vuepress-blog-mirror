---
title: ELF 入门（一）
date: 2020-05-29
tags:
 - tag2
categories:
 - C-C++
---

以下内容来自《程序员的自我修养》

# ELF 介绍

ELF 类型，使用 `file` 查看类型：

- 可重定位文件（relocatable file）：可以被用来链接成可执行文件或共享目标文件，静态链接库也属于这一类（.o, .a）
- 可执行文件（executable file）
- 共享目标文件（Shared object file）
- 核心转储文件（core dump file）

段分类：

- .text 装载了可执行代码
- .data 已初始化的全局变量和局部静态变量
- .bss (block started by symbol) 未初始化的全局变量和局部静态变量，都为 0，不需要占据空间
- .rodata 只读数据段，如字符串常量和 const 变量，比如`char *x="hello";`，"hello" 放在 rodata，而不是 x
- .comment 编译器版本信息
- .symtab symbol table
- .dynamic 动态链接信息
- .plt, .got 动态链接的跳转表和全局入口表
- .init, fini 程序初始化与终结代码段
- .line 调试时的行号表，即源代码的行号与汇编代码的对应表
- .debug 调试信息

bss 最初是一个伪指令，用于为符号预留一块内存空间

字符串表：存放段名或变量名等，两个字符串之间有 0 隔开，所有字符串可以连续存放，引用时只需要使用表中的偏移

- .strtab 存放符号名等
- .shstrtab 存放段名 `sh_name` 等
- 变量中引用的字符串常量，比如 `printf("hello\n")` 存放在 rodata

# ELF 文件解析

可以通过 `man elf` 查看 ELF 的详细信息

ELF，Executable and Linkable Format，是Unix/Linux系统ABI (Application Binary Interface)规范的一部分

> ELF 组成（elf.h）：文件开头是 ELF header，接着是 program header 或 section header table 或着两者

基本类型：
```
N=32,64, ElfN 代表 Elf32/Elf64
ElfN_Addr		Unsigned program address, uintN_t
ElfN_Off		Unsigned file offset, uintN_t
ElfN_Section	Unsigned section index, uint16_t
ElfN_Versym		Unsigned version symbol information, uint16_t
Elf_Byte		unsigned char
ElfN_Half		uint16_t
ElfN_Sword		int32_t
ElfN_Word		uint32_t
ElfN_Sxword		int64_t
ElfN_Xword		uint64_t
```

## ELF header

```c
#define EI_NIDENT 16
typedef struct {
	unsigned char e_ident[EI_NIDENT];
	uint16_t	 e_type;
	uint16_t	 e_machine;
	uint32_t	 e_version;
	ElfN_Addr	 e_entry;
	ElfN_Off	 e_phoff;
	ElfN_Off	 e_shoff;
	uint32_t	 e_flags;
	uint16_t	 e_ehsize;
	uint16_t	 e_phentsize;
	uint16_t	 e_phnum;
	uint16_t	 e_shentsize;
	uint16_t	 e_shnum;
	uint16_t	 e_shstrndx;
} ElfN_Ehdr;
```

`e_ident`：描述了如何去解析文件，整个数组的值都是宏：

| 成员				 | 含义																			|
| ---				 | ---																			|
| magic(1~4)		 | `EI_MAG0`(1)：0x7f；`EI_MAG1`(2)：'E'；`EI_MAG2`(3)：'L'；`EI_MAG3`(4)：'F'	|
| `EI_CLASS`(5)		 | 描述二进制的架构，`ELFCLASS32`/`ELFCLASS64`									|
| `EI_DATA`(6)		 | 字节序，`ELFDATA2LSB`/`ELFDATA2MSB`											|
| `EI_VERSION`(7)	 | ELF 的版本，`EV_CURRENT`														|
| `EI_OSABI`(8)		 | 表明操作系统和 ABI，`ELFOSABI_NONE`, `ELFOSABI_LINUX`, `ELFOSABI_FREEBSD`... |
| `EI_ABIVERSION`(9) | 值的意义取决于 `EI_OSABI`，通常是 0											|
| `EI_PAD`			 | 剩余都是 0，用于拓展															|

其他字段意义：

| 成员			| 含义																							  |
| ---			| ---																							  |
| `e_type`		| 文件类型：`ET_REL`(relocatable),`ET_EXEC`(executable),`ET_DYN`(shared obj),`ET_CORE`(core file) |
| `e_machine`	| 硬件架构：`EM_ARM`(Advanced RISC Machines), `EM_X86_64`(AMD x86-64)...						  |
| `e_entry`		| 加载程序的虚拟地址																			  |
| `e_phoff`		| program header table 在文件中的偏移															  |
| `e_shoff`		| section header table 在文件中的偏移															  |
| `e_ehsize`	| ELF header 的大小																				  |
| `e_phentsize` | program header table 的一个 entry 的大小，所有 entry 都是同样的大小							  |
| `e_phnum`		| program header table 的 entry 数目															  |
| `e_shentsize` | section header table 的一个 entry 的大小，所有 entry 都是同样的大小							  |
| `e_shnum`		| section header table 的 entry 数目															  |
| `e_shstrndx`	| shstrtab (段表字符串所在的段) 在段表中的下标													  |

如果 `e_shnum` 比 `SHN_LORESERVE` (0xff00) 大，值会被保存到第一个 entry 的 `sh_size`（对于 `e_phnum` 是 `sh_info`）

`.shstrtab` 保存了每个 section 的名字，`e_shstrndx` 则是 `.shstrtab` 在 section header table 的索引位置

## Section header

section header 位置是由 ELF Header 中的 `e_shoff` 决定的，数目是 `e_shnum`
```c
typedef struct {
	uint32_t   sh_name; // 存放索引，字符串到 strtab 段中查找
	uint32_t   sh_type;
	uint32_t   sh_flags;
	Elf32_Addr sh_addr;
	Elf32_Off  sh_offset;
	uint32_t   sh_size;
	uint32_t   sh_link;
	uint32_t   sh_info;
	uint32_t   sh_addralign;
	uint32_t   sh_entsize;
} Elf32_Shdr;
```
结构中一些的名字已经表示其含义，比较难理解的：

- `sh_addralign` 表示对齐倍数，即 `sh_addr % (2**sh_addralign)`
- `sh_entsize` 表示每个项的大小，有些段比如符号表，每个符号的大小是相同的；若为 0，表示不包含固定大小的项

`sh_type`：

- `SHT_PROGBITS`：程序段。代码段和数据段都是该类型
- `SHT_RELA`, `SHT_REL`：段包含了重定位信息
- `SHT_SYMTAB`, `SHT_STRTAB`, `SHT_HASH`, `SHT_DYNAMIC`, `SHT_NOTE`
- `SHT_NOBITS`：表示该段在文件中没有内容，如 bss
- `SHT_SHLIB`：保留
- `SHT_DYNSYM`：动态链接符号表

`sh_flags` 值：`SHF_WRITE` `SHF_ALLOC` `SHF_EXECINSTR` `SHF_MASKPROC`

| Name	   | `sh_type`		| `sh_flags`					|
| ---	   | ---			| ---							|
| bss	   | `SHT_NOBITS`	| `SHF_ALLOC` + `SHF_WRITE`		|
| data	   | `SHT_PROGBITS` | `SHF_ALLOC` + `SHF_WRITE`		|
| rodata   | `SHT_PROGBITS` | `SHF_ALLOC`					|
| text	   | `SHT_PROGBITS` | `SHF_ALLOC` + `SHF_EXECINSTR` |
| comment  | `SHT_PROGBITS` | none							|
| shstrtab | `SHT_STRTAB`	| none							|

`sh_link` 和 `sh_info` 值的含义和 `sh_type` 有关，需要在链接相关的段，这两个字段才会有意义：

| `sh_type`					| `sh_link`							 | `sh_info`						  |
| ---						| ---								 | ---								  |
| `SHT_DYNAMIC`				| 该段所用的字符串表在段表中的下标	 | 0								  |
| `SHT_HASH`				| 该段所用的符号表在段表中的下标	 | 0								  |
| `SHT_REL`/`SHT_RELA`		| 该段所用的相应符号表在段表中的下标 | 该重定位表所作用的段在段表中的下标 |
| `SHT_SYMTAB`/`SHT_DYNSYM` | 操作系统相关						 | 操作系统相关						  |

## 符号表

函数和变量统称符号

- 函数名和变量名就是符号名
- 函数和变量的地址就是符号值
- 符号表就是符号名和符号值的映射表

符号分类：全局符号，外部符号（extern），段名，局部符号（static），行号信息

符号表通常是文件的一个段，叫做 .symtab，它是一个 `Elf32_Sym` 的数组
```c
typedef struct {
	uint32_t	  st_name;
	Elf32_Addr	  st_value;
	uint32_t	  st_size;
	unsigned char st_info;
	unsigned char st_other;
	uint16_t	  st_shndx;
} Elf32_Sym;
```

| 成员		 | 含义											   |
| ---		 | ---											   |
| `st_name`  | 该符号名在字符串表的下标						   |
| `st_size`  | 符号对应数据时才有意义，如 double var 是 8bytes |

`st_info` 的低 4 位表示符号类型，高 28 位表示符号绑定信息

- 符号类型：`STT_OBJECT`（数据对象，如变量、数组）, `STT_FUNC`, `STT_SECTION`, `STT_FILE`(该符号表示文件名)
- 绑定信息：`STB_LOCAL`(static), `STB_GLOBAL`, `STB_WEAK`

`st_shndx` 符号所在段，如果符号在本文件中，则该值表示符号所在段在段表中的下标，否则如下：

| 宏名		   | 值		| 说明											 |
| ---		   | ---	| ---											 |
| `SHN_ABS`    | 0xfff1 | 该符号包含了一个绝对值，比如文件名的符号		 |
| `SHN_COMMON` | 0xfff2 | 该符号是 COMMON 块符号，比如未初始化的全局符号 |
| `SHN_UNDEF`  | 0		| 该符号在本文件中被引用，但是定义在其他文件中	 |

`st_value`：

- 在目标文件中，若为符号定义且不是 `SHN_COMMON`，`st_value` 表示该符号在段中的偏移
- 在目标文件中，若为 `SHN_COMMON`，`st_value` 表示符号的对其属性
- 在可执行文件中，`st_value` 表示符号的虚拟地址

特殊符号（ld 产生可执行文件后才会出现）

- `__etext` 或 `_etext` 或 `etext`：符号为代码段结束地址
- `_edata` 或 `edata`：符号为数据段结束地址
- `_end` 或 `end`：符号为程序结束地址

```c
// 打印特殊符号地址
extern char __etext[];
extern char _edata[];
void test_address() {
	printf("%p\n", __etext);
	printf("%p\n", _edata);
}
```

### 符号修饰与函数签名

c++ 的重载以及命名空间，解决方法是符号修饰；**函数签名**：包含了一个函数的信息，包括函数名，参数类型、所在的类和名称空间；变量也采用类似方式

| 函数签名			   | 修饰后的名称（符号名） |
| ---				   | ---					|
| int func(int)		   | `_Z4funci`				|
| float func(float)    | `_Z4funcf`				|
| int C::func(int)	   | `_ZN1C4funcEi`			|
| int C::C2::func(int) | `_ZN1C2C24funcEi`		|
| int N::func(int)	   | `_ZN1N4funcEi`			|
| int N::C::func(int)  | `_ZN1N1C4funcEi`		|

`extern "C"`：将大括号内的代码当作 c 处理，因此 C++ 的名称修饰机制将不起作用，这样编译后的符号才能成功链接 C 库
```c
#ifdef __cplusplus
extern "C" {
#endif
// 无 extern c，c++ 得到符号为 _Z6memsetPvii
// c 得到的符号为 memset
void *memset(void *, int, size_t);
#ifdef __cplusplus
}
#endif
```

# 静态链接

VMA (Virtual Memory Address) 和 LMA (Load Memory Address) 正常情况下是一样的；程序存放到 ROM 时，LMA 和 VMA 是不同

将两个文件链接，并查看 VMA：
```bash
$ objdump -h a.o
Idx Name		  Size		VMA				  LMA				File off  Algn
  0 .text		  000000e0	0000000000000000  0000000000000000	00000040  2**0
				  CONTENTS, ALLOC, LOAD, RELOC, READONLY, CODE
...

# -e 指定程序入口
$ ld a.o b.o -e main -o ab
$ readelf -h a
...
 12 .text		  00000245	0000000000001080  0000000000001080	00001080  2**4
				  CONTENTS, ALLOC, LOAD, READONLY, CODE
```
链接前，VMA 是 0，链接后 VMA 才有值，链接主要完成了两个工作：

1. 空间和地址分配：扫描所有输入的目标文件，根据所有段的长度、属性、位置，将其合并起来
2. 符号解析和重定位

链接前后符号引用地址对比：
```bash
# 链接前，符号引用处的地址
$ objdump -d a.o
  34:	8b 05 00 00 00 00		mov    0x0(%rip),%eax		 # 3a <test_address+0x3a>

# 链接后，符号引用处的地址: 0x2e95 + 0x11c3 = 0x4058
$ objdump -d a
  11bd:		  8b 05 95 2e 00 00		  mov	 0x2e95(%rip),%eax		  # 4058 <i>
  11c3:		  89 c6					  mov	 %eax,%esi
# 链接后数据段
$ objdump -r a
Contents of section .data:
 4048 00000000 00000000 50400000 00000000  ........P@......
 4058 05000000							   ....
```

## 符号解析与重定位

重定位主要依靠重定位表，被放在 .rela.text（`Elf32_Shdr->sh_type` 为 `SHT_RELA`）；该表是一个 `Elf32_Rel` 数组，数组的每个元素叫做重定位入口（Relocation Entry）
```c
typedef struct {
	Elf32_Addr r_offset;
	uint32_t   r_info;
} Elf32_Rel;
```

- `r_offset`：该重定位入口所要修正的位置的第一个字节的虚拟地址
- `r_info`：
	- 低 8 位表示重定位入口的类型，该类型是 processor-specific
	- 高 24 位表示重定位入口的符号在符号表的下标

```bash
# 读取符号表
$ readelf -r a.o
  Offset		  Info			 Type			Sym. Value	  Sym. Name + Addend
000000000036  000a00000002 R_X86_64_PC32	 0000000000000000 i - 4
```

- 指令修正方式是根据 `Elf32_Rel.r_info` 的类型
- 类型若是 `R_X86_64_PC32` 或 `R_X86_64_PLT32`，使用的是相对寻址，即 `%rip`

比如在前面的例子中，变量 i 是 `R_X86_64_PC32` 类型：

- 符号链接后在可执行文件的位置，即 0x4058
- `%rip` 为下一条指令的地址 0x11c3
- 最终可以得到修正的值为 0x4058 - 0x11c3 = 0x2e95

注意 .rela.text 是不会输出到最终的可执行文件

## COMMON

COMMON 块，即 `Elf32_Sym.st_shndx` 为 `SHN_COMMON`

- COMMON 为未初始化的全局变量；未初始化的局部变量（即 static）的 `st_shndx` 为对应段的下标；extern 变量为 `SHN_UNDEF`
- COMMON 的链接规则是针对弱符号的情况：
	- 符号类型不同，即其他 obj 有一个占用空间更大的符号，该符号会覆盖更小的弱符号
	- 符号类型相同，即其他 obj 若有已初始化的全局变量，即强符号，则采用强符号

编译时可以加入 `-fno-common` 来禁用 COMMON，或单个变量以 `__attribute__((nocommon))` 来禁用
若一个符号不是以 COMMON 存在，则其为强符号，链接是会有符号重复定义的错误

## C++ 相关问题

如果消除 c++ 的函数模板生成的重复代码：

- 空间浪费
- 还会导致 icache 缓存了大量的重复代码，cache 命中率降低
- 地址容易出错：可能指向同一个函数的地址不同

消除方法：每个模板的实例代码都单独放到一个段里，每个段只包含一个模板实例；比如 `add<T>()`，生成两个段，名字分别为 `.temp.add<int>` 和 `.temp.add<float>`，链接器最终将相同段合并到代码段中

> 函数级别链接（Functional-leveling linking）是 vc++ 的一个编译选项：类似函数模板的段，让所有函数单独保存到一个段，当链接器用到某个函数，将其合并到输出文件中，舍弃没有用的函数

GCC 的类似选项是 `-ffunction-sections`/`-fdata-sections`：将函数或变量保存到独立的段中；同时链接器还需要打开 `--gc-sections` 才会去除无用函数

# 动态装载

执行可执行文件步骤：

- 创建一个独立的虚拟地址空间：对于 linux 只是分配一个页目录
- 读取可执行文件头，建立虚拟空间与可执行文件的映射关系
- 将 CPU 的指令寄存器设置为可执行文件的入口地址，启动运行

虚拟空间与可执行文件的映射关系保存在内核的一个数据结构中；虚拟空间中的一个段（Segment）叫做 VMA；多个相同权限的 section 可能合并到一个 segment，从而减小内存碎片

section 权限分类：

- text：可读可执行
- data, bss：可读可写
- rodata：只读

查看进程的各个 segments：
```bash
$ cat /proc/PID/
5596482cd000-5596482ce000 r--p 00000000 08:02 9055330	  /home/ye/github/debug_learn/ElfHacks/backtrace/a
...
5596482ee000-55964830f000 rw-p 00000000 00:00 0			  [heap]
...
7f9e851ba000-7f9e851bb000 r--p 00017000 08:02 1577050	  /usr/lib/libgcc_s.so.1
...
f9e8537c000-7f9e8537f000 rw-p 001bf000 08:02 1576280	  /usr/lib/libc-2.30.so
7f9e853b0000-7f9e853b2000 r--p 00000000 08:02 1576261	  /usr/lib/ld-2.30.so
...
7f9e853dc000-7f9e853dd000 rw-p 00000000 00:00 0
7ffc49937000-7ffc49958000 rw-p 00000000 00:00 0			  [stack]
7ffc499cf000-7ffc499d2000 r--p 00000000 00:00 0			  [vvar]
7ffc499d2000-7ffc499d3000 r-xp 00000000 00:00 0			  [vdso]
ffffffffff600000-ffffffffff601000 --xp 00000000 00:00 0	  [vsyscall]
```

## Program header

program header table 是 `Elf32_Phdr` 数组，它保存了 segment 的信息
```c
typedef struct {
	uint32_t   p_type;
	Elf32_Off  p_offset;
	Elf32_Addr p_vaddr;
	Elf32_Addr p_paddr;
	uint32_t   p_filesz;
	uint32_t   p_memsz;
	uint32_t   p_flags;
	uint32_t   p_align;
} Elf32_Phdr;
```

- `p_type`：指明了 segment 的类型
	- `PT_LOAD`：segment 是 loadable
	- `PT_DYNAMIC`：segment 含有动态链接的信息
- `p_vaddr`：segment 的第一个字节在进程虚拟空间地址的其实位置，在程序头表，LOAD 类型程序头按 `p_vaddr` 从小到大排列
- `p_paddr`：segment 的物理装载地址，即 LMA
- `p_filesz`：segment 在 ELF 文件中的长度，可能为 0
- `p_memsz`：segment 在 VMA 中的长度，可能为 0
- `p_flags`：segment 的权限属性，`PF_X`(可执行), `PF_W`(可写), `PF_R`(可读)
- `p_align`：在文件和内存中 segment 的对齐字节数（`2**p_align`）

对于 `PT_LOAD` 的 segment，`p_memsz` 不可以小于 `p_filesz`，多出的部分全部填 0，多出的部分是 bss，这样就无需再为 bss 设置 segment

# 动态链接

从之前的内存映射可以知道，虚拟地址映射了 libc.so、ld.so，在运行程序前，控制权先交给动态链接器

装载时重定位：

- 在没有虚拟内存时，程序直接加载到物理内存，所以程序被装载的地址是不确定的，因此系统需要在装载时对指令和数据对绝对地址的引用进行重定位
- 程序中指令和数据的相对位置不会变化：比如编译时假设装载目标的地址是 0x1000，系统发现 0x1000 已被使用，0x4000 有足够空间，指令中所有绝对引用加上 0x3000 的偏移即可

GCC 有两个参数 `-shared` 和 `-fPIC`，若只使用 `-shared`，那么输出的共享对象就是使用装载时重定位的方法

## 地址无关代码（Position-independent Code）

装载时重定位缺点：绝对地址的引用导致共享对象的指令部分无法在多个进程间共享，浪费内存

4 种类型的地址引用方式：

- 模块内部的函数调用、跳转：使用相对地址调用，或者基于寄存器的相对调用
- 模块内部数据访问，比如全局变量、静态变量：通常使用 rip 寄存器，rip 保存了当前指令的地址
- 模块间数据访问：在数据段建立一个指向这些变量的指针数组，称为全局偏移表（Global Offset Table, GOT）
- 模块间调用、跳转：plt

链接器会在装载时查找变量所在的地址，填充 GOT 的各个项，保证 GOT 指向的地址正确
```
# static void b_inner(void)，模块内函数调用
1119: callq  1109 <b_inner>

# int a，模块内数据访问
112a: movl	 $0x2,0x2ef8(%rip) # 402c <a>

# extern int c，模块间数据访问
1134: mov	 0x2ead(%rip),%rax # 3fe8 <c>
113b: movl	 $0x2,(%rax)

# 对应 section
Contents of section .got:
 3fd8 00000000 00000000 00000000 00000000  ................
 3fe8 00000000 00000000 00000000 00000000  ................
 3ff8 00000000 00000000					   ........
Contents of section .data:
 4020 20400000 00000000						@......
```

## 延迟绑定（PLT, Procedure Linkage Table）

模块使用了大量函数引用，如果程序执行前就进行动态链接，必定拖慢程序的初始化，因此 ELF 采用了延迟绑定，即函数第一次用到时才进行绑定

比如第一次调用 printf()，需要知道地址绑定在哪个模块，哪个函数？将这两个答案作为参数传递给动态链接器的 `_dl_runtime_resolve()`，让该函数完成延迟绑定

PLT 比 GOT 又增加了一层间接跳转，调用函数通过一个 PLT 项进行跳转，每个外部函数都有一个对应的 PLT 项：
```bash
0000000000001020 <.plt>:
 1020: pushq	0x2fe2(%rip)  # 4008 <_GLOBAL_OFFSET_TABLE_+0x8>
 1026: jmpq		*0x2fe4(%rip) # 4010 <_GLOBAL_OFFSET_TABLE_+0x10>
 102c: nopl		0x0(%rax)
0000000000001070 <printf@plt>:
 1070: jmpq		*0x2fc2(%rip) # 4038 <printf@GLIBC_2.2.5>
 1076: pushq	$0x4
 107b: jmpq	1020 <.plt>
0000000000001231 <main>:
 1259: callq	1070 <printf@plt>

# objdump -s a
Contents of section .dynamic:
 3de8 01000000 00000000 01000000 00000000  ................
Contents of section .got.plt:
 4000 f83d0000 00000000 00000000 00000000  .=..............
 4010 00000000 00000000 36100000 00000000  ........6.......
 4020 46100000 00000000 56100000 00000000  F.......V.......
 4040 86100000 00000000 96100000 00000000  ................
```
`printf@plt`

- 第一条指令是 .got.plt 的间接跳转，如果 ld 已经将地址填入该项，则是直接跳转 printf
- 第二条指令 push 的值是 printf 符号在重定位表 .rel.plt 的下标
- 第三条指令是跳转 `_dl_runtime_resolve()`

ELF 将 GOT 分成了两个表 .got 和 .got.plt，前者保存全局变量引用的地址，后者保存函数引用的地址

.got.plt（类似 .got）前 3 项是特殊的：

- 第 1 项是 .dynamic 段的地址
- 第 2 项是本模块的 ID
- 第 3 项是 `_dl_runtime_resolve()` 的地址

## 动态链接相关结构

动态链接器的路径是由 .interp 段（interpreter）决定的：
```bash
$ objdump -s a
...
Contents of section .interp:
 02a8 2f6c6962 36342f6c 642d6c69 6e75782d  /lib64/ld-linux-
 02b8 7838362d 36342e73 6f2e3200		   x86-64.so.2.
```

.dynamic 段保存了动态链接器需要的基本信息：比如依赖哪些共享对象、动态链接符号表的位置、动态链接重定位表的位置、共享对象初始化代码的地址；该段的结构是一个 `Elf32_Dyn` 数组：
```c
typedef struct {
	Elf32_Sword    d_tag;
	union {
		Elf32_Word d_val;
		Elf32_Addr d_ptr;
	} d_un;
} Elf32_Dyn;
```

| `d_tag` 类型			   | `d_un` 含义										 |
| ---					   | ---												 |
| `DT_SYMTAB`			   | 动态链接符号表地址，`d_ptr` 表示 .dynsym 地址		 |
| `DT_STRTAB`			   | 动态链接字符串表地址，`d_ptr` 表示 .dynstr 地址	 |
| `DT_STRSZ`			   | 动态里链接字符串表大小，`d_val` 表示大小			 |
| `DT_HASH`				   | 动态链接哈希表地址，`d_ptr` 表示 .hash 大小		 |
| `DT_SONAME`			   | 本共享对象的 SO-NAME								 |
| `DT_RPATH`			   | 动态链接共享对象的搜索路径							 |
| `DT_INIT`				   | 初始化代码地址										 |
| `DT_FINI`				   | 结束代码地址										 |
| `DT_NEEDED`			   | 依赖共享对象文件名，`d_ptr` 是其在 .dynstr 中的偏移 |
| `DT_REL`/`DT_RELA`	   | 动态链接重定位表地址								 |
| `DT_RELENT`/`DT_RELAENT` | 动态重读位表入口数量								 |

**动态符号表**：

- 与静态链接的 .symtab 类似，动态链接用到了 .dynsym；注意，前者包含了所有符号，包括 .dynsym，后者只包含动态符号
- .dynsym 的辅助字符串表 .dynstr（类似 .symtab 对应的 .strtab）；同时为了加速查找，还有 .hash

**动态链接重定位表**（类似 .rela.data 和 .rela.text）

- .rela.dyn 修正的是 .got
- .rela.plt 修正的是 .got.plt

动态链接重定位表也是 `Elf32_Rel` 数组，`Elf32_Rel->r_info` 的低 8 位，即类型变为以下值：

- `R_X86_64_RELATIVE`
- `R_X86_64_GLOB_DAT`
- `R_X86_64_JUMP_SLO`

```bash
$ readelf -r a
Relocation section '.rela.dyn' at offset 0x588 contains 8 entries:
  Offset		  Info			 Type			Sym. Value	  Sym. Name + Addend
000000003dd8  000000000008 R_X86_64_RELATIVE					1190	# .init_array
000000003de0  000000000008 R_X86_64_RELATIVE					1140	# .fini_array
000000004058  000000000008 R_X86_64_RELATIVE					4058	# .data
000000003fe0  000800000006 R_X86_64_GLOB_DAT 0000000000000000 __libc_start_main@GLIBC_2.2.5 + 0
Relocation section '.rela.plt' at offset 0x648 contains 7 entries:
  Offset		  Info			 Type			Sym. Value	  Sym. Name + Addend
000000004038  000600000007 R_X86_64_JUMP_SLO 0000000000000000 printf@GLIBC_2.2.5 + 0
```

ld 还需要知道可执行文件和本进程的其他一些信息：比如有几个 segment、每个 segment 的属性、程序的入口地址，这些信息通过栈传递给 ld，栈里面保存了辅助信息数组（Auxiliary Vector）
```c
typedef struct {
	uint32_t a_type;
	union {
		uint32_t a_val;
	} a_un;
} Elf32_auxv_t;
```
| `a_type`	  | `a_val` 含义						 |
| ---		  | ---									 |
| `AT_NULL`   | 辅助信息数组结束					 |
| `AT_EXECFD` | 表示可执行文件的 fd					 |
| `AT_PHDR`   | program header 在进程中的地址		 |
| `AT_PHENT`  | program header 中每一个 entry 的大小 |
| `AT_PHNUM`  | program header 的 entry 的数量		 |
| `AT_BASE`   | 动态链接器本身的装载地址			 |
| `AT_ENTRY`  | 可执行文件入口地址，即启动地址		 |

辅助信息数组在栈中的位置：环境变量指针的前面

## 动态链接的步骤和实现

1. 动态链接器自举（bootstrap）：由于还没有填充好 GOT，这阶段不能使用全局变量
	- 自举首先找到 ld 的 GOT (.got, .got.plt)，第一项就是 .dynamic 的偏移
	- 通过 .dynamic 获取 ld 的 .rela.plt 和 .dynsym
	- 对 .rela.dyn 的符号进行重定位，填写 .got
2. 装载共享对象：加载 .dynamic 中类型为 `DT_NEEDED` 的共享对象，并将其代码段和数据段映射到进程空间
3. 重定位和初始化：
	- 根据 rela.dyn 以及 .rela.plt，修正每个共享对象的 .got 和 .got.plt
	- 执行共享对象的 .init 段

动态链接器：是一个共享对象，还是一个可执行文件

- 对于静态链接的可执行文件，程序的入口就是 ELF header 的 `e_entry` 指定的入口
- 对于动态链接的可执行文件，内核先会分析 .interp 段，再将控制权交给 ld
- 内核没有分析 elf header 中的 `e_type` 是 `ET_EXEC` 还是 `ET_DYN`，因此 ld 可执行


## 显式运行时链接（Explicit Run-time linking）

让程序运行时加载指定的模块，在不需要时卸载模块，可以利用 ld 提供的 4 个 API：
```c
/* link with -ldl */
#include <dlfcn.h>
void *dlopen(const char *filename, int flags);
void *dlsym(void *handle, const char *symbol);
char *dlerror(void);
int dlclose(void *handle);

/* 另一个接口 */
#define _GNU_SOURCE
void *dlmopen (Lmid_t lmid, const char *filename, int flags);
void *dlvsym(void *handle, char *symbol, char *version);
```
`dlopen()`

- filename：可以是相对路径，按照动态库搜索路径规则
- flag：
	- `RTLD_LAZY` 表示使用 PLT，无法捕获错误
	- `RTLD_NOW` 表示立即进行函数绑定，若有符号未能绑定，`dlerror()` 可以捕获错误
	- `RTLD_GLOBAL` 可以跟前 2 个一起使用，表示加载模块的全局符号表合并到进程全局符号表
- 返回 handle 指针

`dlsym()` 找到符号，返回函数或变量的地址，若是常量，返回其值；对于常量为 NULL 或 0，可以使用 `dlerror()` 是否返回 NULL 来判断

```c
/* cc dlopen_demo.c -ldl */
int main(void) {
	void *handle;
	double (*cosine)(double);
	char *error;

	handle = dlopen(LIBM_SO, RTLD_LAZY);
	if (!handle) {
		exit(EXIT_FAILURE);
	}

	dlerror();    /* Clear any existing error */

	cosine = (double (*)(double)) dlsym(handle, "cos");
	error = dlerror();
	if (error != NULL) {
		exit(EXIT_FAILURE);
	}

	printf("%f\n", (*cosine)(2.0));
	dlclose(handle);
	exit(EXIT_SUCCESS);
}
```

