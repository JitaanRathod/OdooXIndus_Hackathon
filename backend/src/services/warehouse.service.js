const { Warehouse, Location } = require('../models');
const AppError = require('../utils/AppError');

const list   = () => Warehouse.findAll({ include: [{ model: Location, as: 'locations' }], order: [['name', 'ASC']] });
const getOne = async (id) => { const w = await Warehouse.findByPk(id, { include: [{ model: Location, as: 'locations' }] }); if (!w) throw new AppError('Not found', 404); return w; };
const create = (data) => Warehouse.create(data);
const update = async (id, data) => { const w = await getOne(id); return w.update(data); };
const remove = async (id) => { const w = await getOne(id); await w.destroy(); };

module.exports = { list, getOne, create, update, remove };