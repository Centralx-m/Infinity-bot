const bitget = require('../lib/bitget');
const jwt = require('jsonwebtoken');
const config = require('./config');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify JWT
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, config.JWT_SECRET);

    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });

    const price = await bitget.getPrice(symbol);
    res.status(200).json({ price });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};