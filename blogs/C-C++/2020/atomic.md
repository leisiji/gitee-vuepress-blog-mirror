---
title: 原子操作
date: 2020-12-16
tags:
 - C
categories:
 - C-C++
---

# Memory Order

CPU 的顺序模型：

- 强顺序模型（TSO，Total Store Order）：即 CPU 执行的执行和汇编代码的顺序一致；如 x86 和 SPARK
- 弱内存模型（WMO，Weak Memory Ordering）：除非代码之间有依赖，否则需要程序员主动插入内存屏障指令来强化这个“可见性”

## 术语解释

sequenced-before

- 表示单线程之间的先后顺序和操作结果的可见性
- 如果 A sequenced-before B，除了表示 A 在 B 之前，还表示 A 的结果对 B 可见

happens-before

- 表示不同线程之间的操作先后顺序和操作结果的可见性
- 如果 A happens-before B，则 A 的内存状态将在 B 执行之前就可见

synchronizes-with

- 强调的是变量被修改之后的传播关系（propagate），即如果一个线程修改某变量的之后的结果能被其它线程可见
- 显然，synchronizes-with 一定是满足 happens-before

# C++ memory order

## memory_order_relaxed

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
// 最后的断言可能失败
```
`memory_order_relaxed` 的典型应用是计数器

## Acquire-Release

若线程 A 中的原子写是 `memory_order_release` ，而线程 B 同一变量的原子读是 `memory_order_acquire` ，则 A 对该变量原子写之前的所有内存写入（**非原子及 relax**），在线程 B 都是可见的，即 B 一旦完成原子读，B 可以保证读取到 A 写入内存的内容

> 注意，同步仅建立在 aquire 和 release 同一原子对象的线程之间，其他线程可能看到与被同步线程相异的内存访问顺序

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
反例：不同核看到的操作结果不同，在 thread c 可能看到是先 x 后 y，但在 thread d 可能是先 y 后 x
```cpp
void write_x() { x.store(true, std::memory_order_release); }
void write_y() { y.store(true, std::memory_order_release); }
void read_x_then_y()
{
	while (!x.load(std::memory_order_acquire))
		;
	if (y.load(std::memory_order_acquire))
		++z;
}
void read_y_then_x()
{
	while (!y.load(std::memory_order_acquire))
		;
	if (x.load(std::memory_order_acquire))
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
// 最后的断言可能失败
```
解决上面的问题需要用到 sequentially consistent

## Release-Consume

弱化版的 aquire-release

若线程 A 中的原子写是 `memory_order_release` ，而线程 B 同一变量的原子读写是 `memory_order_consume` ，则 A 对该变量原子写之前的所有内存写入（**非原子及 relax**），对于依赖线程 B 同一变量的原子读才是可见的，即 B 中依赖原子读的函数或操作符才可以看到 A 写入内存的内容

> 注意，同步仅建立在 release 和 consume 同一原子对象的线程间建立，其他线程可能见到与被同步线程相异的内存访问顺序

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

## memory_order_seq_cst

`memory_order_seq_cst` 对程序的执行结果有两个要求：

- 每个处理器的执行顺序和代码中的顺序（program order）一样
- 所有处理器都只能看到一种操作执行顺序

把 release-auqire 中失败例子的 memory order 全部换成 `memory_order_seq_cst` 可以断言成功

# fence

其实就是原子操作实现的原理之一，但是不依赖于特定的变量

分类：

- Release fence：可以防止 fence 前的内存操作重排到 fence 后的任意 store 之后，即阻止 load-store/store-store 重排
- Acquire fence：可以防止 fence 后的内存操作重排到 fence 前的任意 load 之前，即阻止 load-load/load-store 重排
- Full fence：Release fence 和 Acquire fence 的组合，即阻止 load-load/load-store/store-store 重排

```cpp
string* p = new string("Hello");
ptr.store(p, memory_order_release);

// 效果一样
string* p = new string("Hello");
atomic_thread_fence(memory_order_release);
ptr.store(p, memory_order_relaxed);
```
## Fence 和 Atomic 组合

### Fence-atomic synchronization

线程 A 的 release fence 操作 F 和线程 B 的 atomic-aquire 操作 Y 进行同步，如果满足以下条件

- X 是原子写入（以任意内存序）
- Y 读取了 X 写入的值
- 在线程 A，F 是 sequenced-before X 的

则线程 A 中所有 sequenced-before F 的原子写，都是 happens-before 线程 B 中所有在 Y 之后的非原子以及 relaxed 读操作

### Fence-fence synchronization

线程 A 的 release fence 操作 FA 和线程 B 的 acquire fence 操作 FB 进行同步，如果满足以下条件

- 存在 atomic object M
- 线程 A 存在对 M 的原子写入 X
- 在线程 A，FA 是 sequenced-before X 的
- 线程 B 存在原子读 Y（以任意内存序）
- Y 读取 X 写入的值
- 在线程 B，Y 是 sequenced-before FB 的

则线程 A 中所有 sequenced-before FA 的非原子以及 relaxed 写入，都是 happens-before 线程 B 中所有 FB 之后的非原子以及 relaxed 读操作

## 例子

```cpp
const int num_mailboxes = 32;
atomic<int> mailbox_receiver[num_mailboxes];
string mailbox_data[num_mailboxes];

// writer 线程负责更新非原子变量和 mailbox_receiver[i]
mailbox_data[i] = ...;
atomic_store_explicit(&mailbox_receiver[i], receiver_id, memory_order_release);

// reader 线程需要检查所有 mailbox[i]，但是只需要对其中一个进行同步
for (int i = 0; i < num_mailboxes; ++i) {
	if (atomic_load_explicit(&mailbox_receiver[i], memory_order_relaxed) == my_id) {
		atomic_thread_fence(memory_order_acquire); // synchronize with just one writer
		do_work( mailbox_data[i] ); // 保证 reader 线程可以观察到在 atomic_store_explicit() 之前的 writer 线程的所有写入
	}
}
```
引用计数也是类似，所有线程都需要检查是否到达 0，但是只有最后一个线程需要进行同步：
```cpp
// AOSP 的智能指针实现
void RefBase::decStrong(const void* id) {
	const int32_t c = refs->mStrong.fetch_sub(1, memory_order_release);
	if (c == 1) {
		atomic_thread_fence(memory_order_acquire);
		refs->mBase->onLastStrongRef(id);
		delete this;
	}
}
```

[参考1](https://zh.cppreference.com/w/cpp/atomic/memory_order), [参考2](https://en.cppreference.com/w/cpp/atomic/atomic_thread_fence), [参考3](https://www.codedump.info/post/20191214-cxx11-memory-model-1), [参考4](https://www.codedump.info/post/20191214-cxx11-memory-model-2)
