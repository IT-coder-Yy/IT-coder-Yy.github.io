export const BLOG_CATEGORIES = [
  'Agent 工程',
  '视觉与推理',
  'C++ / Qt',
  '系统与部署',
  '论文阅读',
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
