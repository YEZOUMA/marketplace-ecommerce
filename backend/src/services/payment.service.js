import { randomUUID } from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { getPaymentAdapter } from '../payments/PaymentProviderFactory.js';

// Initiates the publication fee payment for a product. The product is (re)marked
// EN_ATTENTE_PAIEMENT and stays invisible to clients until the webhook confirms payment.
export async function initiatePublicationPayment(vendeurId, productId, { prestataire, numeroTelephone }) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound('Produit introuvable');
  if (product.vendeurId !== vendeurId) throw ApiError.forbidden('Ce produit ne vous appartient pas');
  if (product.statut === 'PUBLIE') throw ApiError.conflict('Ce produit est déjà publié');

  const reference = randomUUID();
  const amount = env.publicationFee.amount;
  const currency = env.publicationFee.currency;

  const adapter = getPaymentAdapter(prestataire);
  const initResult = await adapter.initiatePayment({
    amount,
    currency,
    phoneNumber: numeroTelephone,
    reference,
    description: `Frais de publication - ${product.nom}`,
  });

  const [payment] = await prisma.$transaction([
    prisma.productPublicationPayment.create({
      data: {
        productId,
        vendeurId,
        montant: amount,
        devise: currency,
        prestataire,
        referenceTransaction: reference,
        statut: 'EN_ATTENTE',
        metadata: {
          numeroTelephone,
          providerTransactionId: initResult.providerTransactionId,
          initiation: initResult.raw ?? null,
        },
      },
    }),
    prisma.product.update({ where: { id: productId }, data: { statut: 'EN_ATTENTE_PAIEMENT' } }),
  ]);

  return { payment, redirectUrl: initResult.redirectUrl };
}

// Applies the outcome of a webhook (or mock simulation) atomically: the payment record
// and the product's visibility flip together, so a product can never end up PUBLIE
// without a corresponding REUSSI payment (and vice versa).
export async function confirmPublicationPayment({ prestataire, reference, status, providerTransactionId, raw }) {
  const payment = await prisma.productPublicationPayment.findUnique({ where: { referenceTransaction: reference } });
  if (!payment) throw ApiError.notFound('Paiement introuvable pour cette référence');
  if (payment.prestataire !== prestataire) throw ApiError.badRequest('Prestataire incohérent avec la référence');

  // Idempotency: a webhook may be retried by the provider; only the first terminal
  // status transition has an effect.
  if (payment.statut !== 'EN_ATTENTE') {
    return payment;
  }

  const newStatus = status === 'REUSSI' ? 'REUSSI' : 'ECHOUE';
  const productStatus = newStatus === 'REUSSI' ? 'PUBLIE' : 'BROUILLON';

  const [updatedPayment] = await prisma.$transaction([
    prisma.productPublicationPayment.update({
      where: { id: payment.id },
      data: {
        statut: newStatus,
        dateConfirmation: new Date(),
        metadata: {
          ...(payment.metadata ?? {}),
          providerTransactionId: providerTransactionId ?? payment.metadata?.providerTransactionId,
          webhook: raw ?? null,
        },
      },
    }),
    prisma.product.update({ where: { id: payment.productId }, data: { statut: productStatus } }),
  ]);

  return updatedPayment;
}

export async function listVendorPayments(vendeurId) {
  return prisma.productPublicationPayment.findMany({
    where: { vendeurId },
    include: { product: { select: { id: true, nom: true, statut: true } } },
    orderBy: { dateCreation: 'desc' },
  });
}
