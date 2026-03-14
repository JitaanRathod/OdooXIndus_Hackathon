const { Transfer, TransferLine, Product, Location, User, Inventory, StockMove } = require('../models');
const AppError = require('../utils/AppError');
const { nextRef } = require('../utils/refGen');

const list = () => Transfer.findAll({
  include: [
    { model: Location, as: 'fromLocation' },
    { model: Location, as: 'toLocation' },
    { model: User, as: 'creator', attributes: ['id','name'] },
  ],
  order: [['createdAt', 'DESC']],
});

const getOne = async (id) => {
  const t = await Transfer.findByPk(id, {
    include: [
      { model: TransferLine, as: 'lines', include: [{ model: Product, as: 'product' }] },
      { model: Location, as: 'fromLocation' },
      { model: Location, as: 'toLocation' },
      { model: User, as: 'creator', attributes: ['id','name'] },
    ],
  });
  if (!t) throw new AppError('Transfer not found', 404);
  return t;
};

const create = async (data, userId) => {
  const reference_no = await nextRef('TRF', 'transfers');
  const transfer = await Transfer.create({ ...data, reference_no, created_by: userId });
  if (data.lines?.length) {
    await TransferLine.bulkCreate(
      data.lines.map(l => ({ transfer_id: transfer.id, product_id: l.product_id, qty: l.qty }))
    );
  }
  return transfer;
};

const confirm = async (id, userId) => {
  const transfer = await getOne(id);
  if (transfer.status !== 'draft') throw new AppError('Transfer already processed', 400);

  for (const line of transfer.lines) {
    const qty = parseFloat(line.qty);
    const fromInv = await Inventory.findOne({
      where: { product_id: line.product_id, location_id: transfer.from_location_id },
    });
    if (!fromInv || parseFloat(fromInv.qty_on_hand) < qty) {
      throw new AppError(`Insufficient stock for ${line.product?.name}`, 400);
    }
    await fromInv.update({ qty_on_hand: parseFloat(fromInv.qty_on_hand) - qty });
    const [toInv] = await Inventory.findOrCreate({
      where: { product_id: line.product_id, location_id: transfer.to_location_id },
      defaults: { qty_on_hand: 0 },
    });
    await toInv.update({ qty_on_hand: parseFloat(toInv.qty_on_hand) + qty });
    await StockMove.create({
      product_id: line.product_id,
      from_location_id: transfer.from_location_id,
      to_location_id: transfer.to_location_id,
      qty, type: 'transfer',
      reference_id: transfer.id, reference_type: 'transfer',
      user_id: userId, notes: `Transfer ${transfer.reference_no} confirmed`,
    });
  }
  return transfer.update({ status: 'confirmed', confirmed_by: userId });
};

const cancel = async (id) => {
  const t = await getOne(id);
  if (['confirmed','cancelled'].includes(t.status)) throw new AppError('Cannot cancel', 400);
  return t.update({ status: 'cancelled' });
};

module.exports = { list, getOne, create, confirm, cancel };