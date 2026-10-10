---
title: "ViT 阅读笔记：图像怎样变成 token，分类 token 又做了什么"
description: "从图像分块和张量形状理解原始 Vision Transformer，说明 Patch Embedding、位置嵌入、分类 token 与 Encoder 的分工，并给出 NumPy 分块示例，讨论分辨率、预训练和归纳偏置的边界。"
publishedAt: 2025-03-01
updatedAt: 2026-10-02
category: "论文阅读"
tags: [ViT, Vision Transformer, Patch Embedding, 论文阅读]
draft: false
featured: false
---

ViT 的关键转化是：把二维图像切成 patch 序列，让 Transformer Encoder 处理这组序列表示。它不是把图像里的每个像素直接当作一个词，也不是去掉所有局部结构就自动获得更强视觉能力。

这篇笔记以原始 [An Image is Worth 16×16 Words](https://arxiv.org/html/2010.11929v2) 为范围，重新整理个人阅读材料。讨论原始 ViT 分类架构，不将后续检测、分割或其他视觉 Transformer 的设计混在一起。

## 从图像到序列的形状

设图像为 H×W×C，patch 边长为 P，且 H、W 都能被 P 整除。patch 数量为 `N = (H/P) × (W/P)`，每个 patch 展平后有 `P×P×C` 个数，再线性投影到 D 维。

以 224×224 的 RGB 图像、P=16、D=768 为例：

| 阶段 | 单图形状 | 解释 |
| --- | --- | --- |
| 原始图像 | 224 × 224 × 3 | 三通道图像 |
| 展平 patch | 196 × 768 | 14×14 个 patch，每块 16×16×3 |
| Patch Embedding | 196 × 768 | 投影到模型维度 D |
| 加分类 token | 197 × 768 | 在序列开头增加一个表示 |
| Encoder 输出 | 197 × 768 | 特征维度保持 D |
| 分类表示 | 768 | 取分类 token 对应输出 |

这里两个 768 相同只是因为所选配置恰好如此，不能据此认为 patch 展平维度必须等于模型维度。

`ViT-B/16` 中的 B 表示模型规模配置，16 表示 patch 边长，不是十六层，也不是十六个 token。课程插图里的少量方块只是示意，真实数量由输入尺寸与 patch 大小决定。

## 一个正确保留空间顺序的分块示例

以下 Python 3 + NumPy 示例只演示 HWC 单图分块，不加载权重，也不完成 ViT 推理：

```python
import numpy as np


def patchify(image, patch_size):
    if image.ndim != 3 or patch_size <= 0:
        raise ValueError("需要 HWC 图像和正的 patch 大小")
    h, w, c = image.shape
    if min(h, w, c) <= 0 or h % patch_size or w % patch_size:
        raise ValueError("图像非空，且高宽必须能被 patch 大小整除")

    grid = image.reshape(
        h // patch_size, patch_size,
        w // patch_size, patch_size, c,
    )
    return grid.transpose(0, 2, 1, 3, 4).reshape(
        -1, patch_size * patch_size * c
    )


image = np.zeros((224, 224, 3), dtype=np.float32)
patches = patchify(image, 16)
print(patches.shape)  # (196, 768)
```

中间的 transpose 把 patch 网格的行列放在前面，把每块内部的行列放在后面。直接对整个图像随意 reshape 成 N 行，虽然元素总数不变，却可能把不同空间块的像素混在一起。

实际框架常用 kernel 和 stride 都等于 patch 大小的卷积实现线性 Patch Embedding。这种实现方式并不意味着恢复了一个完整 CNN 主干，还要看其参数共享与后续结构。

## 分类 token 不是原图里的一块

原始 ViT 在 patch 序列前加入一个可学习分类 token。它也参与注意力，与图像 patch 交换信息，最终使用其对应的 Encoder 输出作为分类表示。

它不是已经预测出的类别标签，也不是平均池化的别名。后续模型可以使用不同汇聚方式，但不能把这些替代设计反写成原始 ViT 必须如此。

分类头也要区分训练阶段：原论文的预训练头和下游微调头有不同设置。工程复现时应核对具体 checkpoint 的类别数、输入预处理和头结构，不能只凭模型名称加载任意线性层。

## 位置嵌入与 Encoder

Patch Embedding 提供局部块的内容表示，位置嵌入提供这些块所在的位置。原始 ViT 使用可学习的一维位置嵌入，加到包含分类 token 的序列上；二维图像位置仍可通过序列索引被表达。

Encoder Block 中，注意力负责跨 token 的信息交互，MLP 对各位置特征进行变换，残差与归一化帮助形成稳定的深层结构。不能把“全局注意力”理解为每一层每个头都均匀使用所有 patch。

更高分辨率会增加 patch 数量，预训练位置嵌入通常需要按网格调整。应把分类 token 对应位置与图像网格部分分开处理，并遵循模型实现，不能直接截断或复制到任意尺寸。

## 数据规模与归纳偏置

CNN 具有局部连接与参数共享等结构先验；原始 ViT 的结构先验不同，更多空间关系由数据学习。论文的重要观察是在大规模预训练及迁移条件下，纯 Transformer 可以成为有竞争力的视觉分类方案。

这不等于“小数据上 CNN 永远赢、大数据上 ViT 永远赢”。数据量之外，增强、正则化、预训练、模型规模和训练预算都会改变结果。跨论文比较还要控制实验条件。

个人任务数据不多时，应优先评估已有预训练表示和合理的微调方案，而不是从这篇论文推导出从零训练一定更好。这个选择最终要由目标数据上的验证结果支持。

## 分辨率为什么影响计算成本

固定 patch 大小时，图像高宽各翻倍，patch 数量约变为四倍；密集注意力分数矩阵的元素数约变为十六倍。这个关系说明的是注意力矩阵规模，不是整个模型端到端耗时必然翻十六倍。

因此部署时应一起记录输入尺寸、patch 大小、模型规模与任务精度。缩小输入可能降低计算，也可能抹掉小目标细节；原始分类 ViT 也不能不加改造就作为检测模型输出边界框。

复现实验与权重用法可以参考[作者官方仓库](https://github.com/google-research/vision_transformer)。本篇没有搬运课程截图或论文插图，也没有报告个人训练成绩；代码验证范围限于分块和张量形状。
