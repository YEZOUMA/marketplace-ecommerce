import { z } from 'zod';

const imageSchema = z.object({
  url: z.string().min(1),
  ordre: z.number().int().min(0).default(0),
});

export const createProductSchema = z.object({
  body: z.object({
    nom: z.string().min(2).max(255),
    description: z.string().min(10),
    prix: z.number().positive('Le prix doit être positif'),
    stock: z.number().int().min(0).default(0),
    categorieId: z.string().uuid().optional(),
    images: z.array(imageSchema).max(8).default([]),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    nom: z.string().min(2).max(255).optional(),
    description: z.string().min(10).optional(),
    prix: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
    categorieId: z.string().uuid().nullable().optional(),
    images: z.array(imageSchema).max(8).optional(),
  }),
  params: z.object({ id: z.string().uuid() }),
});

export const listProductsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    categorieId: z.string().uuid().optional(),
    vendeurId: z.string().uuid().optional(),
    prixMin: z.coerce.number().min(0).optional(),
    prixMax: z.coerce.number().min(0).optional(),
    q: z.string().max(255).optional(),
    statut: z.enum(['BROUILLON', 'EN_ATTENTE_PAIEMENT', 'PUBLIE', 'SUSPENDU']).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
