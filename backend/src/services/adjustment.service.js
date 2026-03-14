const { Adjustment, AdjustmentLine, Product, Location, User, Inventory, StockMove } = require('../models');
const AppError = require('../utils/AppError');
const { nextRef } = require('../utils/refGen');

const list = () => Adjustment.findAll({
  include: [
    { model: Location, as: 'location' },
    { model: User, as: 'creator', attributes: ['id','name'] },
  ],
  order: [['createdAt', 'DESC']],
});

const getOne = async (id) => {
  const a = await Adjustment.findByPk(id, {
    include: [
      { model: AdjustmentLine, as: 'lines', include: [{ model: Product, as: 'product' }] },
      { model: Location, as: 'location' },
      { model: User, as: 'creator', attributes: ['id','name'] },
    ],
  });
  if (!a) throw new AppError('Adjustment not found', 404);
  return a;
};

const create = async ({ location_id, reason, lines }, userId) => {
  const reference_no = await nextRef('ADJ', 'adjustments');
  const adj = await Adjustment.create({ reference_no, location_id, reason, created_by: userId });
  if (lines?.length) {
    for (const line of lines) {
      const inv = await Inventory.findOne({ where: { product_id: line.product_id, location_id } });
      const qty_expected  = inv ? parseFloat(inv.qty_on_hand) : 0;
      const qty_counted   = parseFloat(line.qty_counted);
      const qty_difference = qty_counted - qty_expected;
      await AdjustmentLine.create({
        adjustment_id: adj.id, product_id: line.product_id,
        qty_expected, qty_counted, qty_difference,
      });
    }
  }
  return adj;
};

const apply = async (id, userId) => {
  const adj = await getOne(id);
  if (adj.status !== 'draft') throw new AppError('Already processed', 400);

  for (const line of adj.lines) {
    const [inv] = await Inventory.findOrCreate({
      where: { product_id: line.product_id, location_id: adj.location_id },
      defaults: { qty_on_hand: 0 },
    });
    const delta = parseFloat(line.qty_difference);
    await inv.update({ qty_on_hand: parseFloat(line.qty_counted) });
    await StockMove.create({
      product_id: line.product_id,
      from_location_id: delta < 0 ? adj.location_id : null,
      to_location_id:   delta >= 0 ? adj.location_id : null,
      qty: Math.abs(delta),
      type: 'adjustment', reference_id: adj.id, reference_type: 'adjustment',
      user_id: userId, notes: `Adjustment ${adj.reference_no}: ${adj.reason || ''}`,
    });
  }
  return adj.update({ status: 'applied' });
};

module.exports = { list, getOne, create, apply };