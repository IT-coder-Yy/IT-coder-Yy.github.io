import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { BLOG_CATEGORIES } from './lib/blog-meta';

const blogSchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(60).max(160),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    category: z.enum(BLOG_CATEGORIES),
    tags: z
      .array(z.string().trim().min(1))
      .min(1)
      .max(6)
      .refine((tags) => new Set(tags).size === tags.length, '标签不能重复'),
    draft: z.boolean(),
    featured: z.boolean(),
    series: z.string().trim().min(1).optional(),
    seriesOrder: z.number().int().positive().optional(),
  })
  .superRefine((data, context) => {
    if (data.series && data.seriesOrder === undefined) {
      context.addIssue({
        code: 'custom',
        path: ['seriesOrder'],
        message: '存在 series 时必须填写正整数 seriesOrder',
      });
    }
    if (!data.series && data.seriesOrder !== undefined) {
      context.addIssue({
        code: 'custom',
        path: ['seriesOrder'],
        message: '只有存在 series 时才能填写 seriesOrder',
      });
    }
  });

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/data/blog' }),
  schema: blogSchema,
});

export const collections = { blog };
