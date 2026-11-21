import { repositoryProjects } from './repository-projects';

export type Locale = 'zh' | 'en';
export type Artwork = 'travel' | 'freight' | 'camera' | 'safety' | 'recruitment' | 'minimax' | 'git' | 'prompt' | 'video' | 'random';
export type ProjectGroup = 'agent' | 'media' | 'tools' | 'vision';

export const projectGroups: { kind: ProjectGroup; id: string; label: Record<Locale, string> }[] = [
  { kind: 'agent', id: 'ai-agent', label: { zh: 'AI Agent / 应用开发', en: 'AI Agents / Applications' } },
  { kind: 'media', id: 'media', label: { zh: '视频生成 / 智能剪辑', en: 'Video generation / Editing' } },
  { kind: 'tools', id: 'tools', label: { zh: '开发工具 / API', en: 'Developer tools / APIs' } },
  { kind: 'vision', id: 'cv', label: { zh: '计算机视觉 / C++', en: 'Computer vision / C++' } },
];

export interface PortfolioProject {
  id: Artwork;
  slug: string;
  group: ProjectGroup;
  name: Record<Locale, string>;
  shortName: Record<Locale, string>;
  summary: Record<Locale, string>;
  role: Record<Locale, string>;
  ownership: Record<Locale, string>;
  proofs: Record<Locale, [string, string][]>;
  tags: string[];
  source?: string;
  caseStudy?: {
    context: Record<Locale, string>;
    workflow: Record<Locale, [string, string][]>;
    boundaries: Record<Locale, string[]>;
    references: { path: string; label: Record<Locale, string> }[];
    upstream?: string;
  };
}

