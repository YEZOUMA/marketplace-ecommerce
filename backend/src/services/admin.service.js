import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

export async function listUsers({ role, page = 1, pageSize = 20 }) {
  const where = role ? { role } : {};
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, nom: true, email: true, telephone: true, role: true, dateCreation: true },
      orderBy: { dateCreation: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function setProductStatus(productId, statut) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound('Produit introuvable');
  return prisma.product.update({ where: { id: productId }, data: { statut } });
}

export async function listAllOrders({ page = 1, pageSize = 20 }) {
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      include: {
        client: { select: { id: true, nom: true, email: true } },
        items: { include: { product: { select: { id: true, nom: true, vendeurId: true } } } },
      },
      orderBy: { dateCreation: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count(),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function listAllPublicationPayments({ statut, page = 1, pageSize = 20 }) {
  const where = statut ? { statut } : {};
  const [items, total] = await Promise.all([
    prisma.productPublicationPayment.findMany({
      where,
      include: {
        product: { select: { id: true, nom: true, statut: true } },
        vendeur: { select: { id: true, nom: true, email: true } },
      },
      orderBy: { dateCreation: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.productPublicationPayment.count({ where }),
  ]);
  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function globalStats() {
  const [
    totalUsers,
    totalVendeurs,
    totalClients,
    totalProduits,
    produitsPublies,
    totalCommandes,
    revenuPublicationTotal,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'VENDEUR' } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.product.count(),
    prisma.product.count({ where: { statut: 'PUBLIE' } }),
    prisma.order.count(),
    prisma.productPublicationPayment.aggregate({
      where: { statut: 'REUSSI' },
      _sum: { montant: true },
    }),
  ]);

  return {
    totalUsers,
    totalVendeurs,
    totalClients,
    totalProduits,
    produitsPublies,
    totalCommandes,
    revenuPublicationTotal: revenuPublicationTotal._sum.montant ?? 0,
  };
}
