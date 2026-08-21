import { MobileMoneyAdapter } from './MobileMoneyAdapter.js';
import { env } from '../../config/env.js';

export class WaveAdapter extends MobileMoneyAdapter {
  constructor() {
    super('WAVE', env.payments.wave);
  }

  // TODO: implement the real Wave Checkout API call here using this.config once
  // credentials are available.
}
