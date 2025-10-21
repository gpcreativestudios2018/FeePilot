import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_API_BASE: z.string().url().optional().default(''),
  NEXT_PUBLIC_ANALYTICS_KEY: z.string().optional(),
});

export const env = schema.parse({
  NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
  NEXT_PUBLIC_ANALYTICS_KEY: process.env.NEXT_PUBLIC_ANALYTICS_KEY,
});