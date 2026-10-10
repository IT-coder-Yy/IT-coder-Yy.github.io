---
title: "Python 可变对象与请求状态隔离"
description: "从对象绑定解释 Python 参数传递，复现可变默认参数、类属性和浅拷贝导致的共享状态，使用 None 哨兵与 dataclass 默认工厂修复，并说明深拷贝和 frozen 的边界，避免把跨请求数据串用误判为模型或数据库问题。"
publishedAt: 2026-09-08
updatedAt: 2026-10-07
category: "系统与部署"
tags: [Python, 可变对象, 状态隔离, dataclass]
draft: false
featured: false
---

服务里偶发出现“新请求带着上一轮消息”，不一定是缓存或数据库问题。Python 中一个共享列表、类属性或浅拷贝后的嵌套字典，就足以让两个逻辑上独立的请求修改同一对象。排查时应先确认状态在哪里创建、谁持有引用。

## 参数传递不是按类型选两套规则

Python 赋值建立名称到对象的绑定，不会自动复制对象。[Python copy 文档](https://docs.python.org/3/library/copy.html)

函数形参同样绑定到传入对象。重新给形参赋值只改变局部绑定；修改列表或字典内部内容，则会影响持有同一对象的调用方。不能概括为“不可变类型传值，可变类型传引用”。

下面各代码块均可独立使用 Python 3 标准库运行。

```python
def mutate(items):
    items.append("new")

def rebind(items):
    items = ["local"]
    return items

source = ["old"]
mutate(source)
assert source == ["old", "new"]
assert rebind(source) == ["local"]
assert source == ["old", "new"]
```

元组不可变也不代表其成员不可变，例如元组中的列表仍能被修改；关键是具体操作修改了哪一个对象。

## 默认参数只在定义时求值

默认列表不会在每次调用时重新创建。函数定义后，多次省略这个参数的调用会访问同一个对象。[Python 默认参数说明](https://docs.python.org/3/tutorial/controlflow.html#default-argument-values)

```python
def unsafe_add(value, items=[]):
    items.append(value)
    return items

first = unsafe_add("A")
second = unsafe_add("B")
assert first is second
assert first == ["A", "B"]

def add(value, items=None):
    if items is None:
        items = []
    items.append(value)
    return items

assert add("A") == ["A"]
assert add("B") == ["B"]
```

修复后的函数仍会修改调用方显式传入的列表，这是接口选择，不是默认参数问题。如果契约要求不修改输入，应在进入函数时另行复制所需数据。

## 类属性可能被所有实例共享

`messages = []` 放在类体内是共享属性。`self.messages.append(...)` 查到它后修改列表，不会自动生成实例副本。把列表放到 `__init__` 中，或为 dataclass 使用 `default_factory`，才会为每个实例新建容器。

```python
from dataclasses import dataclass, field

@dataclass
class RequestState:
    messages: list[str] = field(default_factory=list)

a = RequestState()
b = RequestState()
a.messages.append("hello")
assert a.messages == ["hello"]
assert b.messages == []
assert a.messages is not b.messages
```

`default_factory` 在需要默认值时调用工厂，而不是复用一个预先创建的列表。[dataclasses 文档](https://docs.python.org/3/library/dataclasses.html#default-factory-functions)

## 浅拷贝只分离外层容器

```python
from copy import deepcopy

original = {"settings": {"limit": 3}}
shallow = original.copy()
shallow["settings"]["limit"] = 5
assert original["settings"]["limit"] == 5

independent = deepcopy(original)
independent["settings"]["limit"] = 9
assert original["settings"]["limit"] == 5
```

深拷贝适合分离可复制的数据结构，不适合盲目复制连接池、文件句柄、锁或服务客户端。更清楚的做法通常是：共享只读配置和客户端，每个请求显式创建消息、结果和执行状态。

## frozen 不是递归不可变

dataclass 的 `frozen=True` 限制属性赋值，不会自动冻结字段里的列表和字典。需要不可变快照时，应选择不可变字段结构，或在边界显式序列化与重建。

状态隔离也不是并发同步。如果多个任务有意共享可变对象，仍需锁、数据库事务或单一所有者等机制；“每次复制一下”不能替代一致性设计。

## 用双请求测试发现串用

测试应创建两个独立状态，交错执行修改，再检查消息、计数和结果是否相互影响。若预期共享客户端，可断言它被复用；若预期隔离消息，应断言容器不同且内容独立。

这样的测试比只跑一次正常请求更容易暴露默认参数、实例属性和嵌套容器带来的共享状态。
