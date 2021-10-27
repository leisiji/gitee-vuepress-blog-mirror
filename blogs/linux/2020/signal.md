---
title: linux 中信号的使用
date: 2020-05-29
tags:
 - c
categories:
 - linux
---

以下的内容来自《The Linux Programming Interface》

# linux signal

## 基本概念

信号分类：

- hardware exception：比如段错误、除以 0 操作 (SIGBUS,SIGFPE,SIGILL,SIGSEGV)
- 信号通过终端的特殊字符产生的信号，比如 ctrl+c(interrupt), ctrl+z(suspend)
- software event，比如 fd 可读、定时器结束、子进程终止

signal 处理方式：1. 忽略信号 2. 进程终止 3. 产生 core dump 4. 进程挂起 5. 进程从挂起恢复运行

信号处理过程可以被其他信号打断

常用信号分类和含义：

| 信号    | 含义                                                         |
| ---     | ---                                                          |
| SIGABRT | `abort()` 会发送该信号，之后进程终止并产生 core dump         |
| SIGALRM | `alarm()`/`setitimer()` 设置的定时器到时会产生该信号         |
| SIGBUS  | bus error 会产生该信号，比如访问超出了 `mmap()`              |
| SIGCHLD | 当子进程终止时，父进程会收到该信号                           |
| SIGCONT | 停止的进程接受该信号会重新运行，运行进程则是默认忽略         |
| SIGFPE  | 数学错误(floating-point exception)，如除以 0                 |
| SIGHUP  | hang up 进程                                                 |
| SIGINT  | 中断进程                                                     |
| SIGIO   | IO 事件信号，`fcntl()` 设置捕获信号                          |
| SIGKILL | 无法被拦截、忽略、捕获                                       |
| SIGPWR  | power failure signal，在电池即将耗尽前将系统正常关闭         |
| SIGQUIT | 前台程序接收退出字符（ctrl+\）会产生，行为是终止和 core dump |
| SIGSEGV | 访问的内存页不存在（heap, stack），或者访问到只读内存        |
| SIGSTOP | 停止进程，无法被拦截、忽略、捕获                             |
| SIGTERM | kill 默认发送的信号，用于终止进程，可以被进程捕获来清理资源  |
| SIGTRAP | 实现 debugger 断点、系统调用跟踪，具体 `man strace/ptrace`   |
| SIGUSR1 | 用户定义信号，可以用于进程同步                               |

## signal API

```c
#include<signal.h>
void ( *signal(int sig, void (*handler)(int)) )(int);
```

- 第二个参数，指向对 sig 信号的新处理函数，有三种：
  - 自定义的信号处理函数
  - `SIG_DFL` 表示将处理方式还原为默认
  - `SIG_IGN` 表示处理方式为忽略该信号
- 返回值是执行之前的 sig 信号的处理函数的指针，失败则返回 `SIG_ERR`
- 如果需要再次捕获该信号，需要再次调用 `signal()`

```c
void newhandler(int sig){}
void (*prevhandler)(int); //存储修改之前的信号处理函数
prehandler = signal(SIGINT, newhandler);
if(prehandler == SIG_ERR)
    printf("Error in signal\n");
if(signal(SIGINT, prevhandler) == SIG_ERR)/* 还原 */
    printf("Error in signal\n");
```

### 发送信号

`kill()` 用于一个进程向另一个进程发送信号：

```c
#include <sys/types.h>
#include <signal.h>
int kill(pid_t pid, int sig);
int pthread_kill(pthread_t thread, int sig);/* 将信号发送到线程 */
```

- pid 为 0，信号会发送到进程组的每个进程
- pid 为 -1，如果调用者有权限，信号会被发送到除了 init 外的所有进程
- pid 小于 -1，发送到为 -pid 的进程组
- 返回值为 -1，errno 为 `ESRCH` 时，表示目标进程不存在，`EPERM` 表示没有权限

发送信号权限的规则：

- 拥有目标进程所在命名空间的 `CAP_KILL` 权限
- init 只能收到设置了信号 handler 的信号，以防被意外杀死
- 发送进程的实际或有效 user ID 等于目标进程的实际或保存的 set-user-ID
- SIGCONT 只能发送到同一个 session 的进程

检查进程是否存在：

