import { OrangeMoneyAdapter } from './adapters/OrangeMoneyAdapter.js';
import { MoovMoneyAdapter } from './adapters/MoovMoneyAdapter.js';
import { WaveAdapter } from './adapters/WaveAdapter.js';
import { SankMoneyAdapter } from './adapters/SankMoneyAdapter.js';
import { ApiError } from '../utils/ApiError.js';

// Adding a new mobile money provider = write one adapter class + register it here.
const adapters = {
  ORANGE_MONEY: new OrangeMoneyAdapter(),
  MOOV_MONEY: new MoovMoneyAdapter(),
  WAVE: new WaveAdapter(),
  SANK_MONEY: new SankMoneyAdapter(),
};

export function getPaymentAdapter(providerKey) {
  const adapter = adapters[providerKey];
  if (!adapter) {
    throw ApiError.badRequest(`Prestataire de paiement inconnu: ${providerKey}`);
  }
  return adapter;
}

export function listSupportedProviders() {
  return Object.keys(adapters);
}
