const { Product, Inventory, Receipt, Delivery, Transfer, StockMove, Location, User } = require('../models');
const { Op } = require('sequelize');

const get = async () => {
  const [products, inventory, receipts, deliveries, transfers, recentMoves] = await Promise.all([
    Product.count({ where: { is_active: true } }),
    Inventory.findAll({ include: [{ model: Product, as: 'product' }] }),
    Receipt.count({ where: { status: { [Op.notIn]: ['done','cancelled'] } } }),
    Delivery.count({ where: { status: { [Op.notIn]: ['done','cancelled'] } } }),
    Transfer.count({ where: { status: 'draft' } }),
    StockMove.findAll({
      limit: 10, order: [['createdAt', 'DESC']],
      include: [
        { model: Product,  as: 'product',      attributes: ['id','name'] },
        { model: Location, as: 'fromLocation', attributes: ['id','name'] },
        { model: Location, as: 'toLocation',   attributes: ['id','name'] },
        { model: User,     as: 'user',         attributes: ['id','name'] },
      ],
    }),
  ]);

  let lowStockCount = 0, outOfStockCount = 0;
  const seen = new Set();
  for (const inv of inventory) {
    if (seen.has(inv.product_id)) continue;
    seen.add(inv.product_id);
    const qty    = parseFloat(inv.qty_on_hand);
    const reorder = parseFloat(inv.product?.reorder_point || 0);
    if (qty === 0)          outOfStockCount++;
    else if (qty < reorder) lowStockCount++;
  }

  return {
    totalProducts:      products,
    lowStockCount,
    outOfStockCount,
    pendingReceipts:    receipts,
    pendingDeliveries:  deliveries,
    scheduledTransfers: transfers,
    recentMoves: recentMoves.map(m => ({
      product:      m.product?.name,
      type:         m.type,
      qty:          parseFloat(m.qty),
      fromLocation: m.fromLocation?.name || null,
      toLocation:   m.toLocation?.name   || null,
      user:         m.user?.name,
      createdAt:    m.createdAt,
    })),
  };
};

module.exports = { get };