const bitget = require('../lib/bitget');
const jwt = require('jsonwebtoken');
const config = require('./config');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify JWT
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, config.JWT_SECRET);

    const { symbol, type, price, amount } = req.body;
    if (!symbol || !type || !price || !amount) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const order = await bitget.createGridOrder(symbol, type, price, amount);
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};