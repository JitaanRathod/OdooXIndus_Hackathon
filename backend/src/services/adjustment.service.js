const { Adjustment, AdjustmentLine, Product, Location, User, Inventory, StockMove, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const { nextRef } = require('../utils/refGen');

const list = async (query = {}) => {
  const limit = parseInt(query.limit) || 50;
  const offset = parseInt(query.offset) || 0;
  return Adjustment.findAll({
    include: [
      { model: Location, as: 'location' },
      { model: User, as: 'creator', attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
};

const getOne = async (id) => {
  const a = await Adjustment.findByPk(id, {
    include: [
      { model: AdjustmentLine, as: 'lines', include: [{ model: Product, as: 'product' }] },
      { model: Location, as: 'location' },
      { model: User, as: 'creator', attributes: ['id', 'name'] },
    ],
  });
  if (!a) throw new AppError('Adjustment not found', 404);
  return a;
};

const create = async ({ location_id, reason, lines }, userId) => {
  const reference_no = await nextRef('ADJ', 'adjustments',null);
  const adj = await Adjustment.create({ reference_no, location_id, reason, created_by: userId });
  if (lines?.length) {
    for (const line of lines) {
      const inv = await Inventory.findOne({ where: { product_id: line.product_id, location_id } });
      const qty_expected = inv ? parseFloat(inv.qty_on_hand) : 0;
      const qty_counted = parseFloat(line.qty_counted);
      const qty_difference = qty_counted - qty_expected;
      await AdjustmentLine.create({
        adjustment_id: adj.id, product_id: line.product_id,
        qty_expected, qty_counted, qty_difference,
      });
    }
  }
  return adj;
};

const update = async (id, data) => {
  const adj = await Adjustment.findByPk(id);
  if (!adj) throw new AppError('Adjustment not found', 404);
  if (adj.status !== 'draft') throw new AppError('Cannot edit a processed adjustment', 400);
  return adj.update({ reason: data.reason });
};

const apply = async (id, userId) => {
  const adj = await getOne(id);
  if (adj.status !== 'draft') throw new AppError('Already processed', 400);

  await sequelize.transaction(async (t) => {
    for (const line of adj.lines) {
      const delta = parseFloat(line.qty_difference);

      const [inv] = await Inventory.findOrCreate({
        where: { product_id: line.product_id, location_id: adj.location_id },
        defaults: { qty_on_hand: 0 },
        transaction: t,
      });
      await inv.update({ qty_on_hand: parseFloat(line.qty_counted) }, { transaction: t });

      // Only log a StockMove when there's an actual quantity change
      if (Math.abs(delta) > 0) {
        await StockMove.create({
          product_id: line.product_id,
          from_location_id: delta < 0 ? adj.location_id : null,
          to_location_id: delta >= 0 ? adj.location_id : null,
          qty: Math.abs(delta),
          type: 'adjustment',
          reference_id: adj.id,
          reference_type: 'adjustment',
          user_id: userId,
          notes: `Adjustment ${adj.reference_no}: ${adj.reason || ''}`,
        }, { transaction: t });
      }
    }
    await adj.update({ status: 'applied' }, { transaction: t });
  });

  return getOne(id);
};

module.exports = { list, getOne, create, update, apply };