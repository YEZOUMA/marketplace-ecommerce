import { prisma } from '../src/config/prisma.js';

// Wipes all app tables between test files, respecting FK order (children first).
export async function resetDb() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productPublicationPayment.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

afterAll(async () => {
  await prisma.$disconnect();
});
