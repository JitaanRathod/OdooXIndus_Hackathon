require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const swaggerUi  = require('swagger-ui-express');

const { PORT, FRONTEND_URL } = require('./src/config/env');
const { connectDB }          = require('./src/config/db');
require('./src/models');

const swaggerSpec    = require('./src/docs/swagger');
const errorHandler   = require('./src/middleware/errorHandler');

const app = express();

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Stockify API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',        require('./src/routes/auth.routes'));
app.use('/api/v1/health',      require('./src/routes/health.routes'));
app.use('/api/v1/products',    require('./src/routes/product.routes'));
app.use('/api/v1/categories',  require('./src/routes/category.routes'));
app.use('/api/v1/warehouses',  require('./src/routes/warehouse.routes'));
app.use('/api/v1/locations',   require('./src/routes/location.routes'));
app.use('/api/v1/receipts',    require('./src/routes/receipt.routes'));
app.use('/api/v1/deliveries',  require('./src/routes/delivery.routes'));
app.use('/api/v1/transfers',   require('./src/routes/transfer.routes'));
app.use('/api/v1/adjustments', require('./src/routes/adjustment.routes'));
app.use('/api/v1/inventory',   require('./src/routes/inventory.routes'));
app.use('/api/v1/stock-moves', require('./src/routes/stockmove.routes'));
app.use('/api/v1/dashboard',   require('./src/routes/dashboard.routes'));
app.use('/api/v1/users',       require('./src/routes/user.routes'));

app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` }));
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