import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

const orderInclude = {
  items: { include: { product: { include: { images: { orderBy: { ordre: 'asc' }, take: 1 } } } } },
};

// Creates an order: no payment step here (settlement happens outside the app between
// client and vendor/delivery). Stock is decremented atomically with order creation so
// two concurrent orders can never oversell the same stock.
export async function createOrder(clientId, { items, adresseLivraison, notes }) {
  return prisma.$transaction(async (tx) => {
    let total = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw ApiError.notFound(`Produit introuvable: ${item.productId}`);
      if (product.statut !== 'PUBLIE') throw ApiError.badRequest(`Produit non disponible à la vente: ${product.nom}`);
      if (product.stock < item.quantite) {
        throw ApiError.conflict(`Stock insuffisant pour "${product.nom}" (disponible: ${product.stock})`);
      }

      const prixUnitaire = product.prix;
      total += Number(prixUnitaire) * item.quantite;

      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantite } },
      });

      orderItemsData.push({ productId: product.id, quantite: item.quantite, prixUnitaire });
    }

    const order = await tx.order.create({
      data: {
        clientId,
        total,
        adresseLivraison,
        notes,
        statut: 'EN_ATTENTE',
        items: { create: orderItemsData },
      },
      include: orderInclude,
    });

    return order;
  });
}

export async function listClientOrders(clientId) {
  return prisma.order.findMany({
    where: { clientId },
    include: orderInclude,
    orderBy: { dateCreation: 'desc' },
  });
}

export async function getClientOrderById(clientId, orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!order || order.clientId !== clientId) throw ApiError.notFound('Commande introuvable');
  return order;
}

// Orders "received" by a vendor: any order containing at least one of their products.
export async function listVendorOrders(vendeurId) {
  const orders = await prisma.order.findMany({
    where: { items: { some: { product: { vendeurId } } } },
    include: {
      items: {
        where: { product: { vendeurId } },
        include: { product: { include: { images: { orderBy: { ordre: 'asc' }, take: 1 } } } },
      },
      client: { select: { id: true, nom: true, email: true, telephone: true } },
    },
    orderBy: { dateCreation: 'desc' },
  });
  return orders;
}

export async function updateOrderStatusByVendor(vendeurId, orderId, statut) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw ApiError.notFound('Commande introuvable');

  const ownsAtLeastOneItem = await prisma.orderItem.findFirst({
    where: { orderId, product: { vendeurId } },
  });
  if (!ownsAtLeastOneItem) throw ApiError.forbidden('Aucun article de cette commande ne vous appartient');

  return prisma.order.update({ where: { id: orderId }, data: { statut }, include: orderInclude });
}
