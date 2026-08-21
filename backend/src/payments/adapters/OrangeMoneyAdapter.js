import { MobileMoneyAdapter } from './MobileMoneyAdapter.js';
import { env } from '../../config/env.js';

export class OrangeMoneyAdapter extends MobileMoneyAdapter {
  constructor() {
    super('ORANGE_MONEY', env.payments.orangeMoney);
  }

  // TODO: implement the real Orange Money Web Payment API call here using
  // this.config.apiKey / apiSecret / baseUrl once credentials are available.
}
