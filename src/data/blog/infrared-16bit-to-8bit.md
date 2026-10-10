---
title: "16-bit 红外图像为什么不能直接转成 8-bit"
description: "从动态范围、异常点、显示映射和视频时序稳定性解释高位深红外数据的双分支处理，并给出分位截断、线性映射与上下限平滑的 OpenCV 风格实现。"
publishedAt: 2026-08-02
category: "视觉与推理"
tags:
  - 红外图像
  - OpenCV
  - 动态范围
  - 图像增强
draft: false
featured: true
---

红外相机给出的 16-bit 数组不只是“一张更大的灰度图”。它可能承载 12、14 或 16 位有效数据，细微温差和弱纹理都分布在比 8-bit 更宽的数值空间里。显示器最终通常只需要 0～255，但算法并不应该因此提前丢弃原始信息。

更可靠的工程结构是双分支：

```text
16-bit 原始帧
├─ 算法分支：保留 uint16 或转 float，进行检测、统计与测量
└─ 显示分支：稳健截断 → 0～255 映射 → 可选伪彩
```

## 简单右移到底丢了什么

把 16-bit 值右移 8 位，相当于固定除以 256。这个操作本身并非永远错误：如果传感器有效范围固定、标定关系明确，并且显示目标就是完整量程，它是一种稳定且便宜的映射。

问题在于许多现场帧只占完整数值范围的一小段。例如主要信息落在 18,000～22,000，固定右移后只有十几个 8-bit 灰度级，弱温差和气体纹理会挤在一起。相反，若用每帧最小值和最大值拉伸，少量坏点或高温点又可能占满映射范围，使主体区域对比度下降。

因此，关键不在“能不能转换”，而在“映射区间由什么证据决定”。

## 算法数据与显示数据必须分开

算法分支应尽量保留原始 `uint16`，或在需要滤波、归一化和模型输入时转换为浮点数。显示分支则只负责让人看清画面。

如果先把原始帧压成 8-bit，再把它交给阈值、背景建模或模型前处理，后续任何算法都无法恢复已经合并的灰度层级。尤其在低对比度目标中，显示效果“看起来更亮”不等于算法信息更多。

## 用分位数抵抗极端点

一种通用显示方法是使用低、高分位点作为映射上下限，例如 1% 和 99%。低于下限的像素截断到下限，高于上限的像素截断到上限，中间区域线性映射到 0～255。

NumPy 的 `percentile` 用于计算指定分位点；OpenCV 的线性变换与类型转换可以完成后续映射。[NumPy percentile](https://numpy.org/doc/stable/reference/generated/numpy.percentile.html) · [OpenCV Basic Linear Transforms](https://docs.opencv.org/4.x/d3/dc1/tutorial_basic_linear_transform.html)

```python
import cv2
import numpy as np


def to_display_u8(
    frame_u16: np.ndarray,
    previous_limits: tuple[float, float] | None = None,
    alpha: float = 0.15,
) -> tuple[np.ndarray, tuple[float, float]]:
    if frame_u16.dtype != np.uint16:
        raise TypeError("frame_u16 must be uint16")

    low_now, high_now = np.percentile(frame_u16, (1.0, 99.0))

    if previous_limits is None:
        low, high = float(low_now), float(high_now)
    else:
        low = (1 - alpha) * previous_limits[0] + alpha * float(low_now)
        high = (1 - alpha) * previous_limits[1] + alpha * float(high_now)

    if high <= low:
        return np.zeros(frame_u16.shape, dtype=np.uint8), (low, high)

    clipped = np.clip(frame_u16.astype(np.float32), low, high)
    display = ((clipped - low) * (255.0 / (high - low))).astype(np.uint8)
    return display, (low, high)
```

这里的 `1% / 99%` 和 `alpha=0.15` 是示例，不是通用最优参数。实际值应由坏点比例、目标对比度、帧率和画面变化速度决定。

## 为什么逐帧归一化会闪烁

如果每一帧都独立计算上下限，场景中一个短暂热源就可能改变整帧映射。即使原始背景几乎没有变化，8-bit 显示也会整体变亮或变暗。

常见控制方法包括：

1. 对上下限做指数移动平均，而不是直接替换。
2. 限制单帧上下限的最大变化幅度。
3. 在明显场景切换时重置历史状态。
4. 对固定机位使用滑动窗口统计，减少单帧异常影响。

时序平滑只应用于显示映射参数，不应把算法分支的原始帧覆盖掉。

## Gamma、CLAHE 与伪彩不是第一步

Gamma、CLAHE 和伪彩可以改善局部可读性，但它们都建立在合理的基础映射之上。先处理动态范围和异常点，再决定是否需要局部增强。

- Gamma 调整会重新分配暗部和亮部对比度。
- CLAHE 会分块增强局部对比度，并通过限制直方图裁剪减少噪声放大。
- 伪彩只改变观察方式，不增加测量信息。

增强结果用于显示时，应保留标识，避免使用者把伪彩颜色误认为物理温度或模型置信度。

## 如何验证映射没有伤害系统

不要只看一张“更好看”的截图。至少检查四类证据：

| 检查 | 目的 |
| --- | --- |
| 原始直方图与分位点 | 确认主体数值范围和异常点比例 |
| 固定场景时间序列 | 观察亮度闪烁和上下限漂移 |
| 算法分支对照 | 确认显示变换没有误入算法输入 |
| 场景切换与极端帧 | 验证历史状态能够及时重置 |

如果系统还要进行检测，应分别保存原始输入、显示图和关键中间结果。这样出现误检时，才能判断问题来自采集位深、显示映射还是模型本身。

## 方法边界

分位截断是一种稳健显示策略，不是温度标定方法，也不保证提升检测精度。需要做辐射测温时，必须使用相机标定参数和厂商定义的数据链路；需要做模型推理时，应按照训练阶段的数据分布设计预处理，而不是直接复用“看起来清楚”的显示图。

