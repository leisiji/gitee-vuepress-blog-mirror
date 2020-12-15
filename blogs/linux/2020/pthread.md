---
title: pthread
date: 2020-03-26 21:26:24
tags:
 - thread
categories:
 - linux
---

以下的内容来自《The Linux Programming Interface》

# create

`pthread_create()` 在调用进程中启动一个线程
```c
int pthread_create(pthread_t *thread, const pthread_attr_t *attr,
					void *(*start_routine) (void *), void *arg);
```

- 新线程通过调用 `start_routine()` 来开始执行
- arg 是 `start_routine()` 的唯一参数
- `attr` 可为 NULL，使用默认参数

线程号通过 `pthread_self()` 获取：返回值当前调用线程的 tid
```c
pthread_t pthread_self(void);
```
新线程会在以下情况下终止：

- 新线程中调用 `pthread_exit()`
- 从参数 `start_routine` 对应的函数 return
- 被 `pthread_cancel()` 取消
- 同一个进程的任意线程调用 `exit()`

## attr

```c
/* 必须使用该接口初始化 */
int pthread_attr_init(pthread_attr_t *attr);
/* 初始化后，必须使用以下接口清理资源
 * 已经创建的线程不受该接口影响 */
int pthread_attr_destroy(pthread_attr_t *attr);
```

# join/detach

`pthread_join()` 将阻塞调用线程到 join 的线程结束
```c
/* 如果线程已经结束，join 会立刻返回 */
/* 若 retval 不是空，会将线程退出状态（pthread_exit）复制到 retval */
int pthread_join(pthread_t thread, void **retval);

int pthread_detach(pthread_t thread);

/* detachstate:
 * PTHREAD_CREATE_DETACHED, PTHREAD_CREATE_JOINABLE */
int pthread_attr_setdetachstate(pthread_attr_t *attr, int detachstate);
```

线程状态：`PTHREAD_CREATE_DETACHED`,`PTHREAD_CREATE_JOINABLE`

- join 表示线程之间互相通知对方结束，最后统一释放所有的线程资源，线程结束后不会释放栈资源
- 若为 JOINABLE，但是没有调用 `pthread_join()` 会导致类似僵尸进程的问题
- detach 表示线程之间不关心对方的结束，让操作系统在该线程结束时来回收它所占的资源（如栈资源）

线程默认为 JOINABLE，设置为 detach 需要调用其中之一：

- 在子线程调用 `pthread_detach(pthread_self())`
- 在父线程 `pthread_detach(thread_id)`
- 创建线程前设置线程属性 `pthread_attr_setdetachstate()`

`pthread_join()` 和 `waitpid()` 区别：

- join 是对等的，即等待的线程不需要有任何关系；后者只能是父进程 wait 子进程
- join 无法做到非阻塞，`waitpid(-1,&status,options)` 可以实现非阻塞等待

# 线程同步

## lock

pthread mutex 创建：

- `PTHREAD_MUTEX_INITIALIZER` 静态初始化
- `pthread_mutex_init()` 动态初始化，需要 `pthread_mutex_destroy()` 销毁
	- `attr` 可为 NULL，使用默认参数

```c
int pthread_mutex_init(pthread_mutex_t *restrict mutex,
			const pthread_mutexattr_t *restrict attr);
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
int pthread_mutex_destroy(pthread_mutex_t *mutex);
```
加锁和解锁：
```c
int pthread_mutex_lock(pthread_mutex_t *mutex);
int pthread_mutex_unlock(pthread_mutex_t *mutex);

/* try api 都是获取不到锁就直接返回 */
int pthread_mutex_trylock(pthread_mutex_t *mutex);

/* 超时获取不到锁就返回，errno 设置 ETIMEDOUT */
int pthread_mutex_timedlock(pthread_mutex_t *restrict mutex,
		const struct timespec *restrict abstime);
```
mutex 属性：
```c
int pthread_mutexattr_init(pthread_mutexattr_t *attr);
int pthread_mutexattr_destroy(pthread_mutexattr_t *attr);
int pthread_mutexattr_settype(pthread_mutexattr_t *attr, int type);
/* type:
 * PTHREAD_MUTEX_NORMAL, PTHREAD_MUTEX_ERRORCHECK,
 * PTHREAD_MUTEX_RECURSIVE */
```

## 条件变量

一个线程通过条件变量通知其他线程，即线程间通信，常用于生产者和消费者模型：
```c
#include <pthread.h>
int pthread_condattr_destroy(pthread_condattr_t *attr);
int pthread_condattr_init(pthread_condattr_t *attr);
/* 除了 init 还可以使用静态初始化 */
pthread_cond_t cond = PTHREAD_COND_INITIALIZER;

int pthread_cond_signal(pthread_cond_t *cond);
int pthread_cond_broadcast(pthread_cond_t *cond);

/* 调用前必须对 mutex 加锁，否则返回 PTHREAD_MUTEX_ERRORCHECK */
int pthread_cond_wait(pthread_cond_t *cond, pthread_mutex_t *mutex);
int pthread_cond_timedwait(pthread_cond_t *cond,
		pthread_mutex_t *mutex, const struct timespec *abstime);
```
`pthread_cond_signal()` 只能唤醒一个线程，`pthread_cond_broadcast()` 可以唤醒所有等待条件变量的线程

`pthread_cond_wait()`

- 被调用时自动将 mutex 解锁再等待（两个动作合起来是原子的）：
	- 若消费者先解锁后等待，则生产者可能在两个动作之间完成生产（`pthread_cond_signal()`）、加锁，导致消费者错过这次信号
- 成功返回（被唤醒）会对 mutex 自动加锁

