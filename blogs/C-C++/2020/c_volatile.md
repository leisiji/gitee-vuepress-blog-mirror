---
title: C 语言的 volatile 关键字
date: 2020-05-29
tags:
 - C
categories:
 - C-C++
---

# volatile

`volatile` 只在编译器层面优化，告诉编译器不要从寄存器中读取变量值，无法防止多线程同时写变量的问题，而且看出只能用于一个线程写另一个线程读的情况，使用情况非常狭窄，因此要避免使用

展示 volatile 作用的一个例子：
```c
// 不加 volatile，开启 -O3 会发现 thread2 永远无法退出
static volatile int thread_var = 1;
void *thread1(void *arg) {
	sleep(1);
	thread_var = 1000;
	return NULL;
}
void *thread2(void *arg) {
	while (thread_var != 1000) {}
	thread_var = 2000;
	return NULL;
}
int main(int argc, char *argv[]) {
	pthread_t thread1_tid, thread2_tid;
	pthread_create(&thread1_tid, NULL, thread1, NULL);
	pthread_create(&thread2_tid, NULL, thread2, NULL);
	pthread_join(thread1_tid, NULL); pthread_join(thread2_tid, NULL);
	return 0;
}
/* thread2() 没有 volatile 的情况
   cmpl   $0x3e8,0x2eae(%rip) # 0x4048 <thread_var>
   jne    0x11b0 <thread2+32>
   ....
   jmp    0x11b0 <thread2+32>
   # 这里没有优化为寄存器变量，但是最后直接跳回了自己
 */
```

volatile 危害是明显的，不能保护多线程对变量的读写：
```c
_Atomic int acnt;
volatile int cnt;

void *adding(void *input)
{
	for(int i = 0; i < 10000; i++) {
		acnt++;
		cnt++;
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
上面的例子：atomic 保护了多线程的变量，volatile 无法保护

linux 内核中也是禁止使用 volatile 的（Documentation/volatile-considered-harmful.txt）

