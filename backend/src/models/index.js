const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin','inventory_manager','warehouse_staff','dispatcher'), allowNull: false, defaultValue: 'warehouse_staff' },
  otp: { type: DataTypes.STRING(6), allowNull: true },
  otp_expires_at: { type: DataTypes.DATE, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'users', timestamps: true,
  defaultScope: { attributes: { exclude: ['password_hash','otp','otp_expires_at'] } },
  scopes: { withPassword: { attributes: {} } },
});

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'categories', timestamps: true });

const Warehouse = sequelize.define('Warehouse', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'warehouses', timestamps: true });

const Location = sequelize.define('Location', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  warehouse_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  zone: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'locations', timestamps: true });

const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  sku: { type: DataTypes.STRING, allowNull: false, unique: true },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
  unit_of_measure: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pcs' },
  reorder_point: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'products', timestamps: true });

const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  product_id: { type: DataTypes.UUID, allowNull: false },
  location_id: { type: DataTypes.INTEGER, allowNull: false },
  qty_on_hand: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
}, { tableName: 'inventory', timestamps: false });

const Receipt = sequelize.define('Receipt', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  reference_no: { type: DataTypes.STRING, allowNull: false, unique: true },
  supplier_name: { type: DataTypes.STRING, allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('draft','waiting','ready','done','cancelled'), defaultValue: 'draft' },
  created_by: { type: DataTypes.UUID, allowNull: false },
  validated_by: { type: DataTypes.UUID, allowNull: true },
  validated_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'receipts', timestamps: true });

const ReceiptLine = sequelize.define('ReceiptLine', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  receipt_id: { type: DataTypes.UUID, allowNull: false },
  product_id: { type: DataTypes.UUID, allowNull: false },
  location_id: { type: DataTypes.INTEGER, allowNull: false },
  qty_expected: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  qty_received: { type: DataTypes.DECIMAL(10,2), allowNull: true },
}, { tableName: 'receipt_lines', timestamps: false });

const Delivery = sequelize.define('Delivery', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  reference_no: { type: DataTypes.STRING, allowNull: false, unique: true },
  customer_name: { type: DataTypes.STRING, allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('draft','picking','packing','done','cancelled'), defaultValue: 'draft' },
  created_by: { type: DataTypes.UUID, allowNull: false },
  validated_by: { type: DataTypes.UUID, allowNull: true },
  validated_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'deliveries', timestamps: true });

const DeliveryLine = sequelize.define('DeliveryLine', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  delivery_id: { type: DataTypes.UUID, allowNull: false },
  product_id: { type: DataTypes.UUID, allowNull: false },
  location_id: { type: DataTypes.INTEGER, allowNull: false },
  qty: { type: DataTypes.DECIMAL(10,2), allowNull: false },
}, { tableName: 'delivery_lines', timestamps: false });

const Transfer = sequelize.define('Transfer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  reference_no: { type: DataTypes.STRING, allowNull: false, unique: true },
  from_location_id: { type: DataTypes.INTEGER, allowNull: false },
  to_location_id: { type: DataTypes.INTEGER, allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('draft','confirmed','cancelled'), defaultValue: 'draft' },
  created_by: { type: DataTypes.UUID, allowNull: false },
  confirmed_by: { type: DataTypes.UUID, allowNull: true },
}, { tableName: 'transfers', timestamps: true });

const TransferLine = sequelize.define('TransferLine', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  transfer_id: { type: DataTypes.UUID, allowNull: false },
  product_id: { type: DataTypes.UUID, allowNull: false },
  qty: { type: DataTypes.DECIMAL(10,2), allowNull: false },
}, { tableName: 'transfer_lines', timestamps: false });

const Adjustment = sequelize.define('Adjustment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  reference_no: { type: DataTypes.STRING, allowNull: false, unique: true },
  location_id: { type: DataTypes.INTEGER, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('draft','applied','cancelled'), defaultValue: 'draft' },
  created_by: { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'adjustments', timestamps: true });

const AdjustmentLine = sequelize.define('AdjustmentLine', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  adjustment_id: { type: DataTypes.UUID, allowNull: false },
  product_id: { type: DataTypes.UUID, allowNull: false },
  qty_expected: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  qty_counted: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  qty_difference: { type: DataTypes.DECIMAL(10,2), allowNull: false },
}, { tableName: 'adjustment_lines', timestamps: false });

