require('dotenv').config();

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const rateLimit = require('express-rate-limit');

const { PORT, FRONTEND_URL } = require('./src/config/env');
const { connectDB } = require('./src/config/db');
require('./src/models');

const swaggerSpec = require('./src/docs/swagger');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Trust Railway/Heroku reverse proxy so rate limiter sees real IP
app.set('trust proxy', 1);

// ── CORS ─────────────────────────────────────────────────────────────────────
// Support multiple allowed origins (local dev + Vercel production)
const allowedOrigins = [
  'https://odoo-x-indus-hackathon.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.error("❌ Blocked by CORS:", origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.options('*', cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── Rate Limiting (auth only) ─────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
});

// ── Swagger ───────────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Stockify API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter, require('./src/routes/auth.routes'));
app.use('/api/v1/health', require('./src/routes/health.routes'));
app.use('/api/v1/products', require('./src/routes/product.routes'));
app.use('/api/v1/categories', require('./src/routes/category.routes'));
app.use('/api/v1/warehouses', require('./src/routes/warehouse.routes'));
app.use('/api/v1/locations', require('./src/routes/location.routes'));
app.use('/api/v1/receipts', require('./src/routes/receipt.routes'));
app.use('/api/v1/deliveries', require('./src/routes/delivery.routes'));
app.use('/api/v1/transfers', require('./src/routes/transfer.routes'));
app.use('/api/v1/adjustments', require('./src/routes/adjustment.routes'));
app.use('/api/v1/inventory', require('./src/routes/inventory.routes'));
app.use('/api/v1/stock-moves', require('./src/routes/stockmove.routes'));
app.use('/api/v1/dashboard', require('./src/routes/dashboard.routes'));
app.use('/api/v1/alerts', require('./src/routes/alerts.routes'));
app.use('/api/v1/users', require('./src/routes/user.routes'));

app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` })
);
app.use(errorHandler);

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 Stockify API  → http://localhost:${PORT}`);
    console.log(`📖 Swagger docs  → http://localhost:${PORT}/api-docs`);
    console.log(`💚 Health check  → http://localhost:${PORT}/api/v1/health\n`);
  });
};

start();