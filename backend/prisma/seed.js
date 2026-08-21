import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const categories = ['Électronique', 'Mode', 'Maison & Jardin', 'Beauté & Santé', 'Sport & Loisirs', 'Alimentation'];
  for (const nom of categories) {
    await prisma.category.upsert({ where: { nom }, update: {}, create: { nom } });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@marketplace.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMoi123!';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        nom: 'Administrateur',
        email: adminEmail,
        motDePasse: hashed,
        role: 'ADMIN',
      },
    });
    console.log(`[seed] Compte admin créé: ${adminEmail} / ${adminPassword} (à changer immédiatement)`);
  } else {
    console.log('[seed] Compte admin déjà existant, ignoré.');
  }

  console.log('[seed] Terminé.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
