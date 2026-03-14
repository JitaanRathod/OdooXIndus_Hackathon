const { Product, Inventory, Location, Warehouse } = require('../models');
const { Op } = require('sequelize');

// Returns all products where total qty_on_hand across all locations < reorder_point
const getAlerts = async () => {
  const inventory = await Inventory.findAll({
    include: [
      {
        model: Product,
        as: 'product',
        where: { is_active: true },
        attributes: ['id', 'name', 'sku', 'unit_of_measure', 'reorder_point'],
      },
      {
        model: Location,
        as: 'location',
        include: [{ model: Warehouse, as: 'warehouse', attributes: ['id', 'name'] }],
      },
    ],
  });

  // Aggregate qty_on_hand per product across all locations
  const productMap = {};
  for (const inv of inventory) {
    const pid = inv.product_id;
    if (!productMap[pid]) {
      productMap[pid] = {
        id:              inv.product?.id,
        name:            inv.product?.name,
        sku:             inv.product?.sku,
        unit_of_measure: inv.product?.unit_of_measure,
        reorder_point:   parseFloat(inv.product?.reorder_point || 0),
        total_qty:       0,
        locations:       [],
      };
    }
    const qty = parseFloat(inv.qty_on_hand);
    productMap[pid].total_qty += qty;
    productMap[pid].locations.push({
      location: inv.location?.name,
      warehouse: inv.location?.warehouse?.name,
      qty_on_hand: qty,
    });
  }

  // Filter to only low-stock or out-of-stock products
  const alerts = Object.values(productMap).filter(
    (p) => p.total_qty <= p.reorder_point
  );

  // Sort: out of stock first, then lowest stock ratio
  alerts.sort((a, b) => {
    if (a.total_qty === 0 && b.total_qty !== 0) return -1;
    if (b.total_qty === 0 && a.total_qty !== 0) return 1;
    return (a.total_qty / a.reorder_point) - (b.total_qty / b.reorder_point);
  });

  return alerts.map((p) => ({
    ...p,
    status: p.total_qty === 0 ? 'out_of_stock' : 'low_stock',
  }));
};

module.exports = { getAlerts };