```c
// 例子：https://zhuanlan.zhihu.com/p/55123862
// Thread Consumer
pthread_mutex_lock(&mutex);
while (false == ready) {
	pthread_cond_wait(&cond, &mutex);
}
ready = false;
pthread_mutex_unlock(&mutex);
// Thread Producer
pthread_mutex_lock(&mutex);
ready = true;
pthread_cond_signal(&cond);
pthread_mutex_unlock(&mutex);
```
检查条件时使用 while 而非 if：若有 2 个消费者同时被唤醒，其中一个拿到锁后消费，最后释放锁，另一个拿到锁后肯定是没有东西可消费了；用 while 可以使另一个消费者再进入等待状态

# 其他

## 多线程只执行一次的函数

```c
int pthread_once(pthread_once_t *once_control,
		void (*init_routine)(void));
pthread_once_t once_control = PTHREAD_ONCE_INIT;
```

## 特定线程的数据

`pthread_key_create()` 创建 key：

- destructor 用于线程结束时清除线程的数据
- 比如线程进行 malloc 后，将地址传到 `pthread_setspecific()` 中
- 线程通过 `pthread_getspecific()` 获取 malloc 的数据

```c
int pthread_key_create(pthread_key_t *key, void (*destructor)(void*));
int pthread_setspecific(pthread_key_t key, const void *value);
void *pthread_getspecific(pthread_key_t key);
```
实现一个线程安全的 strerr:
```c
#define MAX_ERR_LEN 64
static pthread_key_t strerrKey;
static pthread_once_t once = PTHREAD_ONCE_INIT;
void destructor(void *buf) { free(buf); }
void createKey() {
	int s = pthread_key_create(&strerrKey, destructor);
	if (s != 0) exit(1);
}
char *strerr(int err) {
	char *buf;

	int s = pthread_once(&once, createKey);
	if (s != 0) exit(1);

	buf = pthread_getspecific(strerrKey);
	if (NULL == buf) {
		buf = malloc(MAX_ERR_LEN);
		if (NULL == buf) exit(1);

		s = pthread_setspecific(strerrKey, buf);
		if (s < 0) exit(1);
	}

	if (err < 0 || err > _sys_nerr || _sys_errlist[err] == NULL) {
		snprintf(buf, MAX_ERR_LEN, "Unknown error:%d", err);
	} else {
		strncpy(buf, _sys_errlist[err], MAX_ERR_LEN - 1);
		buf[MAX_ERR_LEN - 1] = '\0';
	}

	return buf;
}
```
默认的 key 最多是 `_POSIX_THREAD_KEYS_MAX`（128），通过 `sysconf(_SC_THREAD_KEYS_MAX)` 可以提高上限到 1024

> **Thread-Local Storage**，比如之前的线程安全 strerr 可通过 `static __thread buf[MAX_ERROR_LEN];` 来实现：`__thread` 只能跟在 static 或 extern 关键字后

# 取消线程

相关 API：
```c
int pthread_cancel(pthread_t thread);

/* 设置取消状态：可取消和无法取消 */
int pthread_setcancelstate(int state, int *oldstate);
/* PTHREAD_CANCEL_DISABLE, PTHREAD_CANCEL_ENABLE */

/* 设置取消类型 */
int pthread_setcanceltype(int type, int *oldtype);
/* type:
 * PTHREAD_CANCEL_ASYNCHRONOUS：可随时取消，较少用到
 * PTHREAD_CANCEL_DEFERRED：线程取消会被推迟到 cancellation point，默认
 */

/* 在调用线程创建一个 cancellation point
 * 使得没有 cancellation point 的线程也能被取消 */
void pthread_testcancel(void);
```

- Cancellation Points 通常是会引起阻塞的函数
- 因此一个线程若没有 cancellation point，被取消后也能执行完成

可以设置退出时调用的函数（称为线程清理处理程序）

- 多个清理函数保存在栈中，执行顺序与注册时的顺序相反
- 清理函数的执行时机：`pthread_exit()`, `pthread_cancel()`, `pthread_cleanup_pop(e>0)`

```c
void pthread_cleanup_push(void (*routine)(void *), void *arg);
void pthread_cleanup_pop(int execute);
```

# FURTHER DETAILS

## Thread Stacks

x86-32 的线程栈的默认大小是 2MB，以下函数可以控制栈的大小和起始位置
```c
int pthread_attr_setstack(pthread_attr_t *attr,
						 void *stackaddr, size_t stacksize);
int pthread_attr_getstack(const pthread_attr_t *attr,
						 void **stackaddr, size_t *stacksize);
```
`sysconf(_SC_THREAD_STACK_MIN)` 可以设置线程栈的最小值

## Threads and signals

- 信号默认行为和信号处理函数的注册（`sigaction()`）都是进程级别的
- 信号的发送可以到达线程级别，以下情况是线程级别的信号：
	- 某个线程导致的 hardware exception：SIGBUS,SIGFPE,SIGILL,SIGSEGV
	- 某个线程导致 SIGPIPE
	- 使用 `pthread_kill()` 或 `pthread_sigqueue()` 发送的信号
- 信号发送到进程时，内核会随机选择一个线程来运行信号处理函数
- signal mask 是线程级的，在线程创建会被继承：`pthread_sigmask()` 可以拦截信号，从而可使发送到进程的信号指向某个线程

```c
#include <signal.h>
#include <pthread.h>
int pthread_kill(pthread_t thread, int sig);
/* 类似 sigqueue() */
int pthread_sigqueue(pthread_t thread, int sig,
						const union sigval value);
int pthread_sigmask(int how, const sigset_t *set, sigset_t *oldset);
```

