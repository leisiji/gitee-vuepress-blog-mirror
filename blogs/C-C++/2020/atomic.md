---
title: 原子操作
date: 2021-10-27
tags:
 - C
categories:
 - C-C++
---

# Memory Order

[参考1](www.codedump.info/post/20191214-cxx11-memory-model-1)，[参考2](www.codedump.info/post/20191214-cxx11-memory-model-2)

- 内存顺序描述了计算机 CPU 读写内存的顺序
- 内存操作的乱序既可能发生在编译器编译期间（指令重排）或 CPU 指令执行期间（乱序执行）

CPU 的顺序模型：

- 强顺序模型（TSO，Total Store Order）：即 CPU 执行的执行和汇编代码的顺序一致；如 x86 和 SPARK
- 弱内存模型（WMO，Weak Memory Ordering）：除非代码之间有依赖，否则需要程序员主动插入内存屏障指令来强化这个“可见性”

下面的例子在 x86 可能都是执行成功的，在 ARM 才可能 assert 失败

## 术语介绍

sequenced-before

- 表示单线程之间的先后顺序和操作结果的可见性
- 如果 A sequenced-before B，除了表示 A 在 B 之前，还表示 A 的结果对 B 可见

happens-before

- 表示不同线程之间的操作先后顺序和操作结果的可见性
- 如果 A happens-before B，则 A 的内存状态将在 B 执行之前就可见

synchronizes-with

- 强调的是变量被修改之后的传播关系（propagate），即如果一个线程修改某变量的之后的结果能被其它线程可见
- 显然，synchronizes-with 一定是满足 happens-before

## memory-order

### memory_order_relaxed

`memory_order_relaxed` 特点：

- 仅要求一个变量的读写是原子操作
- 在单个线程内，该变量的所有原子操作是顺序进行的
- 不同线程之间针对该变量的访问操作先后顺序不能得到保证，即有可能乱序

```cpp
atomic<bool> x, y;
atomic<int> z;
void write_x_then_y()
{
    x.store(true, memory_order_relaxed);
    y.store(true, memory_order_relaxed);
}
void read_y_then_x()
{
    while (!y.load(memory_order_relaxed))
        ;
    if (x.load(memory_order_relaxed))
        ++z;
}
int main()
{
    x = false;
    y = false;
    z = 0;
    thread a(write_x_then_y);
    thread b(read_y_then_x);
    a.join(); b.join();
    assert(z.load() != 0);
}
// 最后的断言可能失败，因为 a 线程不保证先写 x 再写 y
```

`memory_order_relaxed` 的典型应用是计数器

### Acquire-Release

[参考](zh.cppreference.com/w/cpp/atomic/memory_order)

- 前提：若线程 A 中的原子写是 `memory_order_release` ，线程 B 同一变量的原子读是 `memory_order_acquire`
- 效果：A 对该变量原子写之前的所有内存写入（**非原子及 relax**），在线程 B 都是可见的，保证 B 可以读取到 A 写入内存的内容
- 形象一点，把 aquire-release 看作加锁的临界区，临界区内的代码不会跑出 lock-unlock 的边界

```cpp
atomic<string*> ptr;
int data;
void producer() {
    string* p = new string("Hello");
    data = 42;
    ptr.store(p, memory_order_release);
}
void consumer() {
    string* p2;
    while (!(p2 = ptr.load(memory_order_acquire)))
        ;
    assert(*p2 == "Hello"); // 绝无问题
    assert(data == 42); // 绝无问题
}
int main() {
    thread t1(producer);
    thread t2(consumer);
    t1.join(); t2.join();
}
```

注意，aquire/release 只对同一线程的变量有同步作用，以下就是反例：

- 不同核看到的操作结果不同，在 thread c 可能看到是先 x 后 y，但在 thread d 可能是先 y 后 x
- 因为 x 和 y 是在不同线程的 release，没有顺序关系，若在同一线程可以 assert 成立

```cpp
void write_x() { x.store(true, memory_order_release); }
void write_y() { y.store(true, memory_order_release); }
void read_x_then_y()
{
    while (!x.load(memory_order_acquire))
        ;
    if (y.load(memory_order_acquire))
        ++z;
}
void read_y_then_x()
{
    while (!y.load(memory_order_acquire))
        ;
    if (x.load(memory_order_acquire))
        ++z;
}
int main()
{
    x = false;
    y = false;
    z = 0;
    std::thread a(write_x);
    std::thread b(write_y);
    std::thread c(read_x_then_y);
    std::thread d(read_y_then_x);
    a.join(); b.join(); c.join(); d.join();
    assert(z.load() != 0);
}
// 最后的断言可能失败，因为 x 和 y 是在不同的线程，内存序相当于没有作用
```

