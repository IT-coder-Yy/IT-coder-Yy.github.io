---
title: "vLLM 的 KV Cache 与推理调度"
description: "从 Prefill 和 Decode 两阶段解释 KV Cache 的容量、PagedAttention 的块管理和连续批处理，区分前缀复用与分块预填充，并用常规注意力模型的容量估算说明为什么提高并发、上下文和显存利用率需要共同权衡。"
publishedAt: 2026-09-04
updatedAt: 2026-10-07
category: "系统与部署"
tags: [vLLM, KV Cache, PagedAttention, 推理服务]
draft: false
featured: false
---

同一个模型能放入显存，不代表它能稳定服务长上下文和高并发。推理时除了权重，还要容纳不断增长的 KV Cache、临时计算和运行时开销。理解这些组成，比直接复制一组服务参数更有用。

## Prefill 与 Decode 的工作不同

Prefill 处理输入上下文，计算需要保留的注意力键值；Decode 根据已有状态逐步生成后续 Token，并继续更新缓存。

长输入会增加首 Token 等待，长输出会延长生成过程并占用缓存。实际瓶颈还取决于模型、批量、硬件和内核，不能简单把所有 Prefill 都归为纯计算瓶颈、所有 Decode 都归为纯带宽瓶颈。

## KV Cache 容量的教学估算

对每层都有常规注意力、统一缓存精度的 decoder，缓存原始数据量可近似写成：

```text
2 × 层数 × KV 头数 × 每头维度 × 缓存 Token 数 × 每元素字节数
```

前面的 2 表示 Key 和 Value。GQA 的 KV 头数可能小于 Query 头数，不能把两者混用。下面的 Python 3 标准库计算使用合成配置，估算单条序列缓存，不是某个真实模型的部署测量。

```python
layers, kv_heads, head_dim = 32, 8, 128
tokens, bytes_per_element = 4096, 2
kv_bytes = 2 * layers * kv_heads * head_dim * tokens * bytes_per_element
assert kv_bytes == 512 * 1024**2
```

总容量还包括多条序列、块取整、元数据和其他开销。滑动窗口、混合注意力、状态空间模型、量化缓存与跨请求共享会改变计算方式；这个公式不能直接套到所有架构，也不能直接当作多卡单卡占用。

## PagedAttention 管理动态缓存

PagedAttention 以块管理 KV Cache，并通过映射关系访问逻辑序列，减少连续预留和碎片带来的浪费，支持一定的共享。它改善的是缓存管理，不是把每个 Token 需要的键值数据变成零。[PagedAttention 论文](https://arxiv.org/abs/2309.06180)

连续批处理则在调度过程中接纳新请求、移除完成请求，而不是等待整个固定批次全部结束。实际性能收益依赖请求分布，论文中的实验结果不能直接当成另一台机器的保证。

## 前缀缓存与分块预填充

自动前缀缓存复用已有共享前缀的 KV 计算，主要减少重复 Prefill，不直接减少新 Token 的 Decode 计算。语义类似的文本不代表具有可复用的相同前缀；前部内容变化也会影响后续复用。[vLLM 前缀缓存](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/)

Chunked Prefill 把长输入的预填充分块，与 Decode 请求共同调度，改善长输入对其他生成请求的干扰。它不是缩短模型上下文，也不是把输入摘要化。[vLLM 调度优化](https://docs.vllm.ai/en/latest/configuration/optimization/#chunked-prefill)

## 并发与上下文共享同一预算

提高最大上下文和并发上限，都会增加可能需要的缓存容量。提高显存利用配置也不保证更稳定：还应给其他进程、临时缓冲和运行时留出余量。

多卡的 TP、PP 或 EP 会改变权重、缓存与通信分布，但增加卡数不一定降低延迟；同步成本和模型结构都需要测量。配置项默认值和可用参数会随版本演进，应固定版本并核对对应官方文档。

## 测量用户可感知的服务质量

记录输入与输出长度分布、并发、首 Token 时间、Token 间延迟、端到端延迟、吞吐和失败率，并区分冷启动、冷缓存与热缓存。

只报告总 Token 每秒，可能掩盖某些请求长时间排队。更有意义的调优目标，是在指定负载和延迟要求下保持稳定，而不是把每个容量参数都调到最大。
