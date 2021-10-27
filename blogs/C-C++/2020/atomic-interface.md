---
title: 原子操作接口
date: 2020-12-18
tags:
 - C
categories:
 - C-C++
---

# 原子接口

## GCC Classic atomic

```c
// 取值
type __sync_fetch_and_add (type *ptr, type value, ...)
type __sync_fetch_and_sub (type *ptr, type value, ...)
type __sync_fetch_and_or (type *ptr, type value, ...)
type __sync_fetch_and_and (type *ptr, type value, ...)
type __sync_fetch_and_xor (type *ptr, type value, ...)
type __sync_fetch_and_nand (type *ptr, type value, ...)

// 取值更改后再写入
type __sync_add_and_fetch (type *ptr, type value, ...)
// 相当于以下操作
{ *ptr op= value; return *ptr; }
```

以上函数原子完成了以下操作：

```c
{ tmp = *ptr; *ptr op= value; return tmp; }
```

上面是 GCC 的内置原子操作，如果特定处理器上没有实现，会给出 warninig

- type 必须是长度为 1、2、4 或 8 个字节的任何整数标量或指针类型
- 这些 builtins 都是 full-barrier (compile 和 CPU 都有 barrier)

memory barrier 类型分别对应 linux kernel 里面的 `wmb()`, `rmb()`, `mb()`

Memory Barrier:

```c
// Compiler Barrier
#define ACCESS_ONCE(x)      (*(volatile typeof(x) *)&(x))
#define READ_ONCE(x)        ({ typeof(x) ___x = ACCESS_ONCE(x); ___x; })
#define WRITE_ONCE(x, val)  ({ ACCESS_ONCE(x) = (val); })
#define barrier()           __asm__ __volatile__("": : :"memory")

// GCC classic full barrier
__sync_synchronize (...)
```

`ACCESS_ONCE` 用于告诉不要因为优化而将多次内存访问合并称为一次，例子如下：

```c
for (;;) {
    struct task_struct *owner;
    owner = ACCESS_ONCE(lock->owner);
    if (owner && !mutex_spin_on_owner(lock, owner))
        break;
}
// 如果去掉 ACCESS_ONCE，由于 lock->owner 在 for 中并没有被修改
// 因此可能被编译器优化为
struct task_struct *owner;
owner = lock->owner;
for (;;) {
    if (owner && !mutex_spin_on_owner(lock, owner))
        break;
}
```

## C11 atomic

C11 Atomic types 声明语法：`_Atomic (type_name)` 或 `_Atomic type_name`

```c
// 两种声明 atomic int 方法
_Atomic(int) a; // or
_Atomic int b; // both of them are the atomic integer

// use-defined struct atomic types
struct Node {
    int x;
    struct Node *next;
};
_Atomic struct Node s; //s is also an atomic type
```

### 例子

```c
_Atomic int acnt; int cnt;
void *adding(void *input) {
    for(int i = 0; i < 10000; i++) {
        acnt++; cnt++;
    }
    return NULL;
}
int main() {
    pthread_t tid[10];
    for(int i = 0; i < 10; i++) {
        pthread_create(&tid[i], NULL, adding, NULL);
    }
    for(int i = 0; i < 10; i++) {
        pthread_join(tid[i], NULL);
    }
    printf("acnt is %d, cnt is %d\n", acnt, cnt);
    return 0;
}
// 结果：acnt is 100000, the value of cnt is 89824
```

C11 提供了一些功能来以原子方式更改 user-defined atomic types 的内容，注意操作类型需要是 `_Atomic`

```c
#include <stdatomic.h>
// Return: current value of the atomic variable pointed to by obj.
C atomic_load( const volatile A* obj );
C atomic_load_explicit( const volatile A* obj, memory_order order );

void atomic_store( volatile A* obj , C desired);
void atomic_store_explicit( volatile A* obj, C desired, memory_order order );

_Bool atomic_compare_exchange_strong( volatile A* obj,
                                      C* expected, C desired );
_Bool atomic_compare_exchange_weak( volatile A *obj,
                                    C* expected, C desired );
_Bool atomic_compare_exchange_strong_explicit( volatile A* obj,
                                               C* expected, C desired,
                                               memory_order succ,
                                               memory_order fail );

// atomic_compare_exchange_strong 的作用跟以下代码是相同的
if (memcmp(obj, expected, sizeof *obj) == 0)
    memcpy(obj, &desired, sizeof *obj);
else
    memcpy(expected, obj, sizeof *obj);
```

例子：

```c
static int _Atomic thread_var = 1;
atomic_store(&thread_var, 1000);
atomic_load(&thread_var);
```

[参考1](https://lumian2015.github.io/lockFreeProgramming/c11-features-in-currency.html)
[参考2](https://gcc.gnu.org/onlinedocs/gcc-4.1.2/gcc/Atomic-Builtins.html)
