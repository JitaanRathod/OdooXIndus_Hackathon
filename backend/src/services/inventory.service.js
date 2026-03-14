const { Inventory, Product, Location, Warehouse } = require('../models');

const list = async (query = {}) => {
  const where = {};
  if (query.product_id)  where.product_id  = query.product_id;
  if (query.location_id) where.location_id = query.location_id;
  return Inventory.findAll({
    where,
    include: [
      { model: Product,  as: 'product' },
      { model: Location, as: 'location', include: [{ model: Warehouse, as: 'warehouse' }] },
    ],
    order: [['product_id', 'ASC']],
  });
};

module.exports = { list };