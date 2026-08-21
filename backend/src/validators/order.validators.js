import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantite: z.number().int().positive(),
        }),
      )
      .min(1, 'La commande doit contenir au moins un article'),
    adresseLivraison: z.string().min(5, 'Adresse de livraison requise'),
    notes: z.string().max(1000).optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    statut: z.enum(['EN_ATTENTE', 'CONFIRMEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE']),
  }),
  params: z.object({ id: z.string().uuid() }),
});
