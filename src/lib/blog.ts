import { getCollection, type CollectionEntry } from 'astro:content';
import { sitePath } from './paths';

export type BlogPost = CollectionEntry<'blog'>;

export function estimateReadingTime(content: string) {
  const text = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  const cjkCharacters = (text.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g) ?? []).length;
  const latinWords = (text
    .replace(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g, ' ')
    .match(/[A-Za-z0-9][A-Za-z0-9_./:+-]*/g) ?? []).length;

  return Math.max(1, Math.ceil(cjkCharacters / 400 + latinWords / 200));
}

export function formatBlogDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai',
  }).format(date);
}

export function postHref(post: BlogPost) {
  return sitePath(`/blog/${post.id}`);
}

export async function getBlogPosts(options: { includeDrafts?: boolean } = {}) {
  const includeDrafts = options.includeDrafts ?? import.meta.env.DEV;
  const posts = await getCollection('blog', ({ data }) => includeDrafts || !data.draft);

  return posts.sort((left, right) => {
    const dateDifference = right.data.publishedAt.getTime() - left.data.publishedAt.getTime();
    return dateDifference || left.id.localeCompare(right.id, 'en');
  });
}

export function getAdjacentPosts(posts: BlogPost[], currentId: string) {
  const currentIndex = posts.findIndex((post) => post.id === currentId);
  if (currentIndex < 0) return { olderPost: undefined, newerPost: undefined };

  return {
    olderPost: posts[currentIndex + 1],
    newerPost: posts[currentIndex - 1],
  };
}
