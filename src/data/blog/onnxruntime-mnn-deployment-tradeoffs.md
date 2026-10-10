---
title: "ONNX Runtime 与 MNN：先验证模型契约，再比较部署成本"
description: "围绕图像模型接入 C++ 工程的过程，比较 ONNX Runtime 与 MNN 的模型格式、执行后端和部署取舍，说明输入契约、输出解析、坐标映射及正确性和性能对照应如何验证。"
publishedAt: 2026-08-02
updatedAt: 2026-10-02
category: "视觉与推理"
tags: [ONNX Runtime, MNN, 模型部署, C++, 推理验证]
draft: false
featured: false
---

ONNX Runtime 与 MNN 都可以把模型接入推理工程，但“选了一个推理框架”并不等于部署完成。输入预处理、模型执行、输出解释和坐标还原必须形成同一份契约。

在我的学习笔记里，先用 ONNX Runtime 核对 ONNX 模型，再评估端侧运行方案，是一条便于定位问题的路线。这不是所有项目的固定顺序，也不意味着 MNN 一定更快或更小。

## 格式、运行时与后端是三件事

ONNX 描述模型的计算图与参数，ONNX Runtime 负责执行，并通过 Execution Provider 对接不同设备与库。MNN 有自己的模型表示与转换工具，并提供不同计算后端。模型能转换，不能自动证明目标后端能正确、完整地执行它。

| 比较项 | ONNX Runtime | MNN |
| --- | --- | --- |
| 常见接入 | 执行 ONNX，核对导出结果 | 将支持的来源模型转换后接入 |
| 后端选择 | Execution Provider | 按设备与构建配置选择后端 |
| 重点检查 | opset、算子支持、EP 与依赖 | 转换支持、张量布局与后端 |
| 决策证据 | 目标平台的正确性与成本 | 同一目标平台的正确性与成本 |

官方项目说明见 [ONNX Runtime Execution Providers](https://onnxruntime.ai/docs/execution-providers/) 与 [MNN 仓库](https://github.com/alibaba/MNN)。后端和算子支持会随版本变化，应固定模型、转换器与运行时版本，不凭框架标签推断结果。

## 先写清楚输入契约

图像模型至少要确认尺寸、布局、颜色顺序、数值类型和归一化。`NCHW` 与 `NHWC`、RGB 与 BGR，形状可能看似合法，却会产生完全不同的结果。

检测模型还要确认 resize 是否保持比例、padding 如何计算，以及坐标基于原图还是网络输入。均值方差归一化与简单除以 255 也不能随意互换。

我会保存一张固定测试图及其预处理张量，先在训练框架、ONNX Runtime 和目标运行时之间比较同一个张量的输出。这样可将“预处理不同”与“模型转换不同”分开定位。

## 查询元信息，而不是猜输入名字

下面是 Python + ONNX Runtime 的元信息检查片段。需要已经安装对应包，并用 `MODEL_PATH` 指向实际 ONNX 文件；代码只加载并打印信息，不声称已运行真实图像推理。

```python
import os
import onnxruntime as ort

model_path = os.environ["MODEL_PATH"]
session = ort.InferenceSession(
    model_path, providers=["CPUExecutionProvider"]
)

print("运行时版本：", ort.__version__)
print("已注册后端：", session.get_providers())
for node in session.get_inputs():
    print("输入：", node.name, node.shape, node.type)
for node in session.get_outputs():
    print("输出：", node.name, node.shape, node.type)
```

输入可能不止一个，动态维度也不能当作固定整数硬编码。后续 `session.run` 的输入应满足这些元信息和训练侧的语义约定。

启用 GPU 时，需要核对安装包、驱动及运行时依赖。EP 列表按优先级注册，算子可能分配到不同后端；打印存在 CUDA EP，不等于已经证明所有计算都在 GPU 上。需要结合 profiling 和实际日志检查分配与数据搬运。

## 输出解析不能照搬另一个模型

有的检测模型输出原始候选，有的已包含后处理；有的输出框坐标和类别分数，有的输出分割掩码。不能看到一个三维 tensor 就认定它是某一版 YOLO 的固定格式。

如果模型没有内置 NMS，才按契约执行置信度筛选和 NMS。类别分数是否需要额外激活、坐标是否归一化，都应以导出图和训练代码为依据。

保持比例缩放时，一般需要记录缩放系数和 padding，再把输出坐标映射回原图。例如采用同一个等比例系数的 letterbox：

```text
原图 x = (网络坐标 x - 左侧 padding) / scale
原图 y = (网络坐标 y - 顶部 padding) / scale
```

实际实现仍要核对 padding 的取整方式、左右上下是否对称，并裁剪到原图范围。若预处理直接拉伸，横纵缩放系数可能不同，不能套用同一个 scale。

## 正确性验证先于速度比较

我会分三层比较：相同输入张量的原始输出；相同后处理得到的框和分数；最终任务指标。仅肉眼看两张框图差不多，可能遗漏系统性坐标偏移。

浮点运算顺序和后端精度会造成数值差异，因此记录绝对误差、相对误差和业务指标，而不是要求所有值逐位相等。接近阈值的预测还应单独检查。

FP16 或 INT8 并非免费优化。尤其量化涉及校准或训练设定，精度风险需要用实际数据验证。不能只测一个随机 tensor 就宣称模型检测效果没有变化。

## 性能对照记录什么

- 首次加载、预热后的单次推理与端到端耗时分别记录。
- 输入尺寸、batch、线程数、后端、精度与并发路数保持可比较。
- 将预处理、输入复制、模型执行和后处理拆开计时。
- 记录内存、部署文件与依赖体积，而不只比较模型文件大小。
- GPU 等异步执行路径要保证计时包含实际完成，而不只测提交。

多路视频里，还要观察帧龄和队列积压。模型平均执行快，不意味着界面看到的结果新；不同通道争用计算资源，也可能放大尾延迟。

本文没有可供公布的同平台 ORT / MNN 基准，因此不提供速度排名。选择应由目标硬件、算子支持、工程依赖、正确性与测量结果共同决定。
