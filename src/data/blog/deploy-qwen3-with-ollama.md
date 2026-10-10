---
title: "8GB 显存下使用 Ollama 部署 Qwen3 8B"
description: "从显存约束、量化模型选择、Windows 目录规划到 GPU 与接口验证，整理一套可复查的 Ollama 本地部署流程，并说明它不保证所有机器都能获得相同速度。"
publishedAt: 2026-04-18
category: "系统与部署"
tags:
  - Ollama
  - Qwen3
  - Windows
  - 本地部署
draft: false
featured: true
series: "本地大模型部署"
seriesOrder: 1
---

本地部署最容易犯的错误，是先问“哪个模型最强”，再想办法把它塞进机器。更稳妥的顺序恰好相反：先确认显存、内存、使用目标和可接受延迟，再决定模型规模、量化方式和上下文长度。

这篇文章记录的是一台 `i5-12600KF / RTX 5060 8GB / 32GB RAM` Windows 机器上的实践。结论不是“8GB 显存一定能完整承载所有 8B 模型”，而是：在明确量化版本、上下文和并发条件后，`qwen3:8b` 可以成为这台机器上更现实的本地主力候选。

## 先从约束反推模型

模型参数量、权重文件大小和运行时显存不是同一个概念。

- 参数量描述模型规模。
- 权重文件大小取决于参数量、量化方式和文件格式。
- 运行时还需要 KV Cache、计算缓冲区和运行时自身的开销。
- 上下文越长、并发请求越多，额外内存通常越高。

Ollama 模型库中的 `qwen3:8b` 条目显示，该构建约为 8.19B 参数、5.2GB，量化类型为 `Q4_K_M`。这说明权重文件有机会放入 8GB 显存，但不能据此直接推导完整运行占用，更不能承诺推理速度。[Ollama Qwen3 8B 模型条目](https://ollama.com/library/qwen3:8b)

Qwen 官方模型卡还说明，Qwen3-8B 原生上下文长度为 32,768 tokens。模型“支持”某个上下文长度，不代表本机应该默认开到上限；本地部署仍需根据实际显存逐步增加。[Qwen3-8B 模型卡](https://huggingface.co/Qwen/Qwen3-8B)

## 用可迁移变量规划目录

不要把本机盘符写进可公开复用的命令。下面用 `$MODEL_ROOT` 表示读者自行选择的根目录：

```powershell
$MODEL_ROOT = "D:\LLM"
New-Item -ItemType Directory -Force `
  "$MODEL_ROOT\ollama", `
  "$MODEL_ROOT\models", `
  "$MODEL_ROOT\downloads", `
  "$MODEL_ROOT\logs"
```

目录职责保持单一：

| 目录 | 职责 |
| --- | --- |
| `ollama/` | 独立 CLI 与运行库 |
| `models/` | 模型权重与清单 |
| `downloads/` | 安装包和临时下载 |
| `logs/` | 启动与排障记录 |

如需改变模型存储位置，Ollama 官方支持 `OLLAMA_MODELS` 环境变量。Windows 下要确保启动服务的进程能够读取这个变量和目标目录。[Ollama FAQ：模型存储位置](https://docs.ollama.com/faq#where-are-models-stored)

```powershell
$env:OLLAMA_MODELS = "$MODEL_ROOT\models"
```

这条命令只影响当前 PowerShell 会话。若要持久化，应通过系统环境变量设置，并在重新打开的终端中验证；不要在服务已启动后修改变量却期待当前进程自动继承。

## `serve`、`pull` 与 `run` 分别做什么

三个命令对应三个不同阶段：

```powershell
# 窗口 1：启动本地运行时与 API 服务
ollama serve

# 窗口 2：下载模型清单和权重
ollama pull qwen3:8b

# 发起交互式推理
ollama run qwen3:8b
```

`serve` 启动服务；`pull` 下载模型；`run` 才会发起对话或推理请求。官方 CLI 还提供 `ls`、`ps` 和 `stop`，分别用于查看本地模型、当前运行模型和卸载指定模型。[Ollama CLI Reference](https://docs.ollama.com/cli)

```powershell
ollama ls
ollama ps
ollama stop qwen3:8b
```

## 建立三层验证闭环

“命令没有报错”还不够。部署至少要验证服务、推理和硬件三层。

### 1. 服务层

确认本地 API 可访问。默认 Ollama API 常用地址是 `http://127.0.0.1:11434`：

```powershell
Invoke-RestMethod http://127.0.0.1:11434/api/tags
```

### 2. 推理层

使用一个短问题验证模型能够生成结果，再用固定提示词重复测试，避免只凭一次长对话判断部署是否稳定。

```powershell
ollama run qwen3:8b "用三句话解释什么是有界队列"
```

### 3. 硬件层

```powershell
ollama ps
nvidia-smi
```

`ollama ps` 用来观察当前模型及处理器分配，`nvidia-smi` 用来观察推理期间的显存与 GPU 活动。二者都是诊断信号，不应只凭某一个百分比就宣布性能达标。

## 常见问题从哪里查

### 首次回复明显更慢

模型可能正在从磁盘载入内存和显存。先区分“首次加载慢”和“每次推理都慢”，再决定是否调整模型、上下文或常驻时间。

### 推理突然变得很慢

先检查 `ollama ps` 和 `nvidia-smi`，再缩短上下文并关闭其他占用显存的程序。如果权重或缓存无法适配当前硬件，可能出现 CPU 参与计算或加载失败。

### 端口被占用

```powershell
Get-NetTCPConnection -LocalPort 11434 -ErrorAction SilentlyContinue
```

确认是否已经存在 Ollama 进程，不要盲目重复启动多个服务。

### 重启后命令失效

独立 CLI 部署不等于已注册为 Windows 服务。先检查 PATH、环境变量和服务进程，再检查模型目录是否仍可访问。Ollama 官方也提供独立 Windows CLI 作为集成或服务化选项。[Ollama on Windows](https://docs.ollama.com/windows)

## 适用边界

这套流程解决的是单机开发与本地验证，不代表生产推理方案。模型版本、驱动、上下文、并发和提示词都会影响占用与速度。公开记录时应保留硬件和验证条件，但不要把一次本机体验包装成普遍性能结论。

