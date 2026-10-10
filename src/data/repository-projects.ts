import type { PortfolioProject } from './portfolio';

// 根据公开 README、依赖声明与关键源码整理；不将仓库能力推定为个人独立贡献。
export const repositoryProjects: (PortfolioProject & { caseStudy: NonNullable<PortfolioProject['caseStudy']> })[] = [
  {
    id: 'recruitment', slug: 'super-recruitment', group: 'agent',
    name: { zh: 'Super Recruitment · AI 招聘自动化', en: 'Super Recruitment · AI Hiring Workflow' },
    shortName: { zh: 'Super Recruitment', en: 'Super Recruitment' },
    ownership: { zh: '应用 Demo', en: 'Application demo' },
    summary: {
      zh: '以确定性工作流串联简历解析、JD 证据评分、面试排期、Offer 与入职跟进，关键招聘决定由人工审批。',
      en: 'A deterministic hiring workflow connecting resume parsing, evidence-based JD scoring, interviews, offers and onboarding, with human approval for hiring decisions.',
    },
    role: {
      zh: '实现范围涵盖候选人状态管理、AI 解析与评估、预约流程、Offer 审批和招聘看板。',
      en: 'Implementation spans candidate state, AI parsing and assessment, interview booking, offer approval and a recruiting dashboard.',
    },
    proofs: {
      zh: [
        ['状态机与人工审批', '集中定义候选人状态转换，面试与录用流程保留人工决策入口。'],
        ['AI 双模式', 'Mock 与 OpenAI-compatible 模式支持演示及真实模型调用，评分结合 JD 与简历证据。'],
        ['业务数据闭环', 'SQLite 管理候选人、岗位、排期与审计记录，并提供漏斗看板和 XLSX / CSV 导出。'],
      ],
      en: [
        ['State and approval', 'Explicit candidate transitions retain human decisions in interview and hiring workflows.'],
        ['Two AI modes', 'Mock and OpenAI-compatible modes support demonstrations and model calls grounded in resume and JD evidence.'],
        ['Connected records', 'SQLite stores candidates, jobs, schedules and audit records, with funnel views and XLSX / CSV export.'],
      ],
    },
    tags: ['FastAPI', 'SQLite', 'Human-in-the-loop'],
    source: 'https://github.com/IT-coder-Yy/Super-Recruitment',
    caseStudy: {
      context: {
        zh: '招聘信息分散在简历、聊天、排期与表格中，人工录入和状态核对容易反复。这个本地 Demo 用数据库统一记录业务状态，让 AI 承担结构化与辅助评分，让 HR 保留决定权。',
        en: 'Recruiting information is scattered across resumes, chats, schedules and spreadsheets. This local demo centralizes business state while using AI for structured extraction and supporting assessment, with decisions retained by HR.',
      },
      workflow: {
        zh: [['采集与解析', '采集模拟平台数据或上传简历，提取字段、查重并人工补全缺失资料。'], ['评估与面试', '生成 JD 证据评分，经人工审批进入预约、排期与面试反馈。'], ['Offer 与入职', '审批并发放 Offer，记录候选人接受或拒绝，接受后创建入职跟进任务。']],
        en: [['Capture and parse', 'Collect demo data or upload resumes, extract fields, check duplicates and complete missing details.'], ['Assess and interview', 'Generate JD-based assessment, then approve interview booking, scheduling and feedback.'], ['Offer and onboard', 'Approve an offer, record acceptance or rejection, and create onboarding tasks after acceptance.']],
      },
      boundaries: {
        zh: ['默认使用虚构候选人与 Mock AI；会议、日历和通知需区分模拟记录与真实接入。', 'XLSX / CSV 导出是协作出口，不能等同于腾讯文档实时同步。', '模型不自动淘汰或录用候选人，薪资等 Offer 条款需由 HR 填写。'],
        en: ['Default data and AI responses are simulated; meeting, calendar and notification integrations have separate configuration requirements.', 'Spreadsheet export is a collaboration handoff, not live Tencent Docs synchronization.', 'The model does not autonomously reject or hire candidates; HR supplies offer terms such as compensation.'],
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
    ownership: { zh: '学习应用', en: 'Learning application' },
    summary: {
      zh: '把提示词课程、12 个业务场景、变量模板与消融实验放在同一学习站，通过比较输出理解 Prompt 设计。',
      en: 'A learning site connecting prompt lessons, 12 business scenarios, variable templates and ablation experiments to explore how prompt choices affect output.',
    },
    role: {
      zh: '实现范围涵盖课程与场景内容、模板变量预览、实验室交互和服务端模型接口。',
      en: 'Implementation covers lessons, scenarios, template previews, an interactive playground and server-side model calls.',
    },
    proofs: {
      zh: [['从课程到场景', '分阶段课程与业务场景共同承载可复制的 Prompt 模板。'], ['可比较的实验', '比较 Prompt、模型参数与提示技术，提供 JSON 有效性和必需字段检查。'], ['演示与真实调用', '未配置模型时明确展示预置演示；真实调用由服务端读取密钥并转发。']],
      en: [['Lessons and scenarios', 'Staged lessons and business scenarios provide reusable prompt templates.'], ['Comparable experiments', 'Compare prompts, model parameters and techniques, with JSON validity and required-field checks.'], ['Demo and live modes', 'Clearly labeled examples work without credentials; configured calls use server-side API keys.']],
    },
    tags: ['Next.js', 'TypeScript', 'Prompt Evaluation'],
    source: 'https://github.com/IT-coder-Yy/Prompt_Engineering',
    caseStudy: {
      context: {
        zh: '学习提示词容易停留在复制模板。这个站点把课程拆解、业务场景、变量填写和实验比较连接起来，帮助初学者观察输入结构与模型输出之间的关系。',
        en: 'Prompt learning can stop at copying templates. This site connects explanation, business scenarios, variable inputs and comparative experiments so beginners can examine how input structure relates to model output.',
      },
      workflow: {
        zh: [['学习与拆解', '从分阶段课程理解提示词结构，再进入具体业务场景。'], ['填写与预览', '选择模板、填写变量，预览并复制组成后的 Prompt。'], ['运行与比较', '在实验室调整提示词或模型参数，对比输出和结构检查结果。']],
        en: [['Learn and inspect', 'Study prompt structure through staged lessons and practical scenarios.'], ['Fill and preview', 'Choose a template, fill its variables and preview the assembled prompt.'], ['Run and compare', 'Change prompts or model parameters and compare outputs and structural checks.']],
      },
      boundaries: {
        zh: ['演示模式使用预置结果，不代表实时模型推理。', '真实实验需要配置兼容 Chat Completions 的模型服务，密钥保留在服务端。', 'JSON 与字段检查只能验证结构，不能单独证明内容正确或业务效果。'],
        en: ['Demo mode uses preset results rather than live model inference.', 'Live experiments require a compatible Chat Completions service; credentials stay on the server.', 'JSON and field checks assess structure, not factual accuracy or business effectiveness.'],
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
    ownership: { zh: '上游项目适配', en: 'Upstream adaptation' },
    summary: {
      zh: '基于 PullMyBoots/X-MinimaxH3 开展 MiniMax H3 本地部署，仓库定位为 CUDA 12.4 环境适配。',
      en: 'A local MiniMax H3 deployment adaptation based on PullMyBoots/X-MinimaxH3, targeting a CUDA 12.4 environment.',
    },
    role: {
      zh: '本仓库聚焦 CUDA 环境适配；视频生成引擎、Web 控制台与调度能力来自上游项目。',
      en: 'This repository focuses on CUDA environment adaptation; the generation engine, web console and scheduling capabilities originate upstream.',
    },
    proofs: {
      zh: [['本地生成入口', '继承上游中英文 Web 控制台与 REST API，提供 FL2VA / Ref2VA 任务入口。'], ['资源与任务管理', '上游方案包含显存分档、Base / LoRA 切换、任务队列与断点预览。'], ['适配范围明确', '仓库说明指向 CUDA 12.4 适配，原始实现与贡献边界保留上游归属。']],
      en: [['Local generation', 'The upstream bilingual console and REST API expose FL2VA and Ref2VA workflows.'], ['Resources and tasks', 'Upstream features include memory profiles, Base / LoRA switching, a task queue and checkpoint previews.'], ['Explicit adaptation scope', 'The repository targets CUDA 12.4 while retaining attribution for the original upstream implementation.']],
    },
    tags: ['Python', 'CUDA', 'MiniMax H3'],
    source: 'https://github.com/IT-coder-Yy/X-MinimaxH3',
    caseStudy: {
      context: {
        zh: '视频生成服务不仅依赖模型权重，也依赖 GPU、PyTorch、CUDA 与本地扩展的兼容组合。本仓库基于已有 H3 服务进行环境适配，重点是让上游能力与目标部署环境衔接。',
        en: 'A video-generation service depends on compatible GPU hardware, PyTorch, CUDA and native extensions as well as model weights. This repository adapts an existing H3 service to a target deployment environment.',
      },
      workflow: {
        zh: [['部署适配', '围绕目标 CUDA 环境检查运行依赖、模型路径与原生扩展。'], ['创建任务', '通过上游 Web 控制台或 API 提交文本、首尾帧或参考媒体条件。'], ['调度与输出', '沿用上游资源配置、任务队列与生成结果管理流程。']],
        en: [['Adapt the environment', 'Check runtime dependencies, model paths and native extensions for the target CUDA environment.'], ['Create a task', 'Use the upstream console or API for text, frame-conditioned or reference-media generation.'], ['Schedule and retrieve', 'Use upstream resource profiles, task queues and result management.']],
      },
      boundaries: {
        zh: ['这是对 PullMyBoots/X-MinimaxH3 的适配，不将上游模型、生成引擎或测试成绩描述为个人原创成果。', '仓库简介声明 CUDA 12.4 适配，但保留的 README 验证配置仍为 CUDA 13.x；目标环境兼容性应以实际运行验证为准。', '仓库不分发模型权重，使用时需另行遵守上游代码与模型许可。'],
        en: ['This adapts PullMyBoots/X-MinimaxH3; the upstream model, engine and test results are not presented as original personal work.', 'The repository description targets CUDA 12.4, while the retained README reports CUDA 13.x validation. Target-environment compatibility needs runtime verification.', 'Model weights are not distributed here; upstream code and model licenses still apply.'],
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
    ownership: { zh: 'Agent 应用', en: 'Agent application' },
    summary: {
      zh: '从创作需求生成分镜、检索素材，在用户选片后编排剪辑计划，经过预览与授权确认再输出成片。',
      en: 'Turns a creative brief into a story plan and asset search, then builds an edit from user-selected clips for preview, approval and final rendering.',
    },
    role: {
      zh: '实现范围涵盖 StoryPlan / EditPlan、素材 MCP 接入、剪辑 Skill、渲染适配与可恢复任务状态。',
      en: 'Implementation spans StoryPlan / EditPlan, asset MCP integration, an editing skill, render adapters and durable task state.',
    },
    proofs: {
      zh: [['计划分层', '先生成 StoryPlan，再基于已选候选生成 EditPlan，用结构化时间线连接模型与渲染服务。'], ['选片与授权边界', '每个镜头由用户选择 1–3 个候选，模型只能在选定素材范围内编排。'], ['版本与任务持久化', 'SQLite 保存计划、选片和渲染状态；输入变化使下游审批失效，同一版本提交具有幂等保护。']],
      en: [['Layered plans', 'StoryPlan precedes EditPlan; a structured timeline connects model decisions to rendering services.'], ['Selection and authorization', 'Users choose one to three candidates per shot; the model edits only within that selection.'], ['Durable versions and tasks', 'SQLite retains plans, selections and render state. Input changes invalidate approval; repeat submissions have idempotency protection.']],
    },
    tags: ['FastAPI', 'MCP', 'Streamlit'],
    source: 'https://github.com/IT-coder-Yy/Mix-Video',
    caseStudy: {
      context: {
        zh: '从文案走到短视频，需要协调分镜、素材、时间线、版权确认与渲染服务。项目将模型规划与确定性校验分开：Agent 提出剪辑方案，程序检查候选范围、时间线及渲染条件。',
        en: 'Turning copy into a short video requires storyboarding, assets, a timeline, permission checks and rendering. The Agent proposes an edit, while deterministic code checks candidate scope, timeline constraints and rendering prerequisites.',
      },
      workflow: {
        zh: [['分镜与素材', '提交口播文案或创作需求，生成 StoryPlan 并经 MCP 检索素材候选。'], ['选片与剪辑', '用户确认镜头候选，Agent 按剪辑 Skill 生成经过结构校验的 EditPlan。'], ['预览与成片', '提交 720P 预览，确认效果与素材授权后，通过 VectCut 或 Shotstack 生成 1080P 成片。']],
        en: [['Story and assets', 'Submit copy or a creative brief to create a StoryPlan and retrieve candidates through MCP.'], ['Select and edit', 'Users select candidates, then an editing skill guides the Agent toward a validated EditPlan.'], ['Preview and render', 'Review a 720p preview and confirm asset permissions before a 1080p final render via VectCut or Shotstack.']],
      },
      boundaries: {
        zh: ['当前以单个 API 实例和 SQLite 运行，没有登录与用户隔离。', '配音和数字人模式需上传已就绪素材，项目不提供 TTS 生成。', '渲染需要外部供应商配置；付费提交结果不明时不会自动重试，离线测试使用模拟服务。'],
        en: ['The current SQLite setup uses one API instance and has no login or user isolation.', 'Voiceover and avatar modes require prepared media; TTS generation is not included.', 'Rendering requires provider configuration. Ambiguous paid submissions are not retried automatically; offline tests use mocks.'],
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
    ownership: { zh: '开发工具插件', en: 'Developer plugin' },
    summary: {
      zh: '在 DeepSeek Harness Web 中查看提交图与差异、完成常用 Git 操作，并在审阅后执行 AI 生成的工作流。',
      en: 'A Git workbench inside DeepSeek Harness Web for commit graphs, diffs, everyday operations and reviewed AI-generated workflows.',
    },
    role: {
      zh: '实现范围涵盖 Host / Client 插件、Git 操作封装、三栏冲突处理、独立 Git 助手与提议快照校验。',
      en: 'Implementation spans Host / Client integration, Git operations, three-pane conflict resolution, a Git assistant and proposal snapshot validation.',
    },
    proofs: {
      zh: [['仓库可视化', '提交历史、暂存与未暂存差异、分支、标签、Stash 和远端同步状态集中展示。'], ['冲突处理', '三栏比较当前版本、传入版本与结果，支持逐块选择、手工编辑和继续操作。'], ['提议时效校验', '仓库快照包含文件内容、引用与索引等信息，仓库变化后拒绝执行过期 AI 提议。']],
      en: [['Repository visibility', 'View history, staged and unstaged diffs, branches, tags, stashes and remote sync state.'], ['Conflict resolution', 'Compare current, incoming and result panes, choose individual blocks or edit the result manually.'], ['Proposal freshness', 'Snapshots include file contents, refs and index state so repository changes invalidate stale AI proposals.']],
    },
    tags: ['TypeScript', 'Git', 'DeepSeek Harness'],
    source: 'https://github.com/IT-coder-Yy/dsh-git-plugin',
    caseStudy: {
      context: {
        zh: '在编程对话中处理 Git，需要同时理解仓库状态、命令影响与执行结果。插件把这些信息带入 Harness 侧栏，并让自然语言生成的命令先成为可审阅的提议。',
        en: 'Working with Git during a coding conversation requires understanding repository state, command effects and execution results. This plugin brings them into the Harness sidebar and turns generated commands into proposals for review.',
      },
      workflow: {
        zh: [['理解变更', '查看提交图、文件差异、分支与同步状态，明确操作对象。'], ['准备与审阅', '暂存文件、生成或编辑提交信息，也可让独立 Git 助手提出多步骤命令。'], ['执行与恢复', '确认后执行操作；出现冲突时进入三栏编辑器，失败时保留输出与诊断。']],
        en: [['Inspect changes', 'Review history, diffs, branches and sync state to identify the intended operation.'], ['Prepare and review', 'Stage files, draft or edit a commit message, or ask the Git assistant for a multi-step proposal.'], ['Execute and recover', 'Run reviewed actions, resolve conflicts in the three-pane editor and retain failure output for diagnosis.']],
      },
      boundaries: {
        zh: ['插件依赖 DeepSeek Harness Web、Node.js 与本地 Git，不是独立托管的代码平台。', '涉及改写历史等操作需要确认，不自动强制推送。', '冲突编辑存在文件大小与类型限制，未保存的编辑草稿不跨页面刷新保留。'],
        en: ['The plugin requires DeepSeek Harness Web, Node.js and local Git; it is not a standalone hosted code platform.', 'History-changing actions require confirmation and never force-push automatically.', 'Conflict editing has file-size and type limits; unsaved drafts do not survive a page reload.'],
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
    ownership: { zh: '轻量 API 实验', en: 'Small API experiment' },
    summary: {
      zh: '用 FastAPI、Faker 与本地诗句库提供随机中文文本和诗句抽样接口，实践参数校验与结构化响应。',
      en: 'A small FastAPI service using Faker and a local poetry file for random Chinese text and verse sampling, with validated inputs and structured responses.',
    },
    role: {
      zh: '实现两个 POST 接口、数量参数校验、本地诗句加载与随机抽样，并提供 Mangum 适配入口。',
      en: 'Implementation includes two POST endpoints, count validation, local verse loading, random sampling and a Mangum adapter entry point.',
    },
    proofs: {
      zh: [['随机中文文本', '组合 Unicode 汉字范围内的随机字符与 Faker 的 zh_CN 句子。'], ['本地诗句抽样', '从 Markdown 文件读取非空行，通过 random.sample 抽取诗句。'], ['接口契约', 'Pydantic 将 count 限制在 1–99，响应统一使用 result 字段。']],
      en: [['Random Chinese text', 'Combines random Unicode CJK characters with Faker sentences in the zh_CN locale.'], ['Local verse sampling', 'Reads non-empty Markdown lines and samples them with random.sample.'], ['API contract', 'Pydantic constrains count to 1–99 and returns output in a result field.']],
    },
    tags: ['FastAPI', 'Faker', 'Pydantic'],
    source: 'https://github.com/IT-coder-Yy/random_zh',
    caseStudy: {
      context: {
        zh: '这是一个体量较小的 Python API 练习，将中文样例文本与本地诗句抽样封装成可调用接口。项目说明来自实际源码；当前 README 为空。',
        en: 'This compact Python API exercise exposes Chinese sample text and local verse sampling as callable endpoints. The description is grounded in source code because the current README is empty.',
      },
      workflow: {
        zh: [['提交数量', '调用文本或诗句接口，使用 count 指定请求数量。'], ['生成或抽样', '文本接口组合随机汉字与 Faker 句子；诗句接口从已加载的非空行中抽样。'], ['返回结果', '将生成内容拼接为字符串，放入统一的 result 响应字段。']],
        en: [['Request a count', 'Call the text or verse endpoint with a count parameter.'], ['Generate or sample', 'The text endpoint combines random characters and Faker sentences; the verse endpoint samples loaded lines.'], ['Return the result', 'Concatenate the content into a string in the shared result response field.']],
      },
      boundaries: {
        zh: ['这是随机文本与已有诗句抽样，不是大模型写诗或语义生成。', '诗句接口依赖本地素材文件；当前源码的空诗库分支存在未初始化返回值问题，仍需完善。', '存在 Mangum 入口不代表已验证线上部署，此处不提供未经确认的在线演示链接。'],
        en: ['This generates random sample text and samples existing verses; it does not use a language model to compose poetry.', 'The verse endpoint depends on a local file; its empty-library branch currently leaves the return value uninitialized.', 'A Mangum entry point does not establish a verified deployment; no unconfirmed live demo is linked.'],
      },
      references: [
        { path: 'src/1/main.py', label: { zh: '接口、校验与抽样实现', en: 'Endpoints, validation and sampling' } },
        { path: 'pyproject.toml', label: { zh: 'Python 项目与依赖', en: 'Python project and dependencies' } },
      ],
    },
  },
];
