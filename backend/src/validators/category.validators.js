import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    nom: z.string().min(2).max(255),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    nom: z.string().min(2).max(255),
  }),
  params: z.object({ id: z.string().uuid() }),
});
