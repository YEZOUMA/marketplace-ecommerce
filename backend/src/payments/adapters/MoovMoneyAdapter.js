import { MobileMoneyAdapter } from './MobileMoneyAdapter.js';
import { env } from '../../config/env.js';

export class MoovMoneyAdapter extends MobileMoneyAdapter {
  constructor() {
    super('MOOV_MONEY', env.payments.moovMoney);
  }

  // TODO: implement the real Moov Money API call here using this.config once credentials
  // are available.
}
