const { Delivery, DeliveryLine, Product, Location, User, Inventory, StockMove, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const { nextRef } = require('../utils/refGen');

const list = async (query = {}) => {
  const limit = parseInt(query.limit) || 50;
  const offset = parseInt(query.offset) || 0;
  return Delivery.findAll({
    include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
};

const getOne = async (id) => {
  const d = await Delivery.findByPk(id, {
    include: [
      {
        model: DeliveryLine,
        as: 'lines',
        include: [
          { model: Product, as: 'product' },
          { model: Location, as: 'location' },
        ],
      },
      { model: User, as: 'creator', attributes: ['id', 'name'] },
      { model: User, as: 'validator', attributes: ['id', 'name'] },
    ],
  });
  if (!d) throw new AppError('Delivery not found', 404);
  return d;
};

const create = async ({ customer_name, notes, lines }, userId) => {
  const reference_no = await nextRef('DEL', 'deliveries',null);
  const delivery = await Delivery.create({ reference_no, customer_name, notes, created_by: userId });
  if (lines?.length) {
    await DeliveryLine.bulkCreate(lines.map(l => ({
      delivery_id: delivery.id,
      product_id: l.product_id,
      location_id: l.location_id,
      qty: l.qty,
    })));
  }
  return delivery;
};

const pick = async (id) => {
  const d = await getOne(id);
  if (d.status !== 'draft') throw new AppError('Invalid status for pick', 400);
  return d.update({ status: 'picking' });
};

const pack = async (id) => {
  const d = await getOne(id);
  if (d.status !== 'picking') throw new AppError('Invalid status for pack', 400);
  return d.update({ status: 'packing' });
};

const validate = async (id, userId) => {
  const delivery = await getOne(id);
  if (delivery.status !== 'packing') throw new AppError('Delivery must be in packing status', 400);

  // Wrap all inventory mutations in an atomic transaction
  await sequelize.transaction(async (t) => {
    for (const line of delivery.lines) {
      const qty = parseFloat(line.qty);
      const inv = await Inventory.findOne({
        where: { product_id: line.product_id, location_id: line.location_id },
        transaction: t,
        lock: t.LOCK.UPDATE,  // prevent concurrent over-selling
      });
      if (!inv || parseFloat(inv.qty_on_hand) < qty) {
        throw new AppError(
          `Insufficient stock for product: ${line.product?.name || line.product_id}`,
          400
        );
      }
      await inv.update({ qty_on_hand: parseFloat(inv.qty_on_hand) - qty }, { transaction: t });
      await StockMove.create({
        product_id: line.product_id,
        from_location_id: line.location_id,
        to_location_id: null,
        qty,
        type: 'delivery',
        reference_id: delivery.id,
        reference_type: 'delivery',
        user_id: userId,
        notes: `Delivery ${delivery.reference_no} validated`,
      }, { transaction: t });
    }
    await delivery.update(
      { status: 'done', validated_by: userId, validated_at: new Date() },
      { transaction: t }
    );
  });

  return getOne(id);
};

const cancel = async (id) => {
  const d = await getOne(id);
  if (['done', 'cancelled'].includes(d.status)) throw new AppError('Cannot cancel', 400);
  return d.update({ status: 'cancelled' });
};

module.exports = { list, getOne, create, pick, pack, validate, cancel };