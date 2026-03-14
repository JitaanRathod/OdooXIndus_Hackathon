const { Location, Warehouse } = require('../models');
const AppError = require('../utils/AppError');

const list   = () => Location.findAll({ include: [{ model: Warehouse, as: 'warehouse' }], order: [['name', 'ASC']] });
const getOne = async (id) => { const l = await Location.findByPk(id); if (!l) throw new AppError('Not found', 404); return l; };
const create = (data) => Location.create(data);
const update = async (id, data) => { const l = await getOne(id); return l.update(data); };
const remove = async (id) => { const l = await getOne(id); await l.destroy(); };

module.exports = { list, getOne, create, update, remove };