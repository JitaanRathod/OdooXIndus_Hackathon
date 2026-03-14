require('dotenv').config();

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const { PORT, FRONTEND_URL } = require('./src/config/env');
const { connectDB } = require('./src/config/db');
require('./src/models'); // initialise all models + associations

const swaggerSpec = require('./src/docs/swagger');
const errorHandler = require('./src/middleware/errorHandler');

// ── Route imports ────────────────────────────────────────────────────────────
const authRoutes   = require('./src/routes/auth.routes');
const healthRoutes = require('./src/routes/health.routes');
// Future modules will be imported here:
// const productRoutes   = require('./src/routes/product.routes');
// const receiptRoutes   = require('./src/routes/receipt.routes');
// const deliveryRoutes  = require('./src/routes/delivery.routes');
// const transferRoutes  = require('./src/routes/transfer.routes');
// const adjustmentRoutes = require('./src/routes/adjustment.routes');
// const inventoryRoutes = require('./src/routes/inventory.routes');
// const warehouseRoutes = require('./src/routes/warehouse.routes');
// const dashboardRoutes = require('./src/routes/dashboard.routes');
// const userRoutes      = require('./src/routes/user.routes');

const app = express();

// ── Global middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Swagger UI (no auth required — judges can explore live) ─────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Stockify API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth',   authRoutes);
app.use('/api/v1/health', healthRoutes);
// Future routes:
// app.use('/api/v1/products',    productRoutes);
// app.use('/api/v1/receipts',    receiptRoutes);
// app.use('/api/v1/deliveries',  deliveryRoutes);
// app.use('/api/v1/transfers',   transferRoutes);
// app.use('/api/v1/adjustments', adjustmentRoutes);
// app.use('/api/v1/inventory',   inventoryRoutes);
// app.use('/api/v1/warehouses',  warehouseRoutes);
// app.use('/api/v1/dashboard',   dashboardRoutes);
// app.use('/api/v1/users',       userRoutes);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Central error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 Stockify API running on http://localhost:${PORT}`);
    console.log(`📖 Swagger docs  → http://localhost:${PORT}/api-docs`);
    console.log(`💚 Health check  → http://localhost:${PORT}/api/v1/health\n`);
  });
};

start();