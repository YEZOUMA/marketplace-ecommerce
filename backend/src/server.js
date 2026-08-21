import fs from 'node:fs';
import { createApp, uploadsPath } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

// Ensure the local uploads directory exists (used as fallback storage when MinIO isn't configured).
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`[backend] API démarrée sur le port ${env.port} (env: ${env.nodeEnv})`);
});

async function shutdown(signal) {
  console.log(`[backend] Signal ${signal} reçu, arrêt en cours...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