const originalProjects: PortfolioProject[] = [
  {
    id: 'travel', slug: 'super-travel-agent', group: 'agent',
    name: { zh: 'Super Travel Agent', en: 'Super Travel Agent' },
    shortName: { zh: 'Super Travel Agent', en: 'Super Travel Agent' },
    ownership: { zh: '个人项目', en: 'Independent project' },
    summary: {
      zh: '拒绝大模型“幻觉式攻略”：用有状态的多步规划与 MCP 实时工具链，把模糊的出行灵感变成票务可查、路线可验的真实行程。',
      en: 'No more hallucinated itineraries: turns vague travel ideas into ticket-verified, route-checked plans via stateful multi-step planning and live MCP toolchains.',
    },
    role: {
      zh: '独立主导系统架构设计、有状态多智能体编排、本地与 MCP 双协议工具网关及流式后端实现。',
      en: 'Architected and built end-to-end: stateful multi-agent orchestration, unified local/MCP tool gateway, and streaming backend services.',
    },
    proofs: {
      zh: [
        ['有状态规划链', '将单轮盲猜拆解为分析、分解、规划、执行、观察与总结的闭环状态机，支持长链路上下文追踪与 SSE 实时流式透传。'],
        ['双协议工具网关', '通过 ToolBase / ToolManager 统一本地工具与 stdio/SSE MCP 协议的 Schema 暴露、参数校验、并发去重与调用预算控制。'],
        ['零幻觉实时核验', '针对余票、天气与 POI 路线等强时效信息强制前置工具检索，以真实库存与地理数据锁定生成边界。'],
      ],
      en: [
        ['Stateful planning loop', 'Replaces single-turn guessing with an explicit state machine—analyze, decompose, plan, execute, observe, synthesize—streamed live over SSE.'],
        ['Dual-protocol tool gateway', 'Unifies local tools and stdio/SSE MCP servers under ToolBase/ToolManager with schema validation, deduplication, and call-budget guards.'],
        ['Zero-hallucination grounding', 'Enforces tool-first verification for dynamic data like ticket inventory, weather, and POI routing before synthesizing final answers.'],
      ],
    },
    tags: ['Multi-Agent', 'MCP', 'RAG'],
    source: 'https://github.com/IT-coder-Yy/SuperTravel-Agent',
  },
  {
    id: 'freight', slug: 'freight-decision-agent', group: 'agent',
    name: { zh: '货运司机找货决策 Agent', en: 'Freight Decision Agent' },
    shortName: { zh: '货运决策 Agent', en: 'Freight Decision Agent' },
    ownership: { zh: '个人项目', en: 'Independent project' },
    summary: {
      zh: '当接单不再是单次贪心选择：以确定性约束引擎打底、大模型低频仲裁，帮司机在接单、等待与空驶间博弈月度最优净收益。',
      en: 'Beyond greedy single-order picking: pairs a deterministic constraint engine with low-frequency LLM arbitration to optimize monthly net profit across accepting, waiting, and deadheading.',
    },
    role: {
      zh: '独立设计混合决策架构，实现自然语言约束编译器、长周期机会成本评分、带经验衰减的 Memory 回写及模型动作安全校验。',
      en: 'Sole architect of the hybrid decision engine: NL constraint compiler, long-horizon opportunity-cost scoring, decaying experience memory, and action safety guards.',
    },
    proofs: {
      zh: [
        ['自然语言约束编译', '将司机的口头偏好、作息红线与定点返程承诺编译为硬性过滤边界与软性风险惩罚项，锁死安全底线。'],
        ['长周期机会成本博弈', '摒弃单单高价贪心，综合建模单位时间净收益、空驶调车损耗、返程时间窗与货源过期风险。'],
        ['规则主干与低频仲裁', '常规场景由确定性评分毫秒级放行；仅在多维收益两难时唤醒 LLM 仲裁，且输出动作必须通过合法性二次校验。'],
      ],
      en: [
        ['NL constraint compilation', 'Compiles spoken driver preferences, rest rules, and home-time commitments into hard filters and soft penalty terms.'],
        ['Long-horizon cost modeling', 'Evaluates net hourly return, deadhead repositioning cost, return-window tightness, and order-expiry risk instead of greedy single-order payouts.'],
        ['Rule backbone & LLM arbitration', 'Deterministic rules handle clear-cut cases; the LLM is invoked only on close tradeoffs and every proposed action is strictly validated.'],
      ],
    },
    tags: ['Planning', 'Memory', 'LLM'],
  },
  {
    id: 'camera', slug: 'multi-channel-camera', group: 'vision',
    name: { zh: '多通道红外相机与气体泄漏检测系统', en: 'Multi-channel infrared camera and gas-leak detection system' },
    shortName: { zh: '多通道红外相机', en: 'Infrared Camera System' },
    ownership: { zh: '团队项目', en: 'Team project' },
    summary: {
      zh: '从 16-bit 原始红外流到实时泄漏捕捉：基于 C++/Qt 构建多源并发采集、动态范围保留与异步推理的工业级视觉工作站。',
      en: 'From raw 16-bit thermal streams to real-time gas-leak capture: an industrial C++/Qt vision workstation built for multi-source acquisition, dynamic-range preservation, and async inference.',
    },
    role: {
      zh: '作为核心主力，主导 16-bit 红外流解包与增强算法、ViBe + ONNX/MNN 协同检测流水线及 C++/Qt 多线程零阻塞上位机架构。',
      en: 'Core architect and developer for 16-bit thermal stream decoding, ViBe + ONNX/MNN detection pipelines, and the non-blocking multi-threaded C++/Qt desktop workstation.',
    },
    proofs: {
      zh: [
        ['16-bit 原始流无损解包', '打通工业相机 SDK、RTSP 与 LZO 解压链路，解析私有 Raw Header 恢复 16-bit 辐射细节，避免盲目转 8-bit 抹平微弱温差。'],
        ['传统视觉与深度学习协同', '融合分位截断动态归一化、ViBe 背景建模、形态学滤波与 ONNX Runtime / MNN 模型推理，兼顾可解释性与微弱羽流检出率。'],
        ['多线程零阻塞流水线', '基于 QThread 与信号槽隔离采集、渲染与异步推理，配合有界写盘队列与批量 Flush 扛住多路高频录制压力。'],
      ],
      en: [
        ['Lossless 16-bit stream recovery', 'Bridges camera SDKs, RTSP, and LZO decompression to parse raw headers and preserve subtle 16-bit thermal gradients before 8-bit display mapping.'],
        ['Hybrid CV + deep inference', 'Combines percentile-clipped normalization, ViBe background modeling, and morphology with ONNX Runtime / MNN inference to catch faint gas plumes.'],
        ['Non-blocking threaded pipeline', 'Isolates capture, UI rendering, and QThread inference via signal-slot handoffs, backed by bounded write queues and batch disk flushes.'],
      ],
    },
    tags: ['C++ / Qt', '16-bit', 'ONNX'],
  },
  {
    id: 'safety', slug: 'car-safety-monitoring', group: 'vision',
    name: { zh: '汽车行止安全智能监控系统', en: 'In-vehicle safety monitoring system' },
    shortName: { zh: '汽车安全监控', en: 'In-Vehicle Safety' },
    ownership: { zh: '团队项目', en: 'Team project' },
    summary: {
      zh: '视觉感知与嵌入式 RTOS 的双链路合流：融合 68 点面部连续帧追踪与车内多传感监控，打通从边缘计算到云端联动的车载安全闭环。',
      en: 'Where edge vision meets embedded RTOS: fuses 68-point multi-frame facial tracking with multi-sensor cabin telemetry into an end-to-end edge-to-cloud safety loop.',
    },
    role: {
      zh: '作为核心主力，负责多模态面部疲劳时序识别算法、STM32 + RT-Thread 实时多任务调度架构及 CAT1 / MQTT 双向云端闭环。',
      en: 'Core developer leading temporal facial-fatigue algorithms, STM32 + RT-Thread real-time multitasking architecture, and the bidirectional CAT1 / MQTT cloud loop.',
    },
    proofs: {
      zh: [
        ['多特征时序滤波防误报', '拒绝单帧眨眼误判，联合 68 点面部地标的 EAR（眼部）、MAR（嘴部）与头部姿态角进行连续帧滑动窗口统计。'],
        ['RT-Thread 实时多任务解耦', '在 STM32 端利用线程、信号量与消息队列隔离 CO₂/PIR 传感采样、状态仲裁、本地声光告警与通信任务。'],
        ['边缘-云端双向闭环', '通过 CAT1 模组与 MQTT 协议实现断线自愈、异常事件低延迟上报，以及云端动态阈值下发与远程控制。'],
      ],
      en: [
        ['Temporal multi-cue anti-false-alarm', 'Eliminates single-frame blink false positives by tracking sliding-window statistics across 68-point EAR, MAR, and head-pose angles.'],
        ['RT-Thread real-time decoupling', 'Orchestrates CO₂/PIR sensor polling, state arbitration, local alarms, and comms on STM32 via RTOS threads, semaphores, and message queues.'],
        ['Bidirectional edge-to-cloud loop', 'Uses CAT1 cellular and MQTT with auto-reconnect for low-latency hazard reporting, remote threshold tuning, and cloud command execution.'],
      ],
    },
    tags: ['Vision', 'RT-Thread', 'MQTT'],
  },
];

