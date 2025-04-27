const ccxt = require('ccxt');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { apiKey, apiSecret, baseCurrency, pairCurrency, type, price, amount } = req.body;
        
        // Initialize exchange (using Binance as example)
        const exchange = new ccxt.binance({
            apiKey,
            secret: apiSecret,
            enableRateLimit: true
        });

        const symbol = `${pairCurrency}/${baseCurrency}`;
        
        let order;
        if (type === 'buy') {
            order = await exchange.createLimitBuyOrder(symbol, amount, price);
        } else if (type === 'sell') {
            order = await exchange.createLimitSellOrder(symbol, amount, price);
        } else {
            return res.status(400).json({ error: 'Invalid trade type' });
        }

        return res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Trade error:', error);
        return res.status(500).json({ 
            success: false,
            error: error.message
        });
    }
};