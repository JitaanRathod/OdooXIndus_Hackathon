const { StockMove, Product, Location, User } = require('../models');
const { Op } = require('sequelize');

const list = async (query = {}) => {
  const where = {};
  if (query.type)       where.type       = query.type;
  if (query.product_id) where.product_id = query.product_id;
  if (query.user_id)    where.user_id    = query.user_id;
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt[Op.gte] = new Date(query.from);
    if (query.to)   where.createdAt[Op.lte] = new Date(query.to + 'T23:59:59');
  }
  return StockMove.findAll({
    where,
    include: [
      { model: Product,  as: 'product',      attributes: ['id','name','sku'] },
      { model: Location, as: 'fromLocation', attributes: ['id','name'] },
      { model: Location, as: 'toLocation',   attributes: ['id','name'] },
      { model: User,     as: 'user',         attributes: ['id','name'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: 500,
  });
};

module.exports = { list };