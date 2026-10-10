---
title: "多通道视频系统如何拆分采集、解码、推理、显示与写盘线程"
description: "从实时性目标出发拆解多路 RTSP 与工业相机链路，说明 Qt Worker、跨线程信号槽、有界队列、丢帧策略、批量写盘和可停止资源释放如何协同。"
publishedAt: 2026-08-02
category: "C++ / Qt"
tags:
  - Qt
  - QThread
  - FFmpeg
  - 多路视频
  - 并发
draft: false
featured: false
---

多路视频系统的卡顿通常不是“线程数量不够”，而是不同目标被塞进了同一条执行路径：采集追求连续，预览追求低延迟，推理允许降频，写盘又更在意数据完整性。只有先区分这些目标，线程和队列才有明确职责。

本文讨论的是一种通用工程拆分，不提供未经测试的 FPS 或延迟结论。真正的队列长度、推理频率和写盘批量必须来自目标设备上的测量。

## 单线程为什么会逐步失控

假设 UI 线程按下面的顺序处理每一帧：

```text
拉流 → 解码 → 预处理 → 推理 → 绘制 → 写盘 → 处理用户事件
```

只要任一步耗时波动，后面的工作就会一起延迟。网络抖动会冻结按钮，推理峰值会降低预览刷新，磁盘 flush 会阻塞采集。多路输入还会把波动叠加到同一个事件循环中。

线程拆分的目标不是让所有步骤同时运行，而是把不同阻塞源隔离，并为每条边界定义可观察的队列和丢弃策略。

## 先画出职责边界

```text
输入源
  ↓
采集 / 解封装 ─→ 解码 ─→ 原始帧总线
                         ├─→ 预览队列 ─→ UI 显示
                         ├─→ 推理队列 ─→ 前后处理 / 模型 ─→ 结果总线
                         └─→ 写盘队列 ─→ 编码 / 批量写入 / flush
```

### 采集与解封装

负责设备 SDK、RTSP 连接、超时、断流状态和压缩数据包读取，不进行耗时图像算法。FFmpeg 的 `av_read_frame()` 返回带流索引的 `AVPacket`，再交给解码器的 send/receive API 产生 `AVFrame`。[FFmpeg Demuxing](https://ffmpeg.org/doxygen/7.0/group__lavf__decoding.html) · [FFmpeg Decoding](https://ffmpeg.org/doxygen/7.0/group__lavc__decoding.html)

### 解码与格式转换

完成 H.264/H.265 等码流解码、时间戳处理和像素格式转换。解码输出需要携带来源、序号、采集时间和格式信息，不能只传一个裸 `cv::Mat` 后再猜它来自哪一路。

### 预处理与推理

完成位深处理、resize、归一化、Tensor 构造、模型执行和后处理。预览不应等待每一帧推理完成；推理线程可以只消费最新帧或按固定频率抽帧。

### UI 显示

只做轻量图像呈现和控件状态更新。Qt GUI 对象应留在主线程，不要从 Worker 中直接修改控件。

### 写盘

负责编码或原始数据落盘、文件轮转、批量写入和错误上报。写盘策略与预览不同：预览可以丢旧帧，记录任务是否允许丢帧必须由产品要求决定。

## Qt 中优先使用 Worker Object

Qt 官方建议把 `QObject` Worker 通过 `moveToThread()` 移入工作线程，并用信号槽传递任务和结果。`QThread` 对象本身仍然属于创建它的旧线程；把业务 slot 直接写进 `QThread` 子类容易混淆线程归属。[QThread Class](https://doc.qt.io/qt-6/qthread.html)

```cpp
class InferenceWorker : public QObject {
    Q_OBJECT
public slots:
    void infer(FramePacket frame) {
        DetectionResult result = runInference(frame);
        emit resultReady(std::move(result));
    }
signals:
    void resultReady(DetectionResult result);
};

auto* worker = new InferenceWorker;
auto* thread = new QThread;
worker->moveToThread(thread);

connect(thread, &QThread::finished, worker, &QObject::deleteLater);
connect(controller, &Controller::frameForInference,
        worker, &InferenceWorker::infer);
connect(worker, &InferenceWorker::resultReady,
        controller, &Controller::handleResult);
thread->start();
```

跨线程的 queued connection 会让 slot 在接收对象所属线程的事件循环中执行。直接跨线程调用一个仍在接收事件的 `QObject` 并不安全；共享状态仍需互斥或改成消息传递。[Threads and QObjects](https://doc.qt.io/qt-6/threads-qobject.html)

## 队列必须有上限

无限队列把短期拥塞变成长期延迟。消费者只要持续比生产者慢，内存和等待时间就会一直增长。

可以先用下面的关系估算初始上限：

```text
队列帧数 ≈ 可接受最大排队时间 × 输入帧率
```

这只是容量预算，不是最终参数。还要结合每帧大小、路数、消费者波动和实测高水位。

### 预览：最新帧优先

实时监控更关心“现在发生什么”。队列满时可以丢弃最旧帧，让显示追上当前时间。

### 推理：按任务选择

若模型用于实时告警，可以保留最新帧并控制推理频率；若任务要求逐帧离线分析，则不能用同样的丢帧策略，应把任务转为可背压的离线管线。

### 写盘：先明确完整性

若录制必须连续，队列满不应静默丢帧。可选择降低输入、切换文件、暂停上游或明确记录丢帧事件。任何降级都必须在状态栏和日志中可见。

## 背压不等于把队列调大

背压是消费者处理不过来时，系统如何约束上游，而不是简单增加缓存。

常见手段包括：

- 降低 UI 刷新频率，但保留采集频率；
- 降低推理频率或输入分辨率；
- 写盘采用成批提交，并控制 flush 周期；
- 对每路视频分别计数，避免一条慢流拖住全部通道；
- 达到高水位时显式告警，而不是继续积压。

## 停止和断流是完整流程的一部分

线程退出不能依赖强制 `terminate()`。Qt 文档明确警告，线程可能在持有锁或修改数据时被终止，无法清理资源。[QThread::terminate](https://doc.qt.io/qt-6/qthread.html#terminate)

更稳妥的关闭顺序是：

1. 标记停止，不再接收新任务。
2. 唤醒等待中的 Worker。
3. 根据任务语义清空、处理或持久化剩余队列。
4. 关闭网络、解码器、编码器和文件句柄。
5. 调用 `quit()`，再等待 `wait()` 返回。
6. 由统一所有者释放线程与 Worker。

断流时同样需要状态机：`connected → reconnecting → failed / connected`。重连应有间隔和上限，不能在网络故障时高速循环占满 CPU。

## 应监控什么

只看总 FPS 很难定位问题。至少按通道记录：

| 指标 | 能回答的问题 |
| --- | --- |
| 采集、解码、预处理、推理、显示、写盘耗时 | 瓶颈在哪一段 |
| 各队列当前长度与高水位 | 延迟是否正在累积 |
| 丢帧数量及原因 | 是策略丢弃还是输入异常 |
| 帧采集时间到显示时间 | 用户看到的实际延迟 |
| 断流、重连与写盘错误 | 系统是否在降级 |

先测量再改架构。若推理慢，优化模型和频率；若写盘慢，检查磁盘吞吐、编码和 flush；若显示慢，降低刷新频率并减少不必要的图像复制。

## 适用边界

这套拆分适合需要实时预览、异步算法和本地记录的桌面系统，但不是固定线程模板。路数较少、算法很轻时，过细拆分会增加复制和同步成本；高吞吐场景则可能需要线程池、零拷贝缓冲或独立进程。结构选择应由阻塞点、数据所有权和失败边界决定。

