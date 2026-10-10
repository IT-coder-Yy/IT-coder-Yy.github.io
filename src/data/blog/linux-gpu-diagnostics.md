---
title: "Linux 工程排查短记：先确认路径、环境、进程与 GPU"
description: "把零散 Linux 命令整理成只读排查顺序，区分文件大小与磁盘容量、Python 环境与进程状态、驱动支持与 CUDA Toolkit，并纠正 GPU 编号映射及 Git 取消暂存的常见误用。"
publishedAt: 2026-03-16
updatedAt: 2026-10-02
category: "系统与部署"
tags: [Linux, GPU, CUDA, Python 环境, Git]
draft: false
featured: false
---

命令记得多，不等于排查快。我的顺序是先确认自己在哪个目录、运行哪个解释器、哪个进程出了问题，再检查磁盘和 GPU。先获得状态，再决定是否修改，能避免在错误环境里修一个本不存在的问题。

本文从个人 Linux 速查笔记整理，命令面向 Bash 与常见 GNU/Linux 工具，不是 Windows PowerShell 命令。部分精简系统没有 ps、ss 或 NVIDIA 工具，需要按实际环境确认；本文不要求立即安装或删除软件。

## 先确认路径与解释器

```bash
pwd
ls -la
command -v python
python -c 'import sys; print(sys.executable); print(sys.version)'
python -m pip --version
```

`python -m pip` 让包管理命令与所选解释器对应，但仍应看清打印出的路径。终端中激活了 Conda 环境，也不代表 IDE、定时任务或后台服务自动使用同一个解释器。

报错说找不到文件时，先检查当前工作目录和参数中的相对路径。`cd` 后路径基准会变化，程序由其他目录启动时也会变化。不要直接用复制一份文件来掩盖路径问题。

## 文件占用与文件系统容量不是一回事

```bash
df -h .
df -i .
du -sh .
du -h --max-depth=1 .
```

`df` 检查当前路径所属文件系统的空间；`du` 估计目录内容占用。inode 耗尽也可能让“还有容量”的磁盘无法创建文件，因此还要看 `df -i`。命令含义见 [GNU Coreutils 的文件空间说明](https://www.gnu.org/software/coreutils/manual/coreutils.html#File-space-usage)。

两者数值不一致不一定是工具坏了：挂载范围、权限、稀疏文件，以及已删除但仍被进程打开的文件等，都可能造成差异。不要把 `du` 看不到的占用直接归结为“可以清理的垃圾”。

大目录上的 du 可能执行很久，应从相关工作目录开始，避免无目的地扫描整机。本文只做状态检查，不提供一键删除、清空日志或强制卸载命令。

## 进程与监听端口

在常见 procps 与 iproute2 环境中，可以查看：

```bash
ps -eo pid,ppid,stat,%cpu,%mem,comm --sort=-%cpu
ss -lntp
```

ps 的 CPU 与内存百分比是排查线索，不是单次任务耗时或模型显存。ss 这里查看监听中的 TCP 套接字；查看进程详情可能受权限限制，不能把未显示 PID 当成端口无人占用。

端口冲突时先确认 PID 和程序职责，再决定是否停止。看到一个进程占 CPU 就直接强制终止，可能中断别人的任务或正在写入的文件。参数定义可查 [ps 手册](https://man7.org/linux/man-pages/man1/ps.1.html) 与 [ss 手册](https://man7.org/linux/man-pages/man8/ss.8.html)。

## NVIDIA 驱动支持与 Toolkit 版本

```bash
nvidia-smi
nvcc --version
```

`nvidia-smi` 中的 CUDA Version 表达驱动支持的 CUDA 版本信息，不等同于当前安装的 Toolkit 版本；`nvcc --version` 查询当前路径下的编译器版本，也不代表 Python 框架一定使用它。预编译框架的运行时依赖还需要单独核对。[NVIDIA 官方 nvidia-smi 说明](https://docs.nvidia.com/deploy/nvidia-smi/index.html)

没有 nvcc 不必然表示 GPU 推理不可用，没有 nvidia-smi 输出则应先检查驱动、设备可见性和容器环境，而不是先修改模型代码。

对于已安装 PyTorch 的环境，还可以查询实际框架视角：

```bash
python -c 'import torch; print(torch.__version__); print(torch.version.cuda); print(torch.cuda.is_available()); print(torch.cuda.device_count())'
```

这条命令只是检查，不安装 PyTorch。`is_available()` 为 true 也不证明当前模型已经在 GPU 执行，后续还需检查 tensor / 参数所在设备与实际运行状态。

## CUDA_VISIBLE_DEVICES 会重新编号

例如在 Bash 中，让当前进程只看到原编号 1 的 GPU：

```bash
CUDA_VISIBLE_DEVICES=1 python your_script.py
```

进程内通常会将这个唯一可见设备编号为 `cuda:0`，并不是仍然叫 `cuda:1`。多个可见设备也会按指定顺序形成进程内编号。原始编号可能随环境变化，必要时核对 UUID。[NVIDIA 可见设备与编号说明](https://docs.nvidia.com/deploy/topics/topic_5_2_1.html)

`--gpu-id` 不是 Python 或 CUDA 的通用参数，只有具体脚本实现了它才有效。排查时要读脚本参数解析，而不是把一个项目的选项复制到所有训练命令里。

修改可见设备要发生在进程初始化 CUDA 之前。在已经运行的 notebook 中临时改变环境变量，不等于重新创建了设备环境。

## tmux 保留会话，但不负责服务治理

tmux 可以在断开终端后保留会话。常见操作为 `tmux ls`、`tmux new -s training` 和 `tmux attach -t training`；默认按 `Ctrl+b` 再按 `d` 是分离，不是停止程序。

关闭 shell、杀死窗格和分离会话效果不同。tmux 也不保证机器重启后恢复任务，不替代服务管理器、持久日志和训练 checkpoint。操作说明见 [tmux 官方入门](https://github.com/tmux/tmux/wiki/Getting-Started)。

## Git 取消暂存与丢弃修改别混用

我的原始速查材料容易把这两种动作记在一起，现在明确拆开：

```bash
git status --short
git diff
git diff --staged
```

若已有提交，`git restore --staged -- path/to/file` 用于取消该文件的暂存，保留工作区内容。相反，`git restore -- path/to/file` 会用索引内容覆盖工作区，可能丢失未暂存修改。旧式 `git checkout -- file` 同样不是取消暂存的通用安全做法。[Git restore 官方说明](https://git-scm.com/docs/git-restore)

执行变更前先看 diff，并使用明确的文件路径。不要因为命令名字看起来像“恢复”，就以为它不会删除当前编辑成果。

## 把状态留成可复查的记录

一次排查至少记下工作目录、解释器、版本、PID、可见设备、报错和复现步骤。区分观察事实与推断：例如“显存有占用”是观察，“这个模型一定用了 GPU”仍需要证据。

本文命令按工具文档核对，但未在当前 Windows 主机上伪装成已完成 Linux 实机验证。环境不同、权限不同或工具缺失时，应先确认差异再采取修改。
