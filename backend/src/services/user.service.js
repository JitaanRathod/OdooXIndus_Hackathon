const { User } = require('../models');
const AppError = require('../utils/AppError');

const list   = () => User.findAll({ order: [['name', 'ASC']] });
const update = async (id, data) => { const u = await User.findByPk(id); if (!u) throw new AppError('Not found', 404); return u.update(data); };
const remove = async (id) => { const u = await User.findByPk(id); if (!u) throw new AppError('Not found', 404); await u.destroy(); };

module.exports = { list, update, remove };