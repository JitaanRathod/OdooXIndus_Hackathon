const { Product, Category, sequelize } = require('../models');

const getAlerts = async () => {
  // LEFT JOIN so products with NO inventory rows at all are included (total_qty = 0)
  const [rows] = await sequelize.query(`
    SELECT
      p.id, p.name, p.sku, p.unit_of_measure,
      p.reorder_point,
      COALESCE(SUM(i.qty_on_hand), 0) AS total_qty
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    WHERE p.is_active = 1
    GROUP BY p.id, p.name, p.sku, p.unit_of_measure, p.reorder_point
    HAVING COALESCE(SUM(i.qty_on_hand), 0) <= p.reorder_point
    ORDER BY total_qty ASC
  `);

  return rows.map(p => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    unit_of_measure: p.unit_of_measure,
    reorder_point: parseFloat(p.reorder_point) || 0,
    total_qty: parseFloat(p.total_qty) || 0,
    status: parseFloat(p.total_qty) === 0 ? 'out_of_stock' : 'low_stock',
  }));
};

module.exports = { getAlerts };