require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'stockify_user',
    password: process.env.DB_PASS || 'stockify123',
    database: process.env.DB_NAME || 'stockify_db',
    host: process.env.DB_HOST || '192.168.56.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
  },
};