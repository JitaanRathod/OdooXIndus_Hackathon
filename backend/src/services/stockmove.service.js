const { StockMove, Product, Location, User } = require('../models');
const { Op } = require('sequelize');

const list = async (query = {}) => {
  const where = {};
  if (query.type) where.type = query.type;
  if (query.product_id) where.product_id = query.product_id;
  if (query.user_id) where.user_id = query.user_id;
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt[Op.gte] = new Date(query.from);
    if (query.to) where.createdAt[Op.lte] = new Date(query.to + 'T23:59:59');
  }

  const limit = parseInt(query.limit) || 100;
  const offset = parseInt(query.offset) || 0;

  const result = await StockMove.findAll({
    where,
    include: [
      { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
      { model: Location, as: 'fromLocation', attributes: ['id', 'name'] },
      { model: Location, as: 'toLocation', attributes: ['id', 'name'] },
      { model: User, as: 'user', attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  // If a search query is provided, filter by product name or SKU in-memory
  // (Sequelize include-level WHERE on associated model is handled here for simplicity)
  if (query.search) {
    const term = query.search.toLowerCase();
    return result.filter(m =>
      m.product?.name?.toLowerCase().includes(term) ||
      m.product?.sku?.toLowerCase().includes(term)
    );
  }

  return result;
};

module.exports = { list };