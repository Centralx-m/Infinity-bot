const ccxt = require('ccxt');
const config = require('../api/config');

class BitgetClient {
  constructor() {
    this.exchange = new ccxt.bitget({
      apiKey: config.BITGET_API_KEY,
      secret: config.BITGET_API_SECRET,
      password: config.BITGET_API_PASSPHRASE,
      enableRateLimit: true,
      options: {
        defaultType: 'swap'
      }
    });
  }

  async getPrice(symbol) {
    try {
      const ticker = await this.exchange.fetchTicker(symbol);
      return ticker.last;
    } catch (error) {
      console.error('Error fetching price:', error);
      throw error;
    }
  }

  async createGridOrder(symbol, type, price, amount) {
    try {
      const orderParams = {
        price: price.toString(),
        amount: amount.toString(),
        symbol,
        type: 'limit'
      };

      let order;
      if (type === 'buy') {
        order = await this.exchange.createOrder(symbol, 'limit', 'buy', amount, price);
      } else {
        order = await this.exchange.createOrder(symbol, 'limit', 'sell', amount, price);
      }

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getBalances() {
    try {
      return await this.exchange.fetchBalance();
    } catch (error) {
      console.error('Error fetching balances:', error);
      throw error;
    }
  }
}

module.exports = new BitgetClient();