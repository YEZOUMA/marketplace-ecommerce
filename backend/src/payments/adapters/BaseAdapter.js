// Common interface every mobile money adapter must implement (Adapter pattern).
// This lets the rest of the app (payment.service.js) talk to any provider identically,
// and new providers are added by dropping in a new adapter + factory entry — nothing
// else changes.
export class BaseAdapter {
  /** Unique provider key matching the Prisma PaymentProvider enum. */
  get providerKey() {
    throw new Error('providerKey getter must be implemented');
  }

  /**
   * Initiates a payment with the provider.
   * @param {{ amount: number, currency: string, phoneNumber: string, reference: string, description: string }} params
   * @returns {Promise<{ providerTransactionId: string, redirectUrl?: string, status: 'EN_ATTENTE'|'REUSSI'|'ECHOUE', raw?: object }>}
   */
  // eslint-disable-next-line no-unused-vars
  async initiatePayment(params) {
    throw new Error('initiatePayment must be implemented');
  }

  /**
   * Verifies the authenticity of an inbound webhook using the provider's signature scheme.
   * @param {{ rawBody: Buffer, headers: object }} req
   * @returns {boolean}
   */
  // eslint-disable-next-line no-unused-vars
  verifyWebhookSignature(req) {
    throw new Error('verifyWebhookSignature must be implemented');
  }

  /**
   * Normalizes a provider-specific webhook payload into a common shape.
   * @param {object} body
   * @returns {{ reference: string, status: 'REUSSI'|'ECHOUE'|'EN_ATTENTE', providerTransactionId: string, raw: object }}
   */
  // eslint-disable-next-line no-unused-vars
  parseWebhookPayload(body) {
    throw new Error('parseWebhookPayload must be implemented');
  }
}