const StockMove = sequelize.define('StockMove', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  product_id: { type: DataTypes.UUID, allowNull: false },
  from_location_id: { type: DataTypes.INTEGER, allowNull: true },
  to_location_id: { type: DataTypes.INTEGER, allowNull: true },
  qty: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  type: { type: DataTypes.ENUM('receipt','delivery','transfer','adjustment'), allowNull: false },
  reference_id: { type: DataTypes.UUID, allowNull: true },
  reference_type: { type: DataTypes.STRING, allowNull: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'stock_moves', timestamps: true, updatedAt: false });

// ── Associations ──────────────────────────────────────────────────────────────
Warehouse.hasMany(Location,   { foreignKey: 'warehouse_id', as: 'locations' });
Location.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
Category.hasMany(Product,     { foreignKey: 'category_id',  as: 'products' });
Product.belongsTo(Category,   { foreignKey: 'category_id',  as: 'category' });
Product.hasMany(Inventory,    { foreignKey: 'product_id' });
Inventory.belongsTo(Product,  { foreignKey: 'product_id',   as: 'product' });
Inventory.belongsTo(Location, { foreignKey: 'location_id',  as: 'location' });
Receipt.hasMany(ReceiptLine,     { foreignKey: 'receipt_id',  as: 'lines', onDelete: 'CASCADE' });
ReceiptLine.belongsTo(Receipt,   { foreignKey: 'receipt_id' });
ReceiptLine.belongsTo(Product,   { foreignKey: 'product_id',  as: 'product' });
ReceiptLine.belongsTo(Location,  { foreignKey: 'location_id', as: 'location' });
Receipt.belongsTo(User, { foreignKey: 'created_by',   as: 'creator' });
Receipt.belongsTo(User, { foreignKey: 'validated_by', as: 'validator' });
Delivery.hasMany(DeliveryLine,    { foreignKey: 'delivery_id', as: 'lines', onDelete: 'CASCADE' });
DeliveryLine.belongsTo(Delivery,  { foreignKey: 'delivery_id' });
DeliveryLine.belongsTo(Product,   { foreignKey: 'product_id',  as: 'product' });
DeliveryLine.belongsTo(Location,  { foreignKey: 'location_id', as: 'location' });
Delivery.belongsTo(User, { foreignKey: 'created_by',   as: 'creator' });
Delivery.belongsTo(User, { foreignKey: 'validated_by', as: 'validator' });
Transfer.hasMany(TransferLine,    { foreignKey: 'transfer_id', as: 'lines', onDelete: 'CASCADE' });
TransferLine.belongsTo(Transfer,  { foreignKey: 'transfer_id' });
TransferLine.belongsTo(Product,   { foreignKey: 'product_id',  as: 'product' });
Transfer.belongsTo(Location, { foreignKey: 'from_location_id', as: 'fromLocation' });
Transfer.belongsTo(Location, { foreignKey: 'to_location_id',   as: 'toLocation' });
Transfer.belongsTo(User, { foreignKey: 'created_by',   as: 'creator' });
Transfer.belongsTo(User, { foreignKey: 'confirmed_by', as: 'confirmer' });
Adjustment.hasMany(AdjustmentLine,   { foreignKey: 'adjustment_id', as: 'lines', onDelete: 'CASCADE' });
AdjustmentLine.belongsTo(Adjustment, { foreignKey: 'adjustment_id' });
AdjustmentLine.belongsTo(Product,    { foreignKey: 'product_id', as: 'product' });
Adjustment.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
Adjustment.belongsTo(User,     { foreignKey: 'created_by',  as: 'creator' });
StockMove.belongsTo(Product,  { foreignKey: 'product_id',       as: 'product' });
StockMove.belongsTo(Location, { foreignKey: 'from_location_id', as: 'fromLocation' });
StockMove.belongsTo(Location, { foreignKey: 'to_location_id',   as: 'toLocation' });
StockMove.belongsTo(User,     { foreignKey: 'user_id',          as: 'user' });

module.exports = { sequelize, User, Category, Warehouse, Location, Product, Inventory, Receipt, ReceiptLine, Delivery, DeliveryLine, Transfer, TransferLine, Adjustment, AdjustmentLine, StockMove };