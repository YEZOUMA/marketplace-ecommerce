import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
    email: z.string().email('Email invalide'),
    telephone: z.string().min(8).max(32).optional(),
    motDePasse: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    role: z.enum(['CLIENT', 'VENDEUR']).default('CLIENT'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email invalide'),
    motDePasse: z.string().min(1, 'Mot de passe requis'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token requis'),
  }),
});
