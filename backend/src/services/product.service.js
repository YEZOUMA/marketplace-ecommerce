import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { deleteImage } from './storage.service.js';

const productInclude = {
  images: { orderBy: { ordre: 'asc' } },
  categorie: true,
  vendeur: { select: { id: true, nom: true, email: true, telephone: true } },
};

export async function createProduct(vendeurId, data) {
  const { images, ...rest } = data;

  return prisma.product.create({
    data: {
      ...rest,
      vendeurId,
      statut: 'BROUILLON',
      images: { create: images.map((img, idx) => ({ url: img.url, ordre: img.ordre ?? idx })) },
    },
    include: productInclude,
  });
}

export async function listProducts(filters, viewer) {
  const { page, pageSize, categorieId, vendeurId, prixMin, prixMax, q, statut } = filters;

  const where = {};

  if (categorieId) where.categorieId = categorieId;
  if (vendeurId) where.vendeurId = vendeurId;
  if (prixMin !== undefined || prixMax !== undefined) {
    where.prix = {};
    if (prixMin !== undefined) where.prix.gte = prixMin;
    if (prixMax !== undefined) where.prix.lte = prixMax;
  }
  if (q) where.nom = { contains: q, mode: 'insensitive' };

  // Access control on status: public/client view only ever sees published products;
  // a vendor may request their own drafts; an admin may filter freely.
  if (viewer?.role === 'ADMIN') {
    if (statut) where.statut = statut;
  } else if (viewer?.role === 'VENDEUR' && vendeurId === viewer.id) {
    where.statut = statut || undefined;
  } else {
    where.statut = 'PUBLIE';
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { dateCreation: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getProductById(id, viewer) {
  const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
  if (!product) throw ApiError.notFound('Produit introuvable');

  const isOwner = viewer && product.vendeurId === viewer.id;
  const isAdmin = viewer?.role === 'ADMIN';
  if (product.statut !== 'PUBLIE' && !isOwner && !isAdmin) {
    throw ApiError.notFound('Produit introuvable');
  }

  return product;
}

async function assertOwnership(productId, vendeurId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound('Produit introuvable');
  if (product.vendeurId !== vendeurId) throw ApiError.forbidden('Ce produit ne vous appartient pas');
  return product;
}

export async function updateProduct(productId, vendeurId, data) {
  await assertOwnership(productId, vendeurId);

  // Editing a published product's core fields (price handled separately in real workflow);
  // here we simply allow updates and keep status as-is unless it was suspended by admin.
  const { images, ...rest } = data;

  return prisma.$transaction(async (tx) => {
    if (images) {
      await tx.productImage.deleteMany({ where: { productId } });
      await tx.productImage.createMany({
        data: images.map((img, idx) => ({ productId, url: img.url, ordre: img.ordre ?? idx })),
      });
    }

    return tx.product.update({
      where: { id: productId },
      data: rest,
      include: productInclude,
    });
  });
}

export async function deleteProduct(productId, vendeurId) {
  const product = await assertOwnership(productId, vendeurId);

  const images = await prisma.productImage.findMany({ where: { productId } });
  await prisma.product.delete({ where: { id: product.id } });
  await Promise.all(images.map((img) => deleteImage(img.url)));
}

export async function getVendorDashboardStats(vendeurId) {
  const [totalProduits, produitsPublies, produitsEnAttente, commandesRecues] = await Promise.all([
    prisma.product.count({ where: { vendeurId } }),
    prisma.product.count({ where: { vendeurId, statut: 'PUBLIE' } }),
    prisma.product.count({ where: { vendeurId, statut: 'EN_ATTENTE_PAIEMENT' } }),
    prisma.orderItem.count({ where: { product: { vendeurId } } }),
  ]);

  return { totalProduits, produitsPublies, produitsEnAttente, commandesRecues };
}
