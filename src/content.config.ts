import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(), // название услуги (H1 на странице услуги)
    seoTitle: z.string(),
    description: z.string(), // meta description
    situation: z.string(), // заголовок карточки «через ситуацию клиента»
    short: z.string(),
    icon: z.enum(['stack', 'upright', 'arrow', 'envelope', 'parties', 'cube']),
    order: z.number(),
    price: z.string(),
    timing: z.string(),
    includes: z.array(z.string()),
    forWhom: z.array(z.string()),
    fromClient: z.array(z.string()),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updated: z.string(),
  }),
});

export const collections = { services, legal };
