---
title: "从 Q、K、V 理解 Self-Attention：权重如何变成上下文特征"
description: "沿着投影、点积、缩放、Softmax 和加权求和推导 Self-Attention，明确矩阵形状、因果掩码、多头与位置编码的职责，并给出可运行的 NumPy 示例，纠正无限记忆和直接输出标签的误解。"
publishedAt: 2025-04-18
updatedAt: 2026-10-02
category: "论文阅读"
tags: [Transformer, Self-Attention, QKV, NumPy]
draft: false
featured: false
---

Self-Attention 可以理解为：每个位置提出查询，与允许访问的位置比较，再按权重汇总这些位置携带的信息。它输出的是上下文相关的特征，不是天然已经决定好的分类标签。

这篇文章从个人课程笔记出发，按 [Attention Is All You Need](https://arxiv.org/html/1706.03762v7) 的标准缩放点积注意力重新整理。矩阵统一使用“每行一个 token”的约定；换成列向量约定时，乘法方向也必须随之改变。

## Q、K、V 来自可学习投影

设输入 `X` 有 N 个 token，每个 token 的特征维度是 D：

```text
Q = X Wq
K = X Wk
V = X Wv
```

Q 表达当前位置需要寻找什么，K 表达其他位置可以如何被匹配，V 表达被选中后汇总的内容。这是理解作用的比喻，不意味着每一维都有稳定的人类语义。

在 Self-Attention 中，三者来自同一组输入特征，但投影矩阵不同。Cross-Attention 则可以由一组特征提供 Q，另一组特征提供 K 与 V。它们的区别不在于是否使用 Softmax。

单头情况下，形状可以写为：

| 对象 | 形状 | 含义 |
| --- | --- | --- |
| X | N × D | 输入特征 |
| Q、K | N × dk | 查询与匹配表示 |
| V | N × dv | 被汇总的信息 |
| QKᵀ | N × N | 每个查询与各位置的分数 |
| Attention 输出 | N × dv | 每个位置的新特征 |

## 缩放、归一化和汇总

标准计算是：

```text
scores = Q Kᵀ / sqrt(dk)
weights = softmax(scores，沿 key 维度)
output = weights V
```

Softmax 对每个 query 的一行分数归一化。若对错误的轴操作，就会得到另一个含义的权重。每行输出是 V 中各位置向量的加权和。

除以 `sqrt(dk)` 是为了控制点积的尺度。可以用分量独立、均值零、方差一的简化假设理解：dk 增大时点积方差随之增大，分数过大可能让 Softmax 过度尖锐。这不是对训练后特征分布的精确保证。

Attention 权重也不能直接当作“模型最终判断的完整解释”。后续还有投影、残差、归一化与其他层，最终结果并不只由一张权重图决定。

## 可运行的单头计算

以下 Python 3 + NumPy 示例只覆盖二维、单头的数学计算，不包含训练、dropout、batch 和 KV cache。`allowed` 中 true 表示可以访问该位置。

```python
import numpy as np


def attention(q, k, v, allowed=None):
    q, k, v = [np.asarray(x, dtype=np.float64) for x in (q, k, v)]
    if any(x.ndim != 2 for x in (q, k, v)):
        raise ValueError("需要二维 Q、K、V")
    if q.shape[1] == 0 or q.shape[1] != k.shape[1]:
        raise ValueError("Q 与 K 的特征维度必须一致且非零")
    if k.shape[0] == 0 or k.shape[0] != v.shape[0]:
        raise ValueError("K 与 V 的位置数必须一致且非零")

    scores = q @ k.T / np.sqrt(q.shape[1])
    if allowed is not None:
        allowed = np.asarray(allowed, dtype=bool)
        if allowed.shape != scores.shape or not allowed.any(axis=1).all():
            raise ValueError("掩码形状必须匹配，且每行至少允许一个位置")
        scores = np.where(allowed, scores, -np.inf)

    scores -= scores.max(axis=1, keepdims=True)
    weights = np.exp(scores)
    weights /= weights.sum(axis=1, keepdims=True)
    return weights @ v, weights


q = k = np.eye(2)
v = np.array([[10.0, 0.0], [0.0, 20.0]])
output, weights = attention(q, k, v)
print(weights.round(3))
# [[0.67 0.33]
#  [0.33 0.67]]

causal = np.tril(np.ones((2, 2), dtype=bool))
output, weights = attention(q, k, v, causal)
print(output[0])  # [10.  0.]
```

减去每行最大值是数值稳定处理，不改变 Softmax 的结果。所有位置都被遮挡的一行没有正常的权重分布，这里直接拒绝，而不是默默产生 NaN。

示例把 Q 与 K 设为单位矩阵，只是为了看清计算，不表示实际模型会如此学习。真实模型中的投影权重由训练获得。

## 因果掩码为什么放在 Softmax 前

自回归生成时，位置 i 不能访问未来位置。将不允许的分数设为负无穷，再做 Softmax，对应权重就变成零。

训练可以同时计算多个已知位置，但仍需因果约束。生成时通常要逐步产生下一个 token，所以“Attention 可以并行”不等于“所有自回归输出可以同时生成”。

Padding mask 解决的是无效填充位置，causal mask 解决的是未来信息泄漏，两者用途不同。不同库的布尔掩码约定也可能相反，应读接口文档而不是照抄这里的 true 语义。

## 多头和位置编码各自补充什么

多头让不同投影子空间分别计算注意力，再拼接并通过输出投影。常见实现使用一次大投影后拆分 head；数学上对应多个头的可学习投影，不是把同一份结果简单重复多次。

没有位置信息的 Self-Attention 对输入排列缺少直接的顺序描述。位置编码、相对位置机制等提供序列结构；它们不是将 Q、K、V 的角色重新定义。

原始 Transformer 使用正弦位置编码，ViT 等模型可以使用可学习位置嵌入。具体方法应随模型核对，不能把一个模型的做法当成所有 Transformer 的固定规定。

## 最后纠正两个常见说法

“Transformer 具有无限长记忆”不准确。上下文长度、位置机制、训练分布与硬件都有限制；标准密集注意力的分数矩阵还随序列长度呈平方增长。更长输入也不保证所有远距离事实都会被正确利用。

“Self-Attention 输入几个向量就输出几个标签”也不准确。这里通常输出对应数量的上下文特征；要做分类或生成，还需相应的任务头与整体模型设计。先看张量形状，再看任务目标，比只记 Q 是查询、K 是键、V 是值更可靠。
