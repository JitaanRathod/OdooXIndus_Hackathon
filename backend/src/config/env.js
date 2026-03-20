require('dotenv').config();

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set in production.');
}

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT) || 5432,
  DB_NAME: process.env.DB_NAME || 'stockify_db',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASS: process.env.DB_PASS || '',

  JWT_SECRET: process.env.JWT_SECRET || 'local_dev_secret_not_used_in_prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  OTP_EXPIRES_MINUTES: parseInt(process.env.OTP_EXPIRES_MINUTES) || 10,

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};