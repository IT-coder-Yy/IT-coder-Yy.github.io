import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getBlogPosts } from '../lib/blog';
import { sitePath } from '../lib/paths';

export const GET: APIRoute = async (context) => {
  if (!context.site) {
    return new Response(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0"><channel>',
        '<title>于洋技术博客（待配置）</title>',
        '<link>/blog</link>',
        '<description>部署时设置 SITE_URL 后启用带绝对地址的正式 RSS。</description>',
        '</channel></rss>',
      ].join(''),
      {
        headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
      },
    );
  }

  const posts = await getBlogPosts({ includeDrafts: false });

  return rss({
    title: '于洋技术博客',
    description: 'AI Agent、红外视觉、C++ / Qt 与模型部署的中文工程实践。',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: sitePath(`/blog/${post.id}`),
      categories: [post.data.category, ...post.data.tags],
    })),
    customData: '<language>zh-CN</language>',
  });
};
