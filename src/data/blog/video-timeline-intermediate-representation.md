---
title: "视频时间线中间表示与确定性校验"
description: "把模型生成的剪辑计划与渲染器输入分离，建立源媒体时间和成片时间的双时间轴，使用整数单位与半开区间检查越界、重复和空洞，并通过受限 Python 示例说明计划校验、回退策略和渲染适配器各自负责什么。"
publishedAt: 2026-09-29
updatedAt: 2026-10-07
category: "系统与部署"
tags: [视频处理, 时间线, IR, 数据校验]
draft: false
featured: false
---

模型可以建议“在第二句话插入一段画面”，但渲染器需要精确的资源、时间和轨道参数。把建议直接拼成渲染 JSON，会让语义选择、时间计算和供应商字段混在一起。时间线中间表示可以让这些职责分开，并在提交前执行确定性校验。

## 区分源媒体时间与成片时间

一个片段至少包含：从源素材的哪里读取，以及把它放到成片的哪里。

| 字段 | 含义 | 示例 |
| --- | --- | --- |
| 源区间 | 源视频中的取材范围 | 第 5 到第 8 秒 |
| 时间线区间 | 成片中的展示范围 | 第 0 到第 3 秒 |
| 轨道 | 视频、音频或字幕的归属 | 主画面轨道 |
| 资源引用 | 已验证的媒体身份 | 稳定素材 ID |

正常速度播放时，两段时长相同；变速、静帧、循环和转场需要另行定义规则，不能沿用简单相等检查。

## 统一单位和区间约定

应用层可采用整数毫秒与半开区间 `[start, end)`，使相邻片段共享边界时不算重叠。持续进行浮点累加再四舍五入，容易积累边界差异。

整数毫秒是业务表示选择，不等于逐帧精度。需要精确帧边界时，应使用帧号、有理数时间基准或媒体时间戳，并让渲染适配器明确换算与舍入策略。

## 受限时间线的校验示例

下面的 Python 3 标准库示例仅支持单轨、正常速度、无转场的连续视频片段。它要求列表有序且完整覆盖成片，不适用于多轨重叠、图片或变速剪辑。

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Clip:
    id: str
    asset: str
    source_start: int
    source_end: int
    start: int
    end: int

def validate(clips, source_durations, total_ms):
    def integer(value):
        return type(value) is int  # 排除 bool

    if not integer(total_ms) or total_ms <= 0 or not clips:
        raise ValueError("invalid total duration")
    seen = set()
    cursor = 0
    for clip in clips:
        if not isinstance(clip.id, str) or not clip.id or clip.id in seen:
            raise ValueError("invalid or duplicate clip id")
        if clip.asset not in source_durations:
            raise ValueError("unknown asset")
        limit = source_durations[clip.asset]
        values = (clip.source_start, clip.source_end,
                  clip.start, clip.end, limit)
        if not all(integer(value) for value in values):
            raise ValueError("timestamps must be integers")
        if not 0 <= clip.source_start < clip.source_end <= limit:
            raise ValueError("source interval out of bounds")
        if not 0 <= clip.start < clip.end <= total_ms:
            raise ValueError("timeline interval out of bounds")
        if clip.start != cursor:
            raise ValueError("unordered, overlapping or missing interval")
        if clip.source_end - clip.source_start != clip.end - clip.start:
            raise ValueError("unsupported playback speed")
        seen.add(clip.id)
        cursor = clip.end
    if cursor != total_ms:
        raise ValueError("timeline is incomplete")

plan = [
    Clip("one", "a", 5000, 8000, 0, 3000),
    Clip("two", "b", 0, 3000, 3000, 6000),
]
validate(plan, {"a": 10000, "b": 5000}, 6000)
```

这只是业务校验核心。外层还需校验输入结构、候选资源授权、文件存在性和实际媒体属性；类型注解不会自动完成这些检查。

## 模型只选择允许的资源

生成计划时，提供冻结的候选集合及版本，要求模型引用其中的 ID。应用核验每个引用和取材范围，不能把模型输出的新 ID 或 URL 当作已验证资源。

确定性回退计划也必须经过同一校验器。它可以按固定规则使用原始视频填补画面，但不能为了通过校验偷偷延长源素材，或把循环片段误写成普通取材区间。

## 渲染适配器负责实际媒体语义

IR 到渲染器的转换需要处理分辨率、帧率、音频布局、时间基准和输出格式。FFmpeg 的 `trim` 或 `atrim` 截取并不会自动重置时间戳；需要拼接到新时间线时，应根据滤镜链处理 PTS。[FFmpeg 滤镜文档](https://ffmpeg.org/ffmpeg-filters.html#trim)

多轨允许重叠时，应按轨道规则校验，而不是全局禁止重叠。字幕、旁白和背景音乐也不应被套用主画面“必须连续覆盖”的规则。

## 计划通过后仍要验证产物

渲染前检查计划和输入媒体，渲染后检查输出是否可解码、时长是否符合允许误差、音轨是否存在，以及片段边界和字幕是否同步。IR 校验减少非法计划，不会替代真实渲染和产物检查。
