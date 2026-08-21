import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { getPaymentAdapter, listSupportedProviders } from '../payments/PaymentProviderFactory.js';
import * as paymentService from '../services/payment.service.js';
import { prisma } from '../config/prisma.js';

export const providers = asyncHandler(async (req, res) => {
  res.json({ providers: listSupportedProviders(), fraisPublication: env.publicationFee });
});

export const initiate = asyncHandler(async (req, res) => {
  const result = await paymentService.initiatePublicationPayment(req.user.id, req.params.productId, req.body);
  res.status(201).json(result);
});

export const myPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.listVendorPayments(req.user.id);
  res.json(payments);
});

// Webhook called by the mobile money provider once the customer (vendor) confirms
// payment on their phone. Signature is verified before anything else is trusted.
export const webhook = asyncHandler(async (req, res) => {
  const { prestataire } = req.params;
  const adapter = getPaymentAdapter(prestataire);

  const isValid = adapter.verifyWebhookSignature({ rawBody: req.rawBody ?? Buffer.from(JSON.stringify(req.body)), headers: req.headers });
  if (!isValid) {
    throw ApiError.unauthorized('Signature de webhook invalide');
  }

  const parsed = adapter.parseWebhookPayload(req.body);
  const payment = await paymentService.confirmPublicationPayment({
    prestataire,
    reference: parsed.reference,
    status: parsed.status,
    providerTransactionId: parsed.providerTransactionId,
    raw: parsed.raw,
  });

  res.json({ received: true, statut: payment.statut });
});

// Development/demo helper: simulates a provider webhook without needing real mobile
// money credentials. Disabled outside mock mode so it can never be used in production
// to fake a payment.
export const mockSimulate = asyncHandler(async (req, res) => {
  if (!env.payments.mockMode) {
    throw ApiError.forbidden('La simulation de paiement est désactivée (PAYMENTS_MOCK_MODE=false)');
  }

  const { reference, resultat } = req.body;
  const paymentRecord = await prisma.productPublicationPayment.findUnique({ where: { referenceTransaction: reference } });
  if (!paymentRecord) throw ApiError.notFound('Paiement introuvable');

  const payment = await paymentService.confirmPublicationPayment({
    prestataire: paymentRecord.prestataire,
    reference,
    status: resultat,
    providerTransactionId: paymentRecord.metadata?.providerTransactionId,
    raw: { simulated: true },
  });

  res.json({ statut: payment.statut });
});
