import { MobileMoneyAdapter } from './MobileMoneyAdapter.js';
import { env } from '../../config/env.js';

export class SankMoneyAdapter extends MobileMoneyAdapter {
  constructor() {
    super('SANK_MONEY', env.payments.sankMoney);
  }

  // TODO: implement the real Sank Money API call here using this.config once
  // credentials are available.
}
