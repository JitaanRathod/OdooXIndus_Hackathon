const { Category } = require('../models');
const AppError = require('../utils/AppError');

const list   = () => Category.findAll({ order: [['name', 'ASC']] });
const getOne = async (id) => { const c = await Category.findByPk(id); if (!c) throw new AppError('Not found', 404); return c; };
const create = (data) => Category.create(data);
const update = async (id, data) => { const c = await getOne(id); return c.update(data); };
const remove = async (id) => { const c = await getOne(id); await c.destroy(); };

module.exports = { list, getOne, create, update, remove };