import { randomUUID } from 'node:crypto';
import { BaseAdapter } from './BaseAdapter.js';
import { computeHmacSignature, timingSafeEqualHex } from './signature.js';
import { env } from '../../config/env.js';

/**
 * Shared implementation for all mobile money providers.
 *
 * Two modes:
 *  - mockMode (default, PAYMENTS_MOCK_MODE!=='false'): no external call is made. A fake
 *    provider transaction id is generated and the payment stays EN_ATTENTE until a webhook
 *    is simulated (see POST /api/payments/mock/simulate). This lets the whole
 *    "publier -> payer -> webhook -> produit publié" flow be exercised end-to-end without
 *    real mobile money credentials.
 *  - live mode: subclasses override `callProviderApi` to perform the actual HTTP call to
 *    the provider's API using credentials from `this.config` (populated from .env). Swap
 *    in real credentials and implement the provider's actual request/response contract —
 *    the rest of the app (payment.service.js, webhook route) does not need to change.
 *
 * Signature verification uses a shared HMAC-SHA256 scheme keyed on PAYMENTS_WEBHOOK_SECRET
 * in mock mode. Real providers each define their own signing scheme (header name, algorithm) —
 * override `verifyWebhookSignature` per adapter once integrating the real provider.
 */
export class MobileMoneyAdapter extends BaseAdapter {
  constructor(providerKey, config) {
    super();
    this._providerKey = providerKey;
    this.config = config;
  }

  get providerKey() {
    return this._providerKey;
  }

  async initiatePayment(params) {
    if (env.payments.mockMode || !this.config.apiKey) {
      return this.mockInitiatePayment(params);
    }
    return this.callProviderApi(params);
  }

  mockInitiatePayment({ reference }) {
    const providerTransactionId = `MOCK-${this.providerKey}-${randomUUID()}`;
    return {
      providerTransactionId,
      // Front-end mock confirmation screen; a real integration would redirect to the
      // provider's hosted payment page instead.
      redirectUrl: `/vendeur/paiement/simuler?reference=${encodeURIComponent(reference)}&prestataire=${this.providerKey}`,
      status: 'EN_ATTENTE',
      raw: { mock: true, providerTransactionId },
    };
  }

  // eslint-disable-next-line no-unused-vars
  async callProviderApi(params) {
    throw new Error(
      `${this.providerKey}: intégration réelle non configurée. Fournissez les clés API dans .env ou laissez PAYMENTS_MOCK_MODE=true.`,
    );
  }

  verifyWebhookSignature({ rawBody, headers }) {
    const signature = headers['x-signature'] || headers['x-webhook-signature'];
    if (!signature) return false;

    const secret = env.payments.mockMode ? env.payments.webhookSecret : this.config.apiSecret;
    const expected = computeHmacSignature(rawBody, secret);
    return timingSafeEqualHex(expected, signature);
  }

  parseWebhookPayload(body) {
    return {
      reference: body.reference,
      status: body.status, // 'REUSSI' | 'ECHOUE' | 'EN_ATTENTE'
      providerTransactionId: body.providerTransactionId,
      raw: body,
    };
  }
}
