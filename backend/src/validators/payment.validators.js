import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  body: z.object({
    prestataire: z.enum(['ORANGE_MONEY', 'MOOV_MONEY', 'WAVE', 'SANK_MONEY']),
    numeroTelephone: z.string().min(8).max(20),
  }),
  params: z.object({ productId: z.string().uuid() }),
});

export const webhookParamsSchema = z.object({
  params: z.object({
    prestataire: z.enum(['ORANGE_MONEY', 'MOOV_MONEY', 'WAVE', 'SANK_MONEY']),
  }),
});

export const mockSimulateSchema = z.object({
  body: z.object({
    reference: z.string().min(1),
    resultat: z.enum(['REUSSI', 'ECHOUE']).default('REUSSI'),
  }),
});