- `wait()` 可用于检测子进程是否存在
- 信号量或文件锁：目标进程持有锁，若获取到锁表示进程已不存在
- IPC channel，比如 pipe 或 FIFO：目标进程一直往 channel 写，若检测到 EOF 表示目标进程终止
- 用 `stat()` 查看 `/proc/PID`

其他发送信号的方式：

```c
#include <signal.h>
int raise(int sig);
// 相当于 kill(getpid(), sig)
// 多线程环境下则是相当于 pthread_kill(pthread_self(), sig)

int killpg(int pgrp, int sig);
// 相当于 kill(-pgrp, sig);

/* 向指定的 pid 发送信号
 * 参数 value 会传递给 sigaction 作为其入参 */
int sigqueue(pid_t pid, int sig, const union sigval value);
union sigval {
    int   sival_int;
    void *sival_ptr;
};
```

### signal set/mask

```c
#include <signal.h>
// 初始化
int sigemptyset(sigset_t *set);
// 填充所有的信号到 set
int sigfillset(sigset_t *set);
int sigaddset(sigset_t *set, int sig);
int sigdelset(sigset_t *set, int sig);
int sigismember(const sigset_t *set, int sig);
```

signal mask 用于拦截发往本进程的信号（也可以是线程 `pthread_sigmask()`）

```c
#include <signal.h>
int sigprocmask(int how, const sigset_t *restrict set,
        sigset_t *restrict oset);


/* 在临界区中 block SIGINT */
sigset_t prevMask, intMask;
sigemptyset(&intMask);
sigaddset(&intMask, SIGINT);

sigprocmask(SIG_BLOCK, &intMask, &prevMask);
// critical section
sigprocmask(SIG_SETMASK, &prevMask, NULL);
```

- how：`SIG_BLOCK`（添加到 set）, `SIG_UNBLOCK`, `SIG_SETMASK`（直接修改 set）
- oset：若不为 NULL，返回修改前的 signal set

以下方式会使信号添加到 signal mask：

- signal handler 被调用时，对应的信号会自动加到 signal mask，防止执行 signal handler 被重复调用
- `sigaction()` 可以指定在处理 signal handler 时要拦截的信号
- `sigprocmask()` 可以显式添加信号到 signal mask

pending signal:

- 若接收到被拦截的信号，则该信号被添加到待处理信号集合（pending signal），如果之后解除拦截，该信号会被再次发送到进程
- pending signal 不会排队，比如发送了多个信号，如果调度器还没有调度到目标进程，目标进程可能只会收到一个信号

获取 pending signal set：

```c
int sigpending(sigset_t *set);
```

### sigaction

和 `signal()` 类似，`sigaction()` 也可以设置 signal handler，`sigaction()` 的可移植性更好：

```c
int sigaction(int sig, const struct sigaction *restrict act,
   struct sigaction *restrict oact);

typedef void (*__sighandler_t) (int);
struct sigaction {
    __sighandler_t sa_handler;
    sigset_t sa_mask;           /* 处理 signal handler 拦截的信号集 */
    int sa_flags;               /* Flags controlling handler invocation  */
    void (*sa_restorer) (void); /* Restore handler.  */
};


// 例子，使用 SIGINFO 获取更多入参
// 发送信号需要使用 sigqueue() 来提供多出的入参
struct sigaction act;

sigemptyset(&act.sa_mask);
act.sa_sigaction = handler;
act.sa_flags = SA_RESTART | SA_SIGINFO;

if (sigaction(SIGRTMIN + 5, &act, NULL) == -1)
    exit(1);
```

`sa_flags` 用于改变特定信号的行为：

- `SA_NODEFER`：在 signal handler 执行时，不要将信号加到 signal mask
- `SA_ONSTACK`：使用了 `sigaltstack()` 的栈作为 signal handler 的栈
- `SA_RESETHAND`：捕获信号后，在调用 signal handler 前将其恢复默认
- `SA_RESTART`：自动开始被 signal handler 中断的系统调用；如果没有设置该标志，系统调用会返回 `EINTR`
- `SA_SIGINFO`：为 signal handler 提供额外的参数

### SIGINFO

如果 `sigaction()` 使用了 `SA_SIGINFO`，`struct sigaction` 其实是更加复杂的，从而通过 `siginfo_t` 来提供更多信号相关的函数入参：

