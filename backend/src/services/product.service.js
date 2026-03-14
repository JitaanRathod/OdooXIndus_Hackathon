const { Product, Category, Inventory, sequelize } = require('../models');
const AppError = require('../utils/AppError');

const list = async () => {
  const products = await Product.findAll({
    include: [{ model: Category, as: 'category' }],
    order: [['name', 'ASC']],
  });
  const [inv] = await sequelize.query(
    `SELECT product_id, SUM(qty_on_hand) as total FROM inventory GROUP BY product_id`
  );
  const qtyMap = {};
  inv.forEach(r => { qtyMap[r.product_id] = parseFloat(r.total); });
  return products.map(p => ({ ...p.toJSON(), qty_on_hand: qtyMap[p.id] || 0 }));
};

const getOne = async (id) => {
  const p = await Product.findByPk(id, { include: [{ model: Category, as: 'category' }] });
  if (!p) throw new AppError('Product not found', 404);
  return p;
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
  await p.destroy();
};

module.exports = { list, getOne, create, update, remove };