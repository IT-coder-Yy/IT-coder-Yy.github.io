import type { PortfolioProject } from './portfolio';

// 根据公开 README、依赖声明与关键源码整理；不将仓库能力推定为个人独立贡献。
export const repositoryProjects: (PortfolioProject & { caseStudy: NonNullable<PortfolioProject['caseStudy']> })[] = [
  {
    id: 'recruitment', slug: 'super-recruitment', group: 'agent',
    name: { zh: 'Super Recruitment · AI 招聘自动化', en: 'Super Recruitment · AI Hiring Workflow' },
    shortName: { zh: 'Super Recruitment', en: 'Super Recruitment' },
    ownership: { zh: '全栈 Agent 应用', en: 'Full-stack Agent App' },
    summary: {
      zh: '把 AI 装进确定性状态机：串联简历结构化解析、JD 证据链评分与面试排期，用 Human-in-the-loop 守住每一次录用决策。',
      en: 'Putting AI inside a deterministic state machine: chains structured resume parsing, evidence-backed JD scoring, and interview scheduling while keeping humans in the loop for every hiring gate.',
    },
    role: {
      zh: '独立设计并实现候选人全生命周期状态机、基于证据链的 AI 评估引擎（支持 Mock / Live 双模无缝切换）、人机协同审批流与全链路数据看板。',
      en: 'Designed and built the candidate lifecycle state machine, evidence-based AI evaluator (dual Mock/Live modes), human-in-the-loop approval gates, and funnel analytics dashboard.',
    },
    proofs: {
      zh: [
        ['确定性状态机守门', '显式定义候选人从采集、初筛、面试到 Offer 的合法状态迁移，任何淘汰与录用节点均强制要求人工确认后方可流转。'],
        ['证据链评分与双模引擎', '要求模型严格对齐 JD 要求与简历原文输出结构化评分依据；内置 Mock 与 OpenAI-compatible 双引擎，兼顾零依赖演示与生产接入。'],
        ['全链路审计与数据闭环', '基于 SQLite 持久化候选人档案、排期与状态变更审计日志，提供实时转化漏斗看板及 XLSX / CSV 标准化报表导出。'],
      ],
      en: [
        ['Deterministic state-machine gates', 'Enforces explicit candidate state transitions from intake and screening to interviews and offers, requiring human sign-off at every decision gate.'],
        ['Evidence-grounded dual AI engine', 'Requires the model to cite concrete resume evidence against JD criteria; seamlessly switches between zero-dependency Mock mode and live OpenAI-compatible APIs.'],
        ['End-to-end audit & data loop', 'Persists candidate profiles, schedules, and transition audit logs in SQLite, complete with live conversion funnels and XLSX / CSV export.'],
      ],
    },
    tags: ['FastAPI', 'SQLite', 'Human-in-the-loop'],
    source: 'https://github.com/IT-coder-Yy/Super-Recruitment',
    caseStudy: {
      context: {
        zh: '真实招聘流程往往割裂在散乱的 PDF 简历、IM 聊天与多份电子表格之间，但直接让大模型全自动筛选又会带来黑盒偏见与合规风险。本项目采用“确定性状态机守门 + AI 提炼证据链”的工程范式：由 AI 承担高耗时的结构化解析与 JD 匹配举证，而把淘汰、约面与发薪定级的最终拍板权牢牢留在 HR 手中。',
        en: 'Real-world recruiting often fragments across scattered PDFs, chat threads, and spreadsheets, yet handing full autonomy to an LLM introduces black-box bias and compliance risks. This system pairs a deterministic state machine with AI evidence extraction: AI handles heavy lifting like resume parsing and JD-matched evidence citation, while HR retains final authority over rejections, interviews, and offers.',
      },
      workflow: {
        zh: [
          ['多源采集与结构化消重', '支持批量导入平台候选人或上传简历，自动提取核心履历字段、执行多维查重并标记待人工补全的信息缺口。'],
          ['JD 证据链评估与约面', '结合岗位 JD 生成带原文依据的匹配度评分与追问建议，经 HR 审阅批准后触发面试邀约、排期协调与面评归档。'],
          ['Offer 审批与入职闭环', '在审批通过后生成标准化 Offer 并追踪候选人意向，确认接受后自动派生入职准备清单与全流程审计归档。'],
        ],
        en: [
          ['Intake, parsing & deduplication', 'Ingests platform data or uploaded resumes, extracts structured fields, deduplicates records, and flags missing information for quick completion.'],
          ['Evidence-backed scoring & scheduling', 'Generates JD match scores grounded in resume citations alongside interview prompts, unlocking scheduling and feedback tracking upon HR approval.'],
          ['Offer approval & onboarding loop', 'Routes approved candidates through offer generation and acceptance tracking, automatically spawning onboarding checklists and audit records.'],
        ],
      },
      boundaries: {
        zh: [
          '双模解耦设计：内置开箱即用的仿真数据集与 Mock 评估器以确保离线可复现；接入真实大模型、日历及通知服务通过独立环境变量驱动。',
          '异步协作接口：内置 XLSX / CSV 标准化报表导出以对接外部表格生态，定位为轻量级单库（SQLite）闭环而非重型 SaaS 多租户实时协同。',
          '严格的人机职责边界：AI 仅输出结构化证据与评估建议，系统在架构层禁止模型越权自动淘汰候选人或自行生成薪资条款。',
        ],
        en: [
          'Decoupled dual-mode runtime: ships with reproducible synthetic datasets and a Mock evaluator out of the box, while live LLMs, calendars, and notifications plug in via environment configs.',
          'Standardized data handoff: exports clean XLSX / CSV reports for external spreadsheet workflows, scoped as a self-contained SQLite service rather than a multi-tenant live-sync SaaS.',
          'Strict human-in-the-loop boundary: AI produces structured evidence and recommendations only; the state machine architecturally forbids autonomous rejections or AI-fabricated compensation terms.',
        ],
      },
      references: [
        { path: 'README.md', label: { zh: '演示流程与接入边界', en: 'Demo workflow and integration boundaries' } },
        { path: 'app/services/workflow.py', label: { zh: '候选人状态转换与人工审批', en: 'Candidate transitions and human approval' } },
        { path: 'requirements.txt', label: { zh: '后端依赖', en: 'Backend dependencies' } },
      ],
    },
  },
  {
    id: 'prompt', slug: 'prompt-engineering', group: 'agent',
    name: { zh: 'Prompt Engineering · 提示词实战学习站', en: 'Prompt Engineering · Learning Lab' },
    shortName: { zh: 'Prompt 学习站', en: 'Prompt Learning Lab' },
    ownership: { zh: '交互式学习实验室', en: 'Interactive Learning Lab' },
    summary: {
      zh: '告别玄学调优与盲目抄模板：集成分阶段课程、12 个真实业务场景与实时消融实验台，直观拆解输入结构如何决定模型输出。',
      en: 'Move past prompt guesswork and blind copy-pasting: combines staged curriculum, 12 real-world business scenarios, and a live ablation workbench to reveal how input structure shapes LLM output.',
    },
    role: {
      zh: '独立设计并构建“课程拆解—变量模板组装—多维消融实验—结构化契约校验”全套前端交互架构与服务端安全代理接口。',
      en: 'Architected and built the end-to-end interactive learning loop: staged curriculum, dynamic variable templating, ablation experiment workbench, schema validator, and server-side API proxy.',
    },
    proofs: {
      zh: [
        ['工程化提示词拆解', '将抽象的 Prompt 技巧映射为分阶段进阶课程与 12 个高频业务场景，通过动态变量插槽实现从原理认知到生产模板的平滑过渡。'],
        ['可视化消融实验台', '支持同屏调整提示词结构、Temperature 等采样参数与推理策略，直观对比不同输入约束下的生成质量差异。'],
        ['确定性契约校验与双模运行', '内置 JSON 语法解析与必需字段契约断言；兼具零配置预置演示与服务端密钥代理的 Chat Completions 实时推理。'],
      ],
      en: [
        ['Structured prompt decomposition', 'Maps abstract prompting patterns into staged lessons and 12 real-world business scenarios with dynamic variable slots for production-ready templates.'],
        ['Side-by-side ablation workbench', 'Adjust prompt structures, sampling parameters (e.g., Temperature), and prompting techniques to directly compare output sensitivity.'],
        ['Contract assertions & dual runtime', 'Validates outputs against JSON syntax and required-field contracts; supports both zero-config preset replays and server-proxied live Chat Completions calls.'],
      ],
    },
    tags: ['Next.js', 'TypeScript', 'Prompt Evaluation'],
    source: 'https://github.com/IT-coder-Yy/Prompt_Engineering',
    caseStudy: {
      context: {
        zh: '许多开发者将提示词工程视为“玄学调参”或机械的模板搬运，缺乏科学的对照组实验手段。本项目将 Prompt 视为“可验证的软件契约”，打通从理论拆解、业务模板组装到消融对比与 JSON 结构断言的完整闭环，让每一次提示词修改带来的效果变化都清晰可量化。',
        en: 'Many developers treat prompt engineering as trial-and-error guesswork or static template copying. This project frames prompts as verifiable software contracts—connecting structured lessons and business templates with controlled ablation experiments and JSON schema assertions so every prompt change produces observable, measurable effects.',
      },
      workflow: {
        zh: [
          ['解构提示词骨架', '通过渐进式课程拆解角色设定、上下文边界、少样本示例（Few-shot）与输出格式约束在模型注意力中的作用。'],
          ['动态装配业务模板', '在 12 个典型业务场景中修改动态变量插槽，实时预览并一键导出拼装完毕的结构化 Prompt。'],
          ['消融对比与契约校验', '在实验台切换提示策略或模型超参数，并排比对响应文本，同时运行自动化的 JSON 解析与字段完整性断言。'],
        ],
        en: [
          ['Deconstruct prompt anatomy', 'Walk through progressive lessons dissecting how role framing, context boundaries, few-shot examples, and format constraints steer model behavior.'],
          ['Assemble dynamic templates', 'Inject custom variables across 12 business scenarios to preview and export production-ready structured prompts in real time.'],
          ['Run ablations & verify contracts', 'Toggle prompting strategies or model hyperparameters side by side, validating responses against automated JSON parsing and required-field assertions.'],
        ],
      },
      boundaries: {
        zh: [
          '零门槛离线重放与实时在线推理兼备：默认提供高保真预置实验结果以供快速浏览；配置兼容 OpenAI Chat Completions 的服务端密钥即可无缝切换至实时大模型调用。',
          '安全代理边界：所有外部模型调用均由 Next.js 服务端路由统一转发，彻底隔离前端客户端的 API Key 泄露风险。',
          '评估维度分层：内置的 JSON 解析与字段检查聚焦于“输出格式与结构契约”的确定性验证，开放式文本的业务事实准确性则交由实验者结合对照视图评判。',
        ],
        en: [
          'Zero-config replay meets live inference: ships with deterministic preset runs for instant exploration, and switches seamlessly to live LLM inference once an OpenAI-compatible API key is configured.',
          'Server-side credential isolation: all live model requests are proxied through Next.js server routes, keeping API keys strictly off the client bundle.',
          'Layered evaluation scope: built-in JSON and required-field validators enforce deterministic structural contracts, while semantic and domain quality are evaluated through side-by-side human inspection.',
        ],
      },
      references: [
        { path: 'README.md', label: { zh: '学习路径与实验配置', en: 'Learning path and experiment setup' } },
        { path: 'lib/evaluation.ts', label: { zh: 'JSON 与必需字段检查', en: 'JSON and required-field checks' } },
        { path: 'package.json', label: { zh: 'Next.js / React 技术栈', en: 'Next.js / React stack' } },
      ],
    },
  },
  {
    id: 'minimax', slug: 'x-minimax-h3', group: 'media',
    name: { zh: 'X-MinimaxH3 · 本地视频生成适配', en: 'X-MinimaxH3 · Local Video Deployment' },
    shortName: { zh: 'X-MinimaxH3', en: 'X-MinimaxH3' },
    ownership: { zh: '本地推理与环境工程', en: 'Local Inference & Env Engineering' },
    summary: {
      zh: '打通大模型落地的“最后一公里”：基于 X-MinimaxH3 构建 CUDA 12.4 本地视频生成环境，衔接多模态生成引擎与高负载显存调度。',
      en: 'Bridging the last mile of local multimodal deployment: adapts PullMyBoots/X-MinimaxH3 for CUDA 12.4 environments, connecting video generation pipelines with high-load VRAM scheduling.',
    },
    role: {
      zh: '负责面向 CUDA 12.4 工具链的本地推理环境移植、PyTorch / 原生算子依赖对齐与部署验证；核心生成引擎、Web 控制台与任务调度器归属上游开源项目。',
      en: 'Led local inference environment porting, PyTorch/native operator dependency alignment, and deployment verification for CUDA 12.4; core generation engine, web console, and scheduler originate from upstream.',
    },
    proofs: {
      zh: [
        ['跨版本 CUDA 工具链攻坚', '针对主流生产主机常见的 CUDA 12.4 驱动环境，梳理并对齐 PyTorch、C++/CUDA 原生算子扩展与底层运行时依赖链。'],
        ['高负载显存分档与 LoRA 调度', '完整验证并复用上游多档显存优化策略、Base / LoRA 权重动态切换、异步任务队列及生成过程断点预览机制。'],
        ['清晰的开源归属与工程边界', '严格遵循开源合规规范，完整保留 PullMyBoots/X-MinimaxH3 上游架构设计与归属声明，提供可复现的本地私有化部署切片。'],
      ],
      en: [
        ['Cross-version CUDA toolchain alignment', 'Resolves dependency matrices across PyTorch, native C++/CUDA extensions, and system runtimes to run cleanly on mainstream CUDA 12.4 hosts.'],
        ['VRAM profiling & LoRA scheduling', 'Integrates upstream multi-tier VRAM optimization profiles, dynamic Base/LoRA weight switching, async task queues, and checkpoint previews.'],
        ['Transparent open-source attribution', 'Maintains strict licensing hygiene and clear upstream attribution to PullMyBoots/X-MinimaxH3 while documenting a reproducible local deployment path.'],
      ],
    },
    tags: ['Python', 'CUDA', 'MiniMax H3'],
    source: 'https://github.com/IT-coder-Yy/X-MinimaxH3',
    caseStudy: {
      context: {
        zh: '多模态视频生成大模型在私有化落地时，最棘手的往往不是调用接口，而是突破 GPU 驱动、CUDA 版本、PyTorch 与底层原生算子之间的“依赖地狱”，并在有限显存下稳定跑通推理流水线。本仓库基于上游 PullMyBoots/X-MinimaxH3 项目开展环境工程适配，聚焦将原本面向 CUDA 13.x 验证的复杂视频生成服务平滑迁移至主流的 CUDA 12.4 硬件环境。',
        en: 'When deploying large multimodal video models locally, the hardest bottleneck is rarely the API call—it is surviving dependency hell across GPU drivers, CUDA toolkits, PyTorch, and native C++ extensions while managing tight VRAM ceilings. Building upon PullMyBoots/X-MinimaxH3, this repository focuses on environment engineering to bring a complex video generation service validated on CUDA 13.x onto mainstream CUDA 12.4 workstations.',
      },
      workflow: {
        zh: [
          ['底层工具链与算子对齐', '围绕 CUDA 12.4 目标环境排查运行时依赖、编译并校验原生加速扩展，打通模型权重加载与本地硬件加速通道。'],
          ['多模态条件生成接入', '通过中英文双语 Web 控制台与 REST API 提交文本提示词、首尾帧控制（FL2VA）或参考媒体（Ref2VA）生成任务。'],
          ['显存调度与队列执行', '依托显存分档配置、Base / LoRA 权重按需挂载与异步任务队列，保障长耗时视频合成任务的有序执行与中间帧预览。'],
        ],
        en: [
          ['Toolchain & operator alignment', 'Audits runtime dependencies, aligns native CUDA extensions against CUDA 12.4, and verifies local model weight loading and hardware acceleration.'],
          ['Multimodal conditioned submission', 'Submits text prompts, first/last-frame conditioning (FL2VA), or reference media (Ref2VA) jobs via the bilingual web console or REST API.'],
          ['VRAM-aware queued execution', 'Leverages tiered VRAM profiles, dynamic Base/LoRA mounting, and an async task queue for stable long-running synthesis and live checkpoint previews.'],
        ],
      },
      boundaries: {
        zh: [
          '严守开源致谢与归属：本仓库专注于本地环境工程与 CUDA 12.4 适配，核心视频生成算法、Web 交互界面与任务调度引擎均归属上游 PullMyBoots/X-MinimaxH3 项目。',
          '跨版本环境说明：仓库针对 CUDA 12.4 开展适配实践，同时完整保留上游基于 CUDA 13.x 的基准文档以便开发者对照硬件差异。',
          '模型权重与合规解耦：代码仓库仅提供推理服务框架与环境配置，不直接分发大体量模型权重，部署时需遵循上游代码与对应模型许可证。',
        ],
        en: [
          'Strict upstream attribution: this repository focuses on local environment engineering and CUDA 12.4 adaptation; the core generation engine, web UI, and scheduler belong to upstream PullMyBoots/X-MinimaxH3.',
          'Cross-version documentation: targets CUDA 12.4 deployment in practice while preserving upstream CUDA 13.x baseline docs for hardware comparison.',
          'Decoupled weights & licensing: distributes the inference runtime and environment configuration only; model weights are fetched separately under upstream code and model licenses.',
        ],
      },
      references: [
        { path: 'README.zh-CN.md', label: { zh: '上游功能与验证环境说明', en: 'Upstream features and validation environment' } },
        { path: 'docs/DEPLOYMENT.en.md', label: { zh: '部署说明', en: 'Deployment guide' } },
        { path: 'THIRD_PARTY_NOTICES.md', label: { zh: '第三方归属说明', en: 'Third-party attribution' } },
      ],
      upstream: 'https://github.com/PullMyBoots/X-MinimaxH3',
    },
  },
  {
    id: 'video', slug: 'mix-video', group: 'media',
    name: { zh: 'Mix Video · 短视频剪辑 Agent', en: 'Mix Video · Short-video Editing Agent' },
    shortName: { zh: 'Mix Video', en: 'Mix Video' },
    ownership: { zh: '多模态剪辑 Agent', en: 'Multimodal Editing Agent' },
    summary: {
      zh: '从一段文案到 1080P 成片的可控流水线：通过 StoryPlan/EditPlan 双层规划、MCP 素材检索与时间线契约校验，让 AI 剪辑既聪明又不越界。',
      en: 'A controllable pipeline from copy to 1080p video: combines StoryPlan/EditPlan two-tier planning, MCP asset retrieval, and timeline contract validation so AI editing stays smart without going off-script.',
    },
    role: {
      zh: '独立设计并实现 StoryPlan / EditPlan 双层中间表示（IR）、MCP 素材检索网关、剪辑 Skill 编排、结构化时间线校验器与 SQLite 幂等任务状态机。',
      en: 'Architected and built the StoryPlan/EditPlan two-tier IR, MCP asset retrieval gateway, editing skill orchestration, timeline contract validator, and SQLite idempotent task state machine.',
    },
    proofs: {
      zh: [
        ['双层中间表示（IR）解耦', '先将创意需求拆解为分镜级 StoryPlan，待人工锁定素材后再编译为含精确时间轴契约的 EditPlan，隔离大模型幻觉与底层渲染引擎。'],
        ['严格受限的选片授权边界', '每个分镜由人工从 MCP 检索结果中框定 1–3 个候选片段，程序在校验层强制约束 AI 只能在已授权素材池内做剪辑编排。'],
        ['级联失效与幂等防重扣费', '基于 SQLite 追踪全链路版本状态；上游分镜或选片变更自动触发下游审批失效，且同一版本渲染提交具备严格的幂等保护。'],
      ],
      en: [
        ['Two-tier IR decoupling', 'Decomposes briefs into a shot-level StoryPlan first, then compiles user-approved clips into a schema-validated EditPlan timeline, isolating LLM hallucinations from render engines.'],
        ['Authorized clip sandboxing', 'Users lock in 1–3 MCP-retrieved candidates per shot; deterministic validators ensure the Agent edits strictly within that approved asset pool.'],
        ['Cascading invalidation & idempotency', 'Tracks versioned state in SQLite—upstream edits automatically invalidate downstream approvals, and idempotent submission guards prevent duplicate paid renders.'],
      ],
    },
    tags: ['FastAPI', 'MCP', 'Streamlit'],
    source: 'https://github.com/IT-coder-Yy/Mix-Video',
    caseStudy: {
      context: {
        zh: '端到端 AI 视频剪辑极易陷入两个极端：要么完全黑盒生成导致画面失控、版权越界，要么沦为繁琐的纯手动拖拽。本项目引入编译器式的“双层中间表示（StoryPlan / EditPlan）”与确定性契约校验：让 Agent 发挥创意拆解分镜与节奏，同时用严格的代码规则锁死素材授权范围、时间线合法性与云端渲染幂等性。',
        en: 'End-to-end AI video editing often falls into one of two traps: unguided black-box generation that hallucinates assets and violates licenses, or tedious manual timeline scrubbing. This system introduces a compiler-inspired two-tier intermediate representation (StoryPlan / EditPlan) backed by deterministic contract validators: the Agent drives creative pacing and shot breakdown, while strict code guards enforce asset authorization, timeline validity, and idempotent cloud rendering.',
      },
      workflow: {
        zh: [
          ['分镜规划与 MCP 检索', '输入口播文案或创作简报，Agent 自动生成结构化 StoryPlan 并通过 MCP 协议跨源检索匹配的候选视频素材。'],
          ['人工圈选与时间线编译', '创作者为每个镜头锁定 1–3 个满意片段，Agent 结合剪辑 Skill 生成 EditPlan 并通过时间轴契约与素材越界校验。'],
          ['分级预览与幂等成片渲染', '先低成本生成 720P 预览片完成画面与版权终审，确认无误后通过 VectCut 或 Shotstack 渲染器幂等输出 1080P 成片。'],
        ],
        en: [
          ['Story planning & MCP retrieval', 'Ingests copy or a creative brief to generate a structured StoryPlan and query candidate video assets across MCP servers.'],
          ['Human curation & timeline compilation', 'Creators lock in 1–3 clips per shot; the Agent applies an editing skill to compile an EditPlan that must pass timeline schema and asset-scope checks.'],
          ['Staged preview & idempotent render', 'Produces a fast 720p preview for visual and licensing sign-off before dispatching an idempotent 1080p final render via VectCut or Shotstack.'],
        ],
      },
      boundaries: {
        zh: [
          '轻量级单机状态引擎：采用 FastAPI + SQLite 构建自包含的本地工作台架构，聚焦核心编排与状态机验证，暂不引入重型多租户权限系统。',
          '专注剪辑编排主航道：配音与数字人轨支持直接挂载就绪媒体文件，将 TTS 语音合成解耦为外部前置环节以保持流水线纯粹。',
          '付费渲染防重安全网：针对外部商业渲染 API 设计了严格的未知状态保护（不盲目自动重试防重复计费），并内置完整的离线 Mock 渲染器供零成本测试。',
        ],
        en: [
          'Self-contained state engine: built on FastAPI and SQLite as a focused single-instance workbench, prioritizing deterministic state-machine integrity over multi-tenant auth boilerplate.',
          'Focused editing scope: voiceover and avatar tracks ingest pre-rendered audio/video assets directly, keeping TTS synthesis decoupled upstream.',
          'Paid-render safety guards: blocks blind auto-retries on ambiguous commercial render API responses to prevent double billing, and ships with full offline Mock renderers for zero-cost testing.',
        ],
      },
      references: [
        { path: 'README.md', label: { zh: '剪辑流程与运行边界', en: 'Editing workflow and runtime boundaries' } },
        { path: 'src/mix_video/domain/edit_plan.py', label: { zh: '剪辑计划与时间线结构', en: 'Edit plan and timeline schema' } },
        { path: 'docs/API.md', label: { zh: '素材、任务与渲染接口', en: 'Asset, task and rendering APIs' } },
      ],
    },
  },
  {
    id: 'git', slug: 'dsh-git-plugin', group: 'tools',
    name: { zh: 'DSH Git Plugin · 可视化 Git 工作台', en: 'DSH Git Plugin · Visual Git Workbench' },
    shortName: { zh: 'DSH Git Plugin', en: 'DSH Git Plugin' },
    ownership: { zh: 'IDE 级开发者工具', en: 'IDE-grade Developer Tool' },
    summary: {
      zh: '把对话式编程的 Git 操作关进安全笼：在 DeepSeek Harness 侧栏集成提交图、三栏冲突解决器与基于仓库快照的 AI 命令审阅机制。',
      en: 'Putting conversational Git operations inside a safety cage: embeds a commit graph, three-pane merge conflict resolver, and snapshot-verified AI command proposals directly into the DeepSeek Harness sidebar.',
    },
    role: {
      zh: '独立设计并实现 Host / Client 双端通信插件架构、Git 底层操作封装、可视化三栏冲突合并编辑器，以及防过期误执行的仓库状态快照（Snapshot）校验协议。',
      en: 'Architected and built the Host/Client plugin bridge, Git command abstraction layer, visual three-pane merge conflict editor, and snapshot-based proposal freshness protocol.',
    },
    proofs: {
      zh: [
        ['全息仓库状态透视', '在 IDE 侧栏实时渲染分支拓扑图、暂存/工作区 Diff、Tag、Stash 栈及远端同步水位，消除终端盲操心智负担。'],
        ['可视化三栏冲突消解', '内置 Current / Incoming / Result 三栏对比视图，支持冲突块一键采纳、行级手动精修与合并状态无缝续接。'],
        ['基于哈希快照的 AI 提议防呆', '对工作区文件内容、Refs 引用与 Index 暂存态生成复合快照签名；一旦仓库状态发生漂移，立即拦截过期的 AI Git 命令提议。'],
      ],
      en: [
        ['Full-fidelity repo telemetry', 'Renders commit topology graphs, staged/unstaged diffs, branches, tags, stashes, and remote sync status directly in the sidebar without terminal context-switching.'],
        ['Visual three-pane conflict resolver', 'Aligns Current, Incoming, and Result panes side by side for per-hunk adoption, manual inline editing, and seamless merge continuation.'],
        ['Snapshot-guarded AI proposals', 'Computes composite state signatures across file contents, refs, and the Git index—automatically invalidating stale AI command proposals if the repo changes.'],
      ],
    },
    tags: ['TypeScript', 'Git', 'DeepSeek Harness'],
    source: 'https://github.com/IT-coder-Yy/dsh-git-plugin',
    caseStudy: {
      context: {
        zh: '在 AI 辅助编程对话中，直接让大模型代执行 Git 命令犹如在刀尖上跳舞——一旦工作区状态在对话间隙发生变化，过期的 rebase、reset 或 checkout 极易造成代码丢失。本插件将可视化 Git 工作台深度嵌入 DeepSeek Harness Web 侧栏，并首创“提议—快照签名—审阅执行”机制，给 AI 的每一次仓库写操作戴上确定性安全锁。',
        en: 'Letting an LLM blindly execute Git commands during a coding session is a recipe for disaster—if the working tree shifts mid-conversation, a stale rebase, reset, or checkout can wipe out uncommitted work. This plugin embeds a full visual Git workbench into the DeepSeek Harness Web sidebar and enforces a "Propose → Snapshot Verify → Review & Execute" protocol that locks every AI-generated Git action behind deterministic freshness checks.',
      },
      workflow: {
        zh: [
          ['可视化洞察变更', '在侧栏直观浏览提交拓扑图、文件级 Diff 与分支同步状态，精准定位当前工作区上下文。'],
          ['AI 提议与快照锁定', '通过交互式暂存编写提交，或唤起独立 Git 助手生成多步命令提案，同时自动绑定当前仓库的复合状态快照。'],
          ['安全执行与冲突救援', '人工审阅并校验快照未过期后执行命令；若触发合并冲突则无缝切入三栏编辑器消解，异常中断时完整保留诊断现场。'],
        ],
        en: [
          ['Inspect repo topology & diffs', 'Browse the commit graph, file-level diffs, and branch sync status in the sidebar to establish clear operational context.'],
          ['Draft proposals with snapshot locks', 'Stage changes interactively or ask the Git assistant for a multi-step command plan bound to a cryptographic-style snapshot of current repo state.'],
          ['Verified execution & conflict rescue', 'Execute proposals only after human review and snapshot validation; seamlessly transition into the three-pane merge editor on conflicts with full diagnostic logs.'],
        ],
      },
      boundaries: {
        zh: [
          '深度集成宿主生态：专为 DeepSeek Harness Web 环境打造，依托宿主的 Node.js 进程与本地 Git 引擎运行，定位为本地开发增效工具而非云端代码托管平台。',
          '高危操作防御红线：任何涉及改写提交历史的操作均需显式二次确认，且在架构层彻底禁用自动强制推送（Force Push）。',
          '前端渲染性能护栏：三栏冲突编辑器针对超大体积或二进制文件设有保护阈值，内存态编辑草稿遵循轻量设计不跨页面刷新持久化。',
        ],
        en: [
          'Host-integrated workbench: purpose-built for the DeepSeek Harness Web ecosystem backed by local Node.js and Git binaries, rather than a standalone cloud Git host.',
          'Destructive-action guardrails: history-rewriting operations demand explicit confirmation, and automated force-pushing is architecturally disabled.',
          'UI performance safeguards: the three-pane merge editor enforces file-size and binary guards to keep rendering snappy, keeping unsaved conflict drafts in transient memory.',
        ],
      },
      references: [
        { path: 'README.md', label: { zh: '工作台功能与操作边界', en: 'Workbench features and operation boundaries' } },
        { path: 'src/host/proposal-snapshot.ts', label: { zh: '仓库状态快照', en: 'Repository state snapshots' } },
        { path: 'package.json', label: { zh: '插件入口与发布配置', en: 'Plugin entry points and package configuration' } },
      ],
    },
  },
  {
    id: 'random', slug: 'random-zh', group: 'tools',
    name: { zh: 'random_zh · 中文文本生成 API', en: 'random_zh · Chinese Text API' },
    shortName: { zh: 'random_zh', en: 'random_zh' },
    ownership: { zh: '高契约轻量微服务', en: 'Contract-Driven Microservice' },
    summary: {
      zh: '小而美的中文语料与诗句抽样微服务：基于 FastAPI 与 Pydantic 严格契约，提供开箱即用的合成中文文本、古典诗句随机抽样及 Serverless 接入。',
      en: 'A compact, contract-first Chinese corpus and verse sampling microservice: built with FastAPI and strict Pydantic schemas for synthetic CJK text generation, classical poetry sampling, and Serverless deployment.',
    },
    role: {
      zh: '独立设计并实现基于 Pydantic 强类型契约的 REST 接口、Unicode 汉字编码区间合成引擎、本地古典诗句无放回抽样及 Mangum Serverless 云函数适配器。',
      en: 'Designed and implemented Pydantic-validated REST endpoints, a Unicode CJK range text synthesizer, without-replacement local verse sampling, and a Mangum Serverless adapter.',
    },
    proofs: {
      zh: [
        ['双模中文造数引擎', '融合 Unicode 基本汉字编码区间随机生成与 Faker（zh_CN）语义短句拼接，同时涵盖字符级压力测试与自然排版占位需求。'],
        ['无放回古典诗句抽样', '流式加载并清洗本地 Markdown 诗句语料库，基于 random.sample 实现单次请求内的零重复高熵随机抽样。'],
        ['强类型契约与 Serverless 就绪', '利用 Pydantic 严格锁定 count 请求边界（1–99）与统一 result 响应载荷，并通过 Mangum 封装 AWS Lambda / 云函数标准入口。'],
      ],
      en: [
        ['Dual-mode CJK text synthesis', 'Combines raw Unicode CJK code-point generation with Faker (zh_CN) natural sentences to serve both character-boundary stress tests and UI layout mocking.'],
        ['Without-replacement verse sampling', 'Loads and sanitizes local Markdown poetry corpora, using random.sample to guarantee duplicate-free verse draws per request.'],
        ['Strict schema & Serverless-ready', 'Enforces request bounds (count 1–99) and normalized result payloads via Pydantic, wrapped with Mangum for zero-friction AWS Lambda / Serverless deployment.'],
      ],
    },
    tags: ['FastAPI', 'Faker', 'Pydantic'],
    source: 'https://github.com/IT-coder-Yy/random_zh',
    caseStudy: {
      context: {
        zh: '在中文前端排版测试、字库渲染验证与接口压测中，标准的英文 Lorem Ipsum 无法暴露全角标点、多字节字符截断与中西文混排等边界问题，而为造数引入重量级大模型又过于笨重。本服务秉持“小而美、强契约”的微服务设计理念，用极简的 FastAPI 架构提供毫秒级响应的合成中文语料与古典诗句抽样接口。',
        en: 'Standard Latin Lorem Ipsum fails to expose CJK-specific edge cases in UI layout testing, font rendering, and multi-byte string truncation, while spinning up an LLM just for mock data is massive overkill. Built around a minimal, contract-first microservice philosophy, this FastAPI service delivers sub-millisecond synthetic Chinese text and classical verse sampling.',
      },
      workflow: {
        zh: [
          ['Pydantic 契约前置拦截', '客户端向文本或诗句端点发起 POST 请求，Pydantic 自动校验并将生成数量 count 严格约束在 1–99 的安全区间。'],
          ['混合语料合成与无放回抽样', '文本引擎将 Unicode 随机汉字与 Faker 中文短句交替组装；诗句引擎从预清洗的非空语料行中执行无放回随机抽取。'],
          ['标准化载荷与云函数投递', '将合成结果统一封装为确定性的 result JSON 结构返回，支持本地 ASGI 容器运行或通过 Mangum 直接挂载至 Serverless 网关。'],
        ],
        en: [
          ['Upfront Pydantic validation', 'Clients POST to the text or verse endpoints where Pydantic schemas automatically validate payloads and clamp the count parameter strictly between 1 and 99.'],
          ['Hybrid synthesis & sampling', 'The text engine interleaves random Unicode CJK characters with Faker zh_CN sentences; the verse engine performs without-replacement sampling over sanitized corpus lines.'],
          ['Normalized payload & Serverless handoff', 'Returns results inside a unified JSON response contract, runnable via standard ASGI servers or deployed as a Serverless function through Mangum.'],
        ],
      },
      boundaries: {
        zh: [
          '确定性算法造数定位：专注于高吞吐、低延迟的字符合成与既有诗句抽样，服务于工程测试与排版占位，而非基于大模型的开放式诗歌创作。',
          '本地静态语料驱动：诗句抽样依托随包分发的精简 Markdown 语料文件运行，架构上保持零外部数据库依赖，启动时需确保语料文件非空就绪。',
          '云原生适配边界：代码层已完整集成 Mangum ASGI-to-Lambda 桥接器以支持无服务化扩展，仓库交付聚焦于核心源码与 Poetry 依赖锁定。',
        ],
        en: [
          'Deterministic mock-data scope: engineered for high-throughput, low-latency character synthesis and corpus sampling in UI/API testing rather than generative LLM poetry composition.',
          'Zero-DB static corpus design: samples directly from a bundled Markdown verse corpus to maintain zero external database dependencies, assuming a populated corpus file at startup.',
          'Serverless adapter readiness: includes the Mangum ASGI-to-Lambda bridge for cloud-function scaling, delivered as a clean source and Poetry-locked repository.',
        ],
      },
      references: [
        { path: 'src/1/main.py', label: { zh: '接口、校验与抽样实现', en: 'Endpoints, validation and sampling' } },
        { path: 'pyproject.toml', label: { zh: 'Python 项目与依赖', en: 'Python project and dependencies' } },
      ],
    },
  },
];