解决上面的问题需要用到 sequentially consistent

### Release-Consume

弱化版的 aquire-release，顺序关系只和内存序作用的变量有关

- 若线程 A 中的原子写是 `memory_order_release` ，线程 B 同一变量的原子读写是 `memory_order_consume`
- 则 A 对该变量原子写之前的所有内存写入（**非原子及 relax**），对于依赖线程 B 同一变量的原子读才是可见的
- 即 B 中依赖原子读的函数或操作符才可以看到 A 写入内存的内容

```cpp
atomic<string*> ptr;
int data;
void producer() {
    string* p = new string("Hello");
    data = 42;
    ptr.store(p, memory_order_release);
}
void consumer() {
    string* p2;
    while (!(p2 = ptr.load(memory_order_consume)))
        ;
    assert(*p2 == "Hello"); // 绝无出错：*p2 依赖原子 ptr 的读取
    assert(data == 42); // 可能会出错：data 不依赖原子 ptr 的读取
}
int main() {
    thread t1(producer);
    thread t2(consumer);
    t1.join(); t2.join();
}
```

### consistent

`memory_order_seq_cst` 对程序的执行结果有两个要求：

- 每个处理器的执行顺序和代码中的顺序（program order）一样
- 所有处理器都只能看到**一种执行顺序**

把 release-auqire 中失败例子的 memory order 全部换成 `memory_order_seq_cst` 可以断言成功

## fence

其实就是原子操作实现的原理之一，但是不依赖于特定的变量

分类：

- Release fence：防止 fence 前的内存操作重排到 fence 后的 store 之后，即阻止 load-store/store-store 重排
- Acquire fence：防止 fence 后的内存操作重排到 fence 前的 load 之前，即阻止 load-load/load-store 重排
- Full fence：release 和 acquire fence 的组合，阻止 load-load/load-store/store-store 重排

```cpp
string* p = new string("Hello");
ptr.store(p, memory_order_release);

// 效果一样
string* p = new string("Hello");
atomic_thread_fence(memory_order_release);
ptr.store(p, memory_order_relaxed);
```

### Fence 和 Atomic 组合

[参考](en.cppreference.com/w/cpp/atomic/atomic_thread_fence)

### Fence-atomic synchronization

线程 A 的 release fence 操作 F 和线程 B 的 atomic-aquire 操作 Y 进行同步，如果满足以下条件

- X 是原子写入（以任意内存序）
- Y 读取了 X 写入的值
- 在线程 A，F 是 sequenced-before X 的

则 A 所有 sequenced-before F 的原子写，都是 happens-before B 中所有在 Y 之后的非原子以及 relaxed 读操作

### Fence-fence synchronization

线程 A 的 release fence 操作 FA 和线程 B 的 acquire fence 操作 FB 进行同步，如果满足以下条件

- 存在 atomic object M
- 线程 A 存在对 M 的原子写入 X
- 在线程 A，FA 是 sequenced-before X 的
- 线程 B 存在原子读 Y（以任意内存序）
- Y 读取 X 写入的值
- 在线程 B，Y 是 sequenced-before FB 的

则 sequenced-before FA 的非原子以及 relaxed 写，都会 happens-before FB 之后的非原子以及 relaxed 读

## 例子

```cpp
const int num_mailboxes = 32;
atomic<int> mailbox_receiver[num_mailboxes];
string mailbox_data[num_mailboxes];

// writer 线程：负责更新非原子变量 mailbox_data 和 mailbox_receiver[i]
mailbox_data[i] = ...;
atomic_store_explicit(&mailbox_receiver[i], receiver_id, memory_order_release);

// reader 线程
for (int i = 0; i < num_mailboxes; ++i) {
    if (atomic_load_explicit(&mailbox_receiver[i],
            memory_order_relaxed) == my_id) {
        // acquire 保证 reader 观察到 atomic_store_explicit 前的写入（mailbox_data）
        atomic_thread_fence(memory_order_acquire);
        do_work(mailbox_data[i]);
    }
}
```

引用计数

- `memory_order_release`：使得 `fetch_sub` 能够先于 `decWeak`，则 strong 先于 weak 减 1
- `memory_order_acquire`：个人认为这是多余的；但 mailbox 的例子需要读取 `mailbox_data` 需要这个 flag

```cpp
// AOSP 的智能指针实现
void RefBase::decStrong(const void* id) {
    weakref_impl* refs = mRefs;
    const int32_t c = refs->mStrong.fetch_sub(1, memory_order_release);
    if (c == 1) {
        atomic_thread_fence(memory_order_acquire); // unnecessary?
        delete this;
    }
    refs->decWeak(id);
}
```
