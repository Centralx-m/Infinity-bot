// Bitget API configuration from environment variables
module.exports = {
  BITGET_API_KEY: process.env.BITGET_API_KEY,
  BITGET_API_SECRET: process.env.BITGET_API_SECRET,
  BITGET_API_PASSPHRASE: process.env.BITGET_API_PASSPHRASE,
  JWT_SECRET: process.env.JWT_SECRET || 'secure-secret-key'
};