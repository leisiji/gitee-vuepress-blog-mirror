(window.webpackJsonp=window.webpackJsonp||[]).push([[15],{649:function(s,t,a){"use strict";a.r(t);var n=a(30),e=Object(n.a)({},(function(){var s=this,t=s.$createElement,a=s._self._c||t;return a("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[a("h1",{attrs:{id:"memory-model"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#memory-model"}},[s._v("#")]),s._v(" memory-model")]),s._v(" "),a("p",[a("a",{attrs:{href:"mp.weixin.qq.com/s/5INg0GlniXcZ1nLJWRwq4Q"}},[s._v("参考")]),s._v("，详细参考 memory-model.rst")]),s._v(" "),a("p",[s._v("linux 的 3 种内存模型，代表了物理内存页的 3 种管理方式：")]),s._v(" "),a("ul",[a("li",[s._v("flat memory model")]),s._v(" "),a("li",[s._v("Discontiguous memory model (deprecated)")]),s._v(" "),a("li",[s._v("sparse memory model")])]),s._v(" "),a("h2",{attrs:{id:"flatmem"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#flatmem"}},[s._v("#")]),s._v(" FLATMEM")]),s._v(" "),a("p",[s._v("物理地址空间是一个连续的，没有空洞的地址空间，管理非常简单：")]),s._v(" "),a("ul",[a("li",[a("code",[s._v("struct page")]),s._v(" 的数组（"),a("code",[s._v("mem_map")]),s._v("），每个条目指向一个 page frame")]),s._v(" "),a("li",[a("code",[s._v("PFN - ARCH_PFN_OFFSET")]),s._v(" 就是 "),a("code",[s._v("mem_map")]),s._v(" 数组的索引")])]),s._v(" "),a("div",{staticClass:"language-c line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-c"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/* include/asm-generic/memory_model.h */")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token macro property"}},[a("span",{pre:!0,attrs:{class:"token directive-hash"}},[s._v("#")]),a("span",{pre:!0,attrs:{class:"token directive keyword"}},[s._v("define")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token macro-name function"}},[s._v("__pfn_to_page")]),a("span",{pre:!0,attrs:{class:"token expression"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("pfn"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("mem_map "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("+")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("pfn"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v(" ARCH_PFN_OFFSET"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")])])]),s._v("\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br")])]),a("h2",{attrs:{id:"sparsemem"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#sparsemem"}},[s._v("#")]),s._v(" SPARSEMEM")]),s._v(" "),a("p",[s._v("因为 DISCONTIGMEM 的 "),a("code",[s._v("node_mem_map")]),s._v(" 是连续的数组，hotplug 会导致数组不连续")]),s._v(" "),a("p",[s._v("SPARSEMEM 主要是为了支持 memory hotplug")]),s._v(" "),a("ul",[a("li",[s._v("分配足够多的 "),a("code",[s._v("mem_section")]),s._v("，组成一个数组 "),a("code",[s._v("mem_sections")])]),s._v(" "),a("li",[s._v("没有对应内存的 "),a("code",[s._v("mem_section")]),s._v(" 指向 NULL，hotplug 后指向对应的 "),a("code",[s._v("struct page")]),s._v(" 数组")])]),s._v(" "),a("p",[a("code",[s._v("mem_section")]),s._v(" 相比 FLATMEM 就是内存的粒度更细了：比如一个 "),a("code",[s._v("mem_section")]),s._v(" 可以表示 128M 内存，"),a("code",[s._v("mem_map")]),s._v(" 表示支持的最大内存")]),s._v(" "),a("h3",{attrs:{id:"实现"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#实现"}},[s._v("#")]),s._v(" 实现")]),s._v(" "),a("ul",[a("li",[s._v("物理内存由多个任意大小的 section（"),a("code",[s._v("struct mem_section")]),s._v("）构成，因此物理内存可视为一个 "),a("code",[s._v("mem_section")]),s._v(" 数组")]),s._v(" "),a("li",[a("code",[s._v("mem_section::section_mem_map")]),s._v(" 会指向 "),a("code",[s._v("struct page")]),s._v(" 数组")]),s._v(" "),a("li",[s._v("PFN 的高位用作查找哪个 "),a("code",[s._v("mem_section")]),s._v("，而 PFN 的低位则是 "),a("code",[s._v("struct page")]),s._v(" 的索引")])]),s._v(" "),a("div",{staticClass:"language-c line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-c"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/* include/linux/mmzone.h */")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("struct")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("mem_section")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("unsigned")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("long")]),s._v(" section_mem_map"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 指向 struct page 数组的指针")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("struct")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("mem_section_usage")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("*")]),s._v("usage"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token macro property"}},[a("span",{pre:!0,attrs:{class:"token directive-hash"}},[s._v("#")]),a("span",{pre:!0,attrs:{class:"token directive keyword"}},[s._v("define")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token macro-name function"}},[s._v("__pfn_to_page")]),a("span",{pre:!0,attrs:{class:"token expression"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("pfn"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("                                   ")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("\\")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token expression"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("                                                       ")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("\\")]),s._v("\n        "),a("span",{pre:!0,attrs:{class:"token expression"}},[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("unsigned")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("long")]),s._v(" __pfn "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("pfn"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("                         ")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("\\")]),s._v("\n        "),a("span",{pre:!0,attrs:{class:"token expression"}},[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("struct")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("mem_section")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("*")]),s._v("__sec "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("__pfn_to_section")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("__pfn"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v(" ")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("\\")]),s._v("\n        "),a("span",{pre:!0,attrs:{class:"token expression"}},[a("span",{pre:!0,attrs:{class:"token function"}},[s._v("__section_mem_map_addr")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("__sec"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("+")]),s._v(" __pfn"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("               ")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("\\")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token expression"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")])])]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 1. 通过 PFN 的高位获取 mem_section：pfn -> nr -> section")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("struct")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("mem_section")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("*")]),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("__pfn_to_section")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("unsigned")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("long")]),s._v(" pfn"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("return")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("__nr_to_section")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("pfn_to_section_nr")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("pfn"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("unsigned")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("long")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("pfn_to_section_nr")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("unsigned")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("long")]),s._v(" pfn"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("return")]),s._v(" pfn "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">>")]),s._v(" PFN_SECTION_SHIFT"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("struct")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("mem_section")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("*")]),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("__nr_to_section")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("unsigned")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("long")]),s._v(" nr"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// CONFIG_SPARSEMEM_EXTREME 没有开启，mem_section 二维数组每行只有一个元素")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("return")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("&")]),s._v("mem_section"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("SECTION_NR_TO_ROOT")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("nr"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),s._v("nr "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("&")]),s._v(" SECTION_ROOT_MASK"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/* mm/sparse.c */")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("struct")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("mem_section")]),s._v(" mem_section"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),s._v("NR_SECTION_ROOTS"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),s._v("SECTIONS_PER_ROOT"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 2. 返回 mem_section 所指向的 struct page 数组")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("struct")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("page")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("*")]),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("__section_mem_map_addr")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("struct")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("mem_section")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("*")]),s._v("section"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("unsigned")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("long")]),s._v(" map "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" section"),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("->")]),s._v("section_mem_map"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n    map "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("&=")]),s._v(" SECTION_MAP_MASK"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("return")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("struct")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("page")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("*")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("map"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br"),a("span",{staticClass:"line-number"},[s._v("19")]),a("br"),a("span",{staticClass:"line-number"},[s._v("20")]),a("br"),a("span",{staticClass:"line-number"},[s._v("21")]),a("br"),a("span",{staticClass:"line-number"},[s._v("22")]),a("br"),a("span",{staticClass:"line-number"},[s._v("23")]),a("br"),a("span",{staticClass:"line-number"},[s._v("24")]),a("br"),a("span",{staticClass:"line-number"},[s._v("25")]),a("br"),a("span",{staticClass:"line-number"},[s._v("26")]),a("br"),a("span",{staticClass:"line-number"},[s._v("27")]),a("br"),a("span",{staticClass:"line-number"},[s._v("28")]),a("br"),a("span",{staticClass:"line-number"},[s._v("29")]),a("br"),a("span",{staticClass:"line-number"},[s._v("30")]),a("br"),a("span",{staticClass:"line-number"},[s._v("31")]),a("br"),a("span",{staticClass:"line-number"},[s._v("32")]),a("br"),a("span",{staticClass:"line-number"},[s._v("33")]),a("br"),a("span",{staticClass:"line-number"},[s._v("34")]),a("br")])]),a("p",[s._v("缺点：")]),s._v(" "),a("ol",[a("li",[a("code",[s._v("mem_section")]),s._v(" 如果太大，初始化的时间太长")]),s._v(" "),a("li",[a("code",[s._v("pfn_to_page")]),s._v(" 中间多了一次 "),a("code",[s._v("mem_section")]),s._v(" 的转化，多了一次内存访问")])]),s._v(" "),a("h2",{attrs:{id:"sparsemem-vmemmap"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#sparsemem-vmemmap"}},[s._v("#")]),s._v(" SPARSEMEM_VMEMMAP")]),s._v(" "),a("p",[s._v("通过 "),a("code",[s._v("CONFIG_SPARSEMEM_VMEMMAP")]),s._v(" 打开该功能：")]),s._v(" "),a("ul",[a("li",[s._v("只有一个 "),a("code",[s._v("struct page")]),s._v(" 数组，"),a("code",[s._v("struct page *vmemmap")]),s._v(" 是数组的起始地址")]),s._v(" "),a("li",[a("code",[s._v("vmemmap")]),s._v(" 指向的数组是在虚拟地址上连续的，需要预留一段虚拟地址来保存映射关系")]),s._v(" "),a("li",[s._v("PFN 就是对应的 "),a("code",[s._v("struct page")]),s._v(" 在 "),a("code",[s._v("vmemmap")]),s._v(" 的索引")])]),s._v(" "),a("div",{staticClass:"language-c line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-c"}},[a("code",[a("span",{pre:!0,attrs:{class:"token macro property"}},[a("span",{pre:!0,attrs:{class:"token directive-hash"}},[s._v("#")]),a("span",{pre:!0,attrs:{class:"token directive keyword"}},[s._v("define")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token macro-name function"}},[s._v("__pfn_to_page")]),a("span",{pre:!0,attrs:{class:"token expression"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("pfn"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("vmemmap "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("+")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("pfn"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")])])]),s._v("\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br")])]),a("p",[s._v("x86-64 linux 默认使用 "),a("code",[s._v("SPARSEMEM_VMEMMAP")])]),s._v(" "),a("p",[a("code",[s._v("vmemmap")]),s._v(" 的实现和具体的处理器体系有关")]),s._v(" "),a("div",{staticClass:"language-c line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-c"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/* arch/x86/include/asm/pgtable_64.h */")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token macro property"}},[a("span",{pre:!0,attrs:{class:"token directive-hash"}},[s._v("#")]),a("span",{pre:!0,attrs:{class:"token directive keyword"}},[s._v("define")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token macro-name"}},[s._v("vmemmap")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token expression"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("struct")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("page")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("*")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("VMEMMAP_START"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")])])]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token macro property"}},[a("span",{pre:!0,attrs:{class:"token directive-hash"}},[s._v("#")]),a("span",{pre:!0,attrs:{class:"token directive keyword"}},[s._v("define")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token macro-name"}},[s._v("VMEMMAP_START")]),s._v("      "),a("span",{pre:!0,attrs:{class:"token expression"}},[s._v("vmemmap_base")])]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/* arch/x86/kernel/head64.c */")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("unsigned")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("long")]),s._v(" vmemmap_base "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" __VMEMMAP_BASE_L4"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 0xffffea0000000000UL")]),s._v("\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br")])]),a("p",[s._v("完成 "),a("code",[s._v("vmemmap")]),s._v(" 虚拟地址映射的是 "),a("code",[s._v("vmemmap_populate_basepages()")]),s._v("（也会根据 arch 来实现 "),a("code",[s._v("vmemmap_populate")]),s._v("）")]),s._v(" "),a("div",{staticClass:"language-c line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-c"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("int")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("vmemmap_populate_basepages")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("unsigned")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("long")]),s._v(" start"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("unsigned")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("long")]),s._v(" end"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("int")]),s._v(" node"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("unsigned")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("long")]),s._v(" addr "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" start"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("for")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v(" addr "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("<")]),s._v(" end"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v(" addr "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("+=")]),s._v(" PAGE_SIZE"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n        pgd "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("vmemmap_pgd_populate")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("addr"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" node"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n        "),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 之后是分别对 pud, pmd, pte 进行类似的初始化")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("pgd_t")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("*")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("vmemmap_pgd_populate")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("unsigned")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("long")]),s._v(" addr"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("int")]),s._v(" node"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token class-name"}},[s._v("pgd_t")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("*")]),s._v("pgd "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("pgd_offset_k")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("addr"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("vmemmap_alloc_block_zero")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("PAGE_SIZE"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" node"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("return")]),s._v(" pgd"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("/* 使用内核的 pgd，而不是用户程序的，说明内核也可以使用类似用户态的虚拟地址 */")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[s._v("// 内核的 pgd 被保存在 init_mm::pgd")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token macro property"}},[a("span",{pre:!0,attrs:{class:"token directive-hash"}},[s._v("#")]),a("span",{pre:!0,attrs:{class:"token directive keyword"}},[s._v("define")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token macro-name function"}},[s._v("pgd_offset_k")]),a("span",{pre:!0,attrs:{class:"token expression"}},[a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("address"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("       "),a("span",{pre:!0,attrs:{class:"token function"}},[s._v("pgd_offset")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("&")]),s._v("init_mm"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("address"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")])])]),s._v("\n")])]),s._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[s._v("1")]),a("br"),a("span",{staticClass:"line-number"},[s._v("2")]),a("br"),a("span",{staticClass:"line-number"},[s._v("3")]),a("br"),a("span",{staticClass:"line-number"},[s._v("4")]),a("br"),a("span",{staticClass:"line-number"},[s._v("5")]),a("br"),a("span",{staticClass:"line-number"},[s._v("6")]),a("br"),a("span",{staticClass:"line-number"},[s._v("7")]),a("br"),a("span",{staticClass:"line-number"},[s._v("8")]),a("br"),a("span",{staticClass:"line-number"},[s._v("9")]),a("br"),a("span",{staticClass:"line-number"},[s._v("10")]),a("br"),a("span",{staticClass:"line-number"},[s._v("11")]),a("br"),a("span",{staticClass:"line-number"},[s._v("12")]),a("br"),a("span",{staticClass:"line-number"},[s._v("13")]),a("br"),a("span",{staticClass:"line-number"},[s._v("14")]),a("br"),a("span",{staticClass:"line-number"},[s._v("15")]),a("br"),a("span",{staticClass:"line-number"},[s._v("16")]),a("br"),a("span",{staticClass:"line-number"},[s._v("17")]),a("br"),a("span",{staticClass:"line-number"},[s._v("18")]),a("br")])])])}),[],!1,null,null,null);t.default=e.exports}}]);