// 卡片与预览使用同一阅读顺序，增加分类或项目时无需分别维护。
export const projects: PortfolioProject[] = [...originalProjects, ...repositoryProjects].sort(
  (a, b) => projectGroups.findIndex(group => group.kind === a.group) - projectGroups.findIndex(group => group.kind === b.group),
);

export const capabilities: Record<Locale, [string, string, string][]> = {
  zh: [
    ['多智能体编排', 'Super Travel Agent', '有状态多步规划状态机（分析→分解→规划→执行→观察→总结）与 SSE 全链路实时流式透传'],
    ['Tool Calling 与 MCP', 'Super Travel Agent', '基于 ToolBase / ToolManager 统一本地工具与 stdio/SSE MCP 双协议接入、并发去重及预算控制'],
    ['RAG 与上下文工程', 'Super Travel Agent', '结构化旅行知识检索、长对话用户偏好提取、任务快照注入与动态库存前置核验'],
    ['混合 Agent 工作流', '货运决策 Agent', '确定性约束引擎毫秒级守门、多维两难场景低频唤醒 LLM 仲裁及输出动作合法性二次校验'],
    ['长期决策与 Memory', '货运决策 Agent', '月度净收益与机会成本博弈、候选单多维评分、失败反思闭环及带时间衰减的市场记忆回写'],
    ['C++ 与 Qt 工程', '多通道红外相机', '多源高频视频流并发采集、QThread 异步推理隔离、信号槽零阻塞 UI 与有界队列批量落盘'],
    ['图像处理与部署', '多通道红外相机', '16-bit 原始红外帧无损恢复、分位截断动态增强、ViBe 运动建模与 ONNX Runtime / MNN 部署'],
    ['嵌入式与物联网', '汽车行止监控', '68 点时序疲劳视觉追踪、STM32 + RT-Thread 信号量/消息队列多任务解耦及 CAT1 / MQTT 云端闭环'],
  ],
  en: [
    ['Multi-agent orchestration', 'Super Travel Agent', 'Stateful multi-step planning state machine (analyze → decompose → plan → execute → observe → synthesize) with live SSE streaming.'],
    ['Tool calling and MCP', 'Super Travel Agent', 'Unified local tools and stdio/SSE MCP gateway via ToolBase/ToolManager with schema validation, deduplication, and budget guards.'],
    ['RAG and context engineering', 'Super Travel Agent', 'Structured travel knowledge retrieval, user preference extraction, task-state injection, and tool-first inventory grounding.'],
    ['Hybrid Agent workflows', 'Freight Decision Agent', 'Deterministic constraint-engine gating, low-frequency LLM arbitration on close tradeoffs, and strict post-arbitration action validation.'],
    ['Long-horizon decisions and memory', 'Freight Decision Agent', 'Monthly net-profit vs. opportunity-cost modeling, multi-factor candidate scoring, failure reflection, and time-decaying market memory.'],
    ['C++ and Qt engineering', 'Multi-channel infrared camera', 'Multi-source concurrent video capture, QThread async inference isolation, non-blocking signal-slot UI, and bounded batch disk writers.'],
    ['Image processing and deployment', 'Multi-channel infrared camera', 'Lossless 16-bit raw thermal recovery, percentile-clipped enhancement, ViBe motion modeling, and ONNX Runtime / MNN inference.'],
    ['Embedded systems and IoT', 'In-vehicle safety monitoring', '68-point temporal fatigue tracking, STM32 + RT-Thread semaphore/queue multitasking, and bidirectional CAT1 / MQTT cloud telemetry.'],
  ],
};
