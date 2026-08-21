import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, durationToMs } from '../utils/tokens.js';
import { env } from '../config/env.js';

const SALT_ROUNDS = 12;

function toPublicUser(user) {
  const { motDePasse, ...publicUser } = user;
  return publicUser;
}

export async function register({ nom, email, telephone, motDePasse, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict('Un compte existe déjà avec cet email');
  }

  const hashed = await bcrypt.hash(motDePasse, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { nom, email, telephone, motDePasse: hashed, role: role || 'CLIENT' },
  });

  return issueTokens(user);
}

export async function login({ email, motDePasse }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw ApiError.unauthorized('Email ou mot de passe incorrect');
  }

  const valid = await bcrypt.compare(motDePasse, user.motDePasse);
  if (!valid) {
    throw ApiError.unauthorized('Email ou mot de passe incorrect');
  }

  return issueTokens(user);
}

export async function refresh(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Refresh token invalide ou expiré');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token invalide ou révoqué');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw ApiError.unauthorized('Utilisateur introuvable');
  }

  // Rotate: revoke the old refresh token and issue a new pair.
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  return issueTokens(user);
}

export async function logout(refreshToken) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken },
    data: { revoked: true },
  });
}

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = signRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + durationToMs(env.jwt.refreshExpiresIn)),
    },
  });

  return { user: toPublicUser(user), accessToken, refreshToken };
}
