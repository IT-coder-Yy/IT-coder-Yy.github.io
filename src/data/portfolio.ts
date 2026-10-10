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
      zh: '把复杂旅行需求转化为可追踪的分析、分解、规划、工具执行、观察与总结流程。',
      en: 'A traceable flow from complex travel requests to analysis, planning, tool execution, observation and synthesis.',
    },
    role: {
      zh: '独立完成主要产品设计、Agent 编排、工具体系、后端服务与工程化实现。',
      en: 'Independent product design, Agent orchestration, tool layer, backend services and engineering implementation.',
    },
    proofs: {
      zh: [
        ['多阶段工作流', '分析、分解、规划、执行、观察、总结形成有状态的执行链。'],
        ['工具统一编排', 'ToolBase / ToolManager 统一本地工具与 MCP 的 Schema、校验和结果处理。'],
        ['可信实时约束', '票务等动态信息坚持先查工具，再组织回答。'],
      ],
      en: [
        ['Stateful workflow', 'Analysis, decomposition, planning, execution, observation and synthesis form a stateful chain.'],
        ['Unified tools', 'ToolBase and ToolManager normalize schemas, validation and results across local tools and MCP.'],
        ['Grounded information', 'Dynamic information such as ticket availability is queried before it is presented.'],
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
      zh: '在接单、等待、空驶之间，权衡月度净收益、司机偏好、时间窗口与未来承诺。',
      en: 'Balances monthly net return, driver preferences, time windows and future commitments across accepting, waiting and repositioning.',
    },
    role: {
      zh: '独立负责约束编译、长期计划、候选评分、Memory、模型仲裁和动作合法性控制。',
      en: 'Independent constraint compilation, long-horizon planning, candidate scoring, memory, model arbitration and action validation.',
    },
    proofs: {
      zh: [
        ['约束先行', '把偏好、休息、回家和承诺任务编译为结构化决策边界。'],
        ['长期评分', '同时考虑单位时间收益、机会成本、偏好风险与过期风险。'],
        ['低频仲裁', '规则优先；只在明确存在权衡时请求模型，且动作必须验证。'],
      ],
      en: [
        ['Constraints first', 'Preferences, rest, home visits and commitments become structured decision boundaries.'],
        ['Long-horizon scoring', 'Return per unit time, opportunity cost, preference risk and expiry risk are considered together.'],
        ['Low-frequency arbitration', 'Rules lead; a model is called only for a real tradeoff, and its action is still validated.'],
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
      zh: '面向工业现场多路红外监控，打通采集、显示、录制、设备控制、图像处理与模型推理。',
      en: 'An industrial infrared monitoring application spanning acquisition, display, recording, device control, image processing and inference.',
    },
    role: {
      zh: '团队核心开发者，主要负责视觉算法、C++ / Qt 上位机、多源视频链路与推理部署。',
      en: 'Core team developer for vision algorithms, the C++ / Qt application, multi-source video paths and inference deployment.',
    },
    proofs: {
      zh: [
        ['多源采集链路', '工业相机 SDK、RTSP、Raw Header、LZO 与 16-bit 红外帧恢复。'],
        ['可解释处理链', '动态范围归一化、分位截断、ViBe、阈值与形态学处理。'],
        ['线程工程', 'QThread 异步推理、信号槽回传、写盘队列限长与批量 flush。'],
      ],
      en: [
        ['Multi-source acquisition', 'Industrial camera SDKs, RTSP, raw headers, LZO and 16-bit infrared frame recovery.'],
        ['Interpretable processing', 'Dynamic-range normalization, percentile clipping, ViBe, thresholding and morphology.'],
        ['Threaded engineering', 'QThread inference, signal-slot handoff, bounded write queues and batch flushes.'],
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
      zh: '将驾驶员疲劳视觉检测与车内环境嵌入式监控结合，形成从边缘判断到云端提醒的安全闭环。',
      en: 'Pairs driver-fatigue vision with embedded cabin sensing, from edge judgment to cloud notification.',
    },
    role: {
      zh: '团队核心开发者，主要负责疲劳检测算法，以及嵌入式与物联网链路开发。',
      en: 'Core team developer for fatigue-detection algorithms and the embedded / IoT path.',
    },
    proofs: {
      zh: [
        ['视觉疲劳识别', '使用 EAR、MAR、头部姿态与连续帧统计识别关键疲劳状态。'],
        ['RTOS 任务协作', '线程、信号量与消息队列组织采集、判断、通信与上报。'],
        ['远程闭环', '通过 CAT1 / MQTT 上报状态、接收阈值与控制指令。'],
      ],
      en: [
        ['Fatigue vision', 'EAR, MAR, head pose and consecutive-frame statistics describe key fatigue states.'],
        ['RTOS coordination', 'Threads, semaphores and message queues coordinate acquisition, judgment, communication and reporting.'],
        ['Remote loop', 'CAT1 / MQTT reports state and receives threshold or control instructions.'],
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
    ['多智能体编排', 'Super Travel Agent', '分析、分解、规划、执行、观察、总结的执行链'],
    ['Tool Calling 与 MCP', 'Super Travel Agent', 'ToolBase、ToolManager、本地工具与 stdio / SSE MCP 接入'],
    ['RAG 与上下文工程', 'Super Travel Agent', '旅行知识检索、用户偏好、任务状态与上下文注入'],
    ['混合 Agent 工作流', '货运决策 Agent', '确定性规则主干、低频 LLM 仲裁、动作校验'],
    ['长期决策与 Memory', '货运决策 Agent', '月度计划、候选评分、失败反思与市场记忆'],
    ['C++ 与 Qt 工程', '多通道红外相机', '多页面上位机、多线程、信号槽、配置与录制'],
    ['图像处理与部署', '多通道红外相机', '16-bit 红外处理、ViBe、ONNX Runtime、MNN'],
    ['嵌入式与物联网', '汽车行止监控', 'STM32、RT-Thread、CO₂ / 人体红外、CAT1 / MQTT'],
  ],
  en: [
    ['Multi-agent orchestration', 'Super Travel Agent', 'A stateful chain of analysis, decomposition, planning, execution, observation and synthesis.'],
    ['Tool calling and MCP', 'Super Travel Agent', 'ToolBase and ToolManager unify local tools and MCP with schemas, validation and result handling.'],
    ['RAG and context engineering', 'Super Travel Agent', 'Travel knowledge retrieval, user preferences, task state and contextual injection.'],
    ['Hybrid Agent workflows', 'Freight Decision Agent', 'A deterministic rule backbone, low-frequency LLM arbitration and action validation.'],
    ['Long-horizon decisions and memory', 'Freight Decision Agent', 'Monthly planning, candidate scoring, failure reflection and market memory.'],
    ['C++ and Qt engineering', 'Multi-channel infrared camera', 'A multi-page desktop application, concurrency, signals and slots, configuration and recording.'],
    ['Image processing and deployment', 'Multi-channel infrared camera', '16-bit infrared processing, ViBe, ONNX Runtime and MNN.'],
    ['Embedded systems and IoT', 'In-vehicle safety monitoring', 'STM32, RT-Thread, CO₂ / PIR sensing, CAT1 and MQTT.'],
  ],
};
