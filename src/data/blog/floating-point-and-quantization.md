---
title: "FP16 BF16 TF32 与量化的精度边界"
description: "区分浮点数的动态范围与有效精度，比较 FP32、FP16 和 BF16 的位分配，解释 TF32 为什么是运算模式而非通用存储类型，并梳理整数量化、累加精度和端到端误差评测，避免把位宽大小直接等同于模型质量。"
publishedAt: 2026-09-28
updatedAt: 2026-10-07
category: "视觉与推理"
tags: [FP16, BF16, TF32, 量化, 数值精度]
draft: false
featured: false
---

“16 位比 32 位精度低”只能解释一部分问题。模型运行是否稳定，还取决于指数范围、有效位数、运算和累加方式，以及误差是否会被后续计算放大。存储 dtype、算子内部精度和最终输出应分开看。

## 动态范围与精度是两条轴

| 格式 | 符号位 | 指数位 | 显式小数位 | 主要特点 |
| --- | --- | --- | --- | --- |
| FP32 | 1 | 8 | 23 | 范围较大，表示间隔较细 |
| FP16 | 1 | 5 | 10 | 同为 16 位，范围较窄 |
| BF16 | 1 | 8 | 7 | 范围接近 FP32，小数分辨率较粗 |

上表的小数位不含正规数的隐含首位。FP16 的最大有限值是 65504；BF16 使用更宽指数，但保留的小数位比 FP16 少，不能简单称为“全面更精确”。[NVIDIA 混合精度说明](https://docs.nvidia.com/deeplearning/performance/mixed-precision-training/index.html#half-precision-format)、[Google BF16 格式说明](https://cloud.google.com/blog/products/ai-machine-learning/bfloat16-the-secret-to-high-performance-on-cloud-tpus)

指数位决定可表示数量级的重要边界，小数位决定同一数量级附近的分辨率。两者影响不同，宽范围不能补回被舍弃的小数信息。

## 精度不是固定小数位数

二进制浮点表示间隔随数值数量级变化，不能说 FP16 在任意位置都有固定的绝对误差。`eps` 通常描述 1 附近相邻可表示值的间隔，也不是所有运算的误差上界。[NumPy finfo 定义](https://numpy.org/doc/stable/reference/generated/numpy.finfo.html)

以下 Python 3 标准库示例使用半精度打包，展示 1 附近的舍入，不依赖 GPU。`struct` 的 `e` 格式使用 IEEE 754 binary16 表示。[Python struct 文档](https://docs.python.org/3/library/struct.html#format-characters)

```python
import struct

def fp16(value):
    return struct.unpack("e", struct.pack("e", value))[0]

assert fp16(1.0 + 2**-12) == 1.0
assert fp16(1.0 + 2**-10) > 1.0
assert fp16(65504.0) == 65504.0
```

这里只验证有限值的表示行为，不代表实际神经网络算子的累加方式或所有硬件上的性能。

## TF32 是特定运算的数学模式

TF32 通常用于支持它的 NVIDIA GPU Tensor Core 矩阵乘法或卷积，输入输出仍可保持 FP32，内部乘法使用较少的有效位。它不是把张量存成一种通用的“19 位 dtype”。

PyTorch 文档说明 TF32 运算只读取输入尾数中的前 10 位，可能产生与完整 FP32 运算不同的结果。开关和默认值需要按实际 PyTorch 与硬件版本核对。[PyTorch 数值精度说明](https://docs.pytorch.org/docs/main/notes/numerical_accuracy.html#tensorfloat-32-tf32-on-nvidia-ampere-and-later-devices)

因此即使张量显示为 `float32`，也不能仅凭 dtype 推断所有内部计算都使用完整 FP32 精度。

## 存储与累加可以使用不同精度

混合精度可以让部分输入与乘法采用低精度，同时使用更高精度累加；具体行为取决于算子和后端。最终写回低精度仍可能发生舍入或溢出。

训练中的 loss scaling 主要处理部分低精度梯度的范围问题，不会恢复低精度已经丢失的有效位，也不是推理时的通用纠错方式。

## 整数类型与整数量化不同

INT8 是有限范围的整数表示，没有浮点的指数与尾数。量化则通过缩放、零点或其他编码规则，将实数近似映射到离散表示。只有“模型使用 INT8”这一信息，还不能确定权重、激活、累加和反量化采用什么精度。

按张量、按通道或按组的缩放策略，以及异常值和校准数据分布，都会影响量化误差。存储缩小也不保证执行更快：缺少合适内核或频繁转换可能抵消收益。

## 用最终任务检查误差

数值对照应检查绝对与相对误差、NaN 和 Inf、极端输入，以及任务指标变化。相对误差在参考值接近零时需要合理处理，不能把一个不稳定比值当作模型失败率。

精度选择应同时满足质量、范围、吞吐和内存约束。FP32 可以作为常见对照之一，但也存在舍入误差；不能把任何 dtype 当成无需验证的真值。
