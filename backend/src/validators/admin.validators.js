import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  query: z.object({
    role: z.enum(['CLIENT', 'VENDEUR', 'ADMIN']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const setProductStatusSchema = z.object({
  body: z.object({
    statut: z.enum(['BROUILLON', 'EN_ATTENTE_PAIEMENT', 'PUBLIE', 'SUSPENDU']),
  }),
  params: z.object({ id: z.string().uuid() }),
});

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export const listPaymentsQuerySchema = z.object({
  query: z.object({
    statut: z.enum(['EN_ATTENTE', 'REUSSI', 'ECHOUE']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});
