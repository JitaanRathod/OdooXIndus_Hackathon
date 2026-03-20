const { Product, Receipt, Delivery, Transfer, StockMove, Location, User, sequelize } = require('../models');
const { Op } = require('sequelize');

const get = async () => {
  const [products, stockSummary, receipts, deliveries, transfers, recentMoves] = await Promise.all([
    Product.count({ where: { is_active: true } }),

    // SQL aggregation — LEFT JOIN so products with NO inventory rows count as out-of-stock
    sequelize.query(`
      SELECT
        SUM(CASE WHEN COALESCE(i.qty_on_hand, 0) = 0 THEN 1 ELSE 0 END) AS out_of_stock,
        SUM(CASE WHEN COALESCE(i.qty_on_hand, 0) > 0 AND COALESCE(i.qty_on_hand, 0) <= p.reorder_point THEN 1 ELSE 0 END) AS low_stock
      FROM products p
      LEFT JOIN (
        SELECT product_id, SUM(qty_on_hand) AS qty_on_hand
        FROM inventory
        GROUP BY product_id
      ) AS i ON i.product_id = p.id
      WHERE p.is_active = 1
    `, { type: sequelize.QueryTypes.SELECT }),

    Receipt.count({ where: { status: { [Op.notIn]: ['done', 'cancelled'] } } }),
    Delivery.count({ where: { status: { [Op.notIn]: ['done', 'cancelled'] } } }),
    Transfer.count({ where: { status: 'draft' } }),

    StockMove.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name'] },
        { model: Location, as: 'fromLocation', attributes: ['id', 'name'] },
        { model: Location, as: 'toLocation', attributes: ['id', 'name'] },
        { model: User, as: 'user', attributes: ['id', 'name'] },
      ],
    }),
  ]);

  const { out_of_stock = 0, low_stock = 0 } = stockSummary[0] || {};

  return {
    totalProducts: products,
    lowStockCount: parseInt(low_stock) || 0,
    outOfStockCount: parseInt(out_of_stock) || 0,
    pendingReceipts: receipts,
    pendingDeliveries: deliveries,
    scheduledTransfers: transfers,
    recentMoves: recentMoves.map(m => ({
      product: m.product?.name,
      type: m.type,
      qty: parseFloat(m.qty),
      fromLocation: m.fromLocation?.name || null,
      toLocation: m.toLocation?.name || null,
      user: m.user?.name,
      createdAt: m.createdAt,
    })),
  };
};

module.exports = { get };