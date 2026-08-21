import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route introuvable: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  if (err?.name === 'ZodError') {
    return res.status(400).json({
      error: 'Données invalides',
      details: err.issues?.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  // Prisma unique constraint violation
  if (err?.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflit: une ressource avec ces données existe déjà',
      details: err.meta?.target,
    });
  }

  if (err?.code === 'P2025') {
    return res.status(404).json({ error: 'Ressource introuvable' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Erreur interne du serveur' });
}
