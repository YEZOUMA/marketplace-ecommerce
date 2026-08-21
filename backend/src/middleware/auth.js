import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Verifies the Bearer access token and attaches { id, role, email } to req.user.
export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Token d\'accès manquant');
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    throw ApiError.unauthorized('Token d\'accès invalide ou expiré');
  }
});

// Like authenticate, but does not fail when no/invalid token is present — used on public
// endpoints (e.g. product listing) whose result set is adapted when a user IS logged in.
export const optionalAuthenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.jwt.accessSecret);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
  } catch {
    // Ignore invalid token on optional routes; treat as anonymous.
  }
  next();
};

// Restricts a route to a set of roles. Usage: authorize('ADMIN', 'VENDEUR')
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  if (!roles.includes(req.user.role)) {
    throw ApiError.forbidden('Vous n\'avez pas les droits pour effectuer cette action');
  }
  next();
};
