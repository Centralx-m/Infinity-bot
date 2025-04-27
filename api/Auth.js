const jwt = require('jsonwebtoken');
const config = require('./config');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // In a real app, you would validate user credentials here
    const token = jwt.sign(
      { userId: 'grid-bot-user' },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};