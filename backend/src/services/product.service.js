const { Product, Category, Inventory, sequelize } = require('../models');
const AppError = require('../utils/AppError');

const list = async (query = {}) => {
  const limit = parseInt(query.limit) || 100;
  const offset = parseInt(query.offset) || 0;
  const products = await Product.findAll({
    include: [{ model: Category, as: 'category' }],
    order: [['name', 'ASC']],
    limit,
    offset,
  });
  const [inv] = await sequelize.query(
    `SELECT product_id, SUM(qty_on_hand) as total FROM inventory GROUP BY product_id`
  );
  const qtyMap = {};
  inv.forEach(r => { qtyMap[r.product_id] = parseFloat(r.total); });
  return products.map(p => ({ ...p.toJSON(), qty_on_hand: qtyMap[p.id] ?? 0 }));
};

const getOne = async (id) => {
  const p = await Product.findByPk(id, {
    include: [{ model: Category, as: 'category' }],
  });
  if (!p) throw new AppError('Product not found', 404);

  // Attach total stock across all locations
  const [inv] = await sequelize.query(
    `SELECT SUM(qty_on_hand) as total FROM inventory WHERE product_id = :pid`,
    { replacements: { pid: id } }
  );
  return { ...p.toJSON(), qty_on_hand: parseFloat(inv[0]?.total) || 0 };
};

const create = async (data) => Product.create(data);

const update = async (id, data) => {
  const p = await Product.findByPk(id);
  if (!p) throw new AppError('Product not found', 404);
  return p.update(data);
};

const remove = async (id) => {
  const p = await Product.findByPk(id);
  if (!p) throw new AppError('Product not found', 404);

  // Check for references before deleting — prevent raw FK constraint errors
  const [invRows] = await sequelize.query(
    `SELECT COUNT(*) as cnt FROM inventory WHERE product_id = :pid`,
    { replacements: { pid: id } }
  );
  if (parseInt(invRows[0]?.cnt) > 0) {
    throw new AppError(
      'This product has inventory records. Mark it as inactive instead of deleting.',
      409
    );
  }

  const [moveRows] = await sequelize.query(
    `SELECT COUNT(*) as cnt FROM stock_moves WHERE product_id = :pid`,
    { replacements: { pid: id } }
  );
  if (parseInt(moveRows[0]?.cnt) > 0) {
    throw new AppError(
      'This product has stock move history. Mark it as inactive instead of deleting.',
      409
    );
  }

  await p.destroy();
};

module.exports = { list, getOne, create, update, remove };