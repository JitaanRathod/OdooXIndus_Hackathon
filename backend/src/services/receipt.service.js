const { Receipt, ReceiptLine, Product, Location, User, Inventory, StockMove } = require('../models');
const AppError = require('../utils/AppError');
const { nextRef } = require('../utils/refGen');

const list = () => Receipt.findAll({
  include: [{ model: User, as: 'creator', attributes: ['id','name'] }],
  order: [['createdAt', 'DESC']],
});

const getOne = async (id) => {
  const r = await Receipt.findByPk(id, {
    include: [
      { model: ReceiptLine, as: 'lines', include: [{ model: Product, as: 'product' }, { model: Location, as: 'location' }] },
      { model: User, as: 'creator', attributes: ['id','name'] },
    ],
  });
  if (!r) throw new AppError('Receipt not found', 404);
  return r;
};

const create = async ({ supplier_name, notes, lines }, userId) => {
  const reference_no = await nextRef('REC', 'receipts');
  const receipt = await Receipt.create({ reference_no, supplier_name, notes, created_by: userId });
  if (lines?.length) {
    await ReceiptLine.bulkCreate(lines.map(l => ({
      receipt_id: receipt.id, product_id: l.product_id,
      location_id: l.location_id, qty_expected: l.qty,
    })));
  }
  return receipt;
};

// FIX #9 — was missing, caused "service.update is not a function" crash
const update = async (id, data) => {
  const receipt = await Receipt.findByPk(id);
  if (!receipt) throw new AppError('Receipt not found', 404);
  if (receipt.status === 'done') throw new AppError('Cannot edit a validated receipt', 400);
  if (receipt.status === 'cancelled') throw new AppError('Cannot edit a cancelled receipt', 400);
  const allowed = { supplier_name: data.supplier_name, notes: data.notes };
  return receipt.update(allowed);
};

const validate = async (id, userId) => {
  const receipt = await getOne(id);
  if (receipt.status === 'done')      throw new AppError('Already validated', 400);
  if (receipt.status === 'cancelled') throw new AppError('Receipt is cancelled', 400);

  for (const line of receipt.lines) {
    const qty = parseFloat(line.qty_expected);
    const [inv] = await Inventory.findOrCreate({
      where: { product_id: line.product_id, location_id: line.location_id },
      defaults: { qty_on_hand: 0 },
    });
    await inv.update({ qty_on_hand: parseFloat(inv.qty_on_hand) + qty });
    await line.update({ qty_received: qty });
    await StockMove.create({
      product_id: line.product_id, from_location_id: null,
      to_location_id: line.location_id, qty,
      type: 'receipt', reference_id: receipt.id, reference_type: 'receipt',
      user_id: userId, notes: `Receipt ${receipt.reference_no} validated`,
    });
  }
  return receipt.update({ status: 'done', validated_by: userId, validated_at: new Date() });
};

const cancel = async (id) => {
  const receipt = await getOne(id);
  if (['done','cancelled'].includes(receipt.status)) throw new AppError('Cannot cancel this receipt', 400);
  return receipt.update({ status: 'cancelled' });
};

module.exports = { list, getOne, create, update, validate, cancel };