```c
struct sigaction {
    union {
        void (*sa_handler)(int);
        void (*sa_sigaction)(int, siginfo_t *, void *);
    } __sigaction_handler;
    sigset_t   sa_mask;
    int        sa_flags;
    void     (*sa_restorer)(void);
};

/* 精简版结构，去掉了 union */
typedef struct {
    int     si_signo;         /* Signal number */
    int     si_code;          /* Signal code: 指明了信号来源 */
    int     si_trapno;        /* Trap number for hardware-generated signal
                                 (unused on most architectures) */
    union sigval si_value;    /* Accompanying data from sigqueue() */
    pid_t   si_pid;           /* Process ID of sending process */
    uid_t   si_uid;           /* Real user ID of sender */
    int     si_errno;         /* Error number (generally unused) */
    void   *si_addr;          /* Address that generated signal
                                 (hardware-generated signals only) */
    int     si_overrun;       /* Overrun count (Linux 2.6, POSIX timers) */
    int     si_timerid;       /* (Kernel-internal) Timer ID
                                 (Linux 2.6, POSIX timers) */
    long    si_band;          /* Band event (SIGPOLL/SIGIO) */
    int     si_fd;            /* File descriptor (SIGPOLL/SIGIO) */
    int     si_status;        /* Exit status or signal (SIGCHLD) */
    clock_t si_utime;         /* Child's User CPU time (SIGCHLD) */
    clock_t si_stime;         /* Child's System CPU time (SIGCHLD) */
} siginfo_t;
```

- `si_signo` 是触发的信号值
- `si_code` 是 `si_signo` 的进一步描述
  - 比如 `si_signo = SIGBUS`，`si_code` 可以是 `BUS_ADRALN`(非法地址对齐), `BUS_ADRERR`(不存在的物理地址)...
- `si_value`：信号是通过 `sigqueue()` 发送，该字段才有意义
- `si_addr`：一般是硬件相关信号用到的：SIGBUS, SIGSEGV，此时表示访问的非法地址

## signal stack

信号处理使用额外（alternate）的栈，防止调用进程超出栈限制：

```c
int sigaltstack(const stack_t *restrict ss, stack_t *restrict oss);

typedef struct {
    void *ss_sp;
    int ss_flags;
    size_t ss_size;
} stack_t;

// 例子
if ((sigstk.ss_sp = malloc(SIGSTKSZ)) == NULL)
   /* Error return. */
sigstk.ss_size = SIGSTKSZ;
sigstk.ss_flags = 0;
if (sigaltstack(&sigstk,(stack_t *)0) < 0)
   perror("sigaltstack");
```

- `oss`：如果之前创建过栈，oss 返回之前的值；该参数也可以传 NULL
- `ss_flags` 可取：
  - `SS_ONSTACK` 表示当前进程正在 alternate signal stack 上，需要建立一个新的
  - `SS_DISABLE` 表示禁止使用额外的信号处理栈

## 系统调用被信号中断

`sigaction()` 使用 `SA_RESTART` 标志后，以下函数会自动重新开始：

```c
// 等待子进程的
wait(), waitpid(), wait3(), wait4(), waitid()

// 当以下 IO 系统调用被用在 slow device 时，返回中断时刻已传输的字节数
read(), readv(), write(), writev(), ioctl()

open()

// socket 相关的；但如果 setsockopt() 设置了超时，不会自动开始
accept(), accept4(), connect(), send(), sendmsg(), sendto(), recv(), recvfrom(), recvmsg()

// IO 的消息队列
mq_receive(), mq_timedreceive(), mq_send(), mq_timedsend()

// 锁或信号量操作
flock(), fcntl(), lockf(), futex(), sem_wait(), sem_timedwait()
pthread_mutex_lock(), pthread_mutex_trylock(), pthread_mutex_timedlock(), pthread_cond_wait(), pthread_cond_timedwait()
```

以下是绝不会重新启动的：

```c
// IO 复用相关
poll(), ppoll(), select(), pselect()
epoll_wait(), epoll_pwait()
io_getevents()

// System V 的消息队列和信号量操作
semop(), semtimedop(), msgrcv(), msgsnd()

read() // from an inotify file descriptor

// 挂起操作，包括信号相关的挂起
sleep(), nanosleep(), clock_nanosleep()
pause(), sigsuspend(), sigtimedwait(), sigwaitinfo()
```

将信号修改为 `SA_RESTART` 标志：

```c
int siginterrupt(int sig, int flag);
```

## 信号的更多特性

等待信号

```c
// 将进程挂起，直到捕获到一个信号：
// 总是返回 -1，且 errno 设置为 EINTR
#include <unistd.h>
int pause(void);

// 将调用线程的 signal mask 替换为参数值
// 并将线程挂起，直到收到有对应的 signal handler 或终止进程的信号
int sigsuspend(const sigset_t *sigmask);

/* 等待信号，并将信号传递的参数返回到 info */
int sigwaitinfo(const sigset_t *restrict set, siginfo_t *restrict info);
// 带超时的等待信号
int sigtimedwait(const sigset_t *restrict set,
        siginfo_t *restrict info,
        const struct timespec *restrict timeout);
```

`sigsuspend()` 会将进程的 signal mask 替换为参数的 `sigmask`

产生 SIGABRT 信号，即终止进程并 core dump

```c
#include <stdlib.h>
void abort(void);
```

特殊的信号：

- SIGKILL, SIGSTOP 的默认行为都不能更改：`signal()`, `sigaction()` 试图绑定这两个信号都会返回错误
- SIGCONT 用于恢复停止的进程（SIGSTOP,SIGTSTP,SIGTTIN,SIGTTOU），无论是否 block 或忽略了 SIGCONT

睡眠任务的 3 种状态：

- `TASK_INTERRUPTIBLE`：进程在等待事件（比如终端输入，锁释放），如果信号到来，操作会被打断且进程会被唤醒
- `TASK_UNINTERRUPTIBLE`：进程在等待某些特殊的事件（比如完成 IO 读取），此时进程不会接受信号
- `TASK_KILLABLE`(linux2.6.25)：类似 `TASK_UNINTERRUPTIBLE`，但是会在接收到 fatal 信号的时候唤醒进程

## Realtime Signals

POSIX.1b 中定义了 Realtime signals（范围是 `SIGRTMIN`~`SIGRTMAX`）

- 同一个 rt 信号发送了多次，进程会接收多次
- rt 信号可以附带数据（`int` 或 `void*`），接收方可以收到该数据
- 如果多个 rt 信号处于 pending，数值最小的信号会优先被处理；标准信号则是根据发送时间排序

发送 rt 信号：

```c
int sigqueue(pid_t pid, int sig, const union sigval value);
union sigval {
    int   sival_int;
    void *sival_ptr;
};
```

注册需要使用 `SA_SIGINFO` 的 flag，使 handler 获取数据，数据在 `siginfo_t->si_value`

## signalfd

```c
int signalfd(int fd, const sigset_t *mask, int flags);

// 例子
sigset_t mask;
int sfd, s;
struct signalfd_siginfo fdsi;

sigemptyset(&mask);
sigaddset(&mask, SIGINT);
sigprocmask(SIG_BLOCK, &mask, NULL);

sfd = signalfd(-1, &mask, 0);
s = read(sfd, &fdsi, sizeof(struct signalfd_siginfo));
if (s != sizeof(struct signalfd_siginfo))
    exit(1);
printf("got signal %d\n", fdsi.ssi_signo);
if (fdsi.ssi_code == SI_QUEUE) {
    printf("ssi_pid = %d; ", fdsi.ssi_pid);
    printf("ssi_int = %d\n", fdsi.ssi_int);
}
```

- fd 若是 -1，则是创建一个可以读取 signal mask 的 fd 并作为返回值
- fd 若非 -1，则是修改对应 signalfd 对应的 mask
- mask 指定了通过创建的 fd 可以读取的信号
- flag 可取值：`SFD_CLOEXEC`，`SFD_NONBLOCK`

signalfd 通过 read() 来读取，返回的结构如下：

```c
/* sys/signalfd.h */
struct signalfd_siginfo {
    uint32_t ssi_signo;
    int32_t ssi_errno;
    int32_t ssi_code;
    uint32_t ssi_pid;
    uint32_t ssi_uid;
    int32_t ssi_fd;
    uint32_t ssi_tid;
    uint32_t ssi_band;
    ...
};
```
