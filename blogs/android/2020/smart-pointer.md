---
title: Android 智能指针
date: 2020-12-16
tags:
 - C, Android
categories:
 - C-C++
---

# LightRefBase

LightRefBase 利用了 gnu c 提供的原子操作实现引用计数，手动调用 `incStrong()`/`decStrong()` 来增减引用计数，`decStrong()` 到达 0 后自动析构：
```cpp
/* system/core/libutils/include/utils/LightRefBase.h */
template <class T>
class LightRefBase
{
	void incStrong(const void* id) {
		mCount.fetch_add(1, std::memory_order_relaxed);
	}
	void decStrong(const void* id) {
		if (mCount.fetch_sub(1, std::memory_order_release) == 1) {
			std::atomic_thread_fence(std::memory_order_acquire);
			delete static_cast<const T*>(this);
		}
	}
	mutable std::atomic<int32_t> mCount;
};
```
