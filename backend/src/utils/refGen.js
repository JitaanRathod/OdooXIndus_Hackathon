const { sequelize } = require('../config/db');

const nextRef = async (prefix, table) => {
  const [rows] = await sequelize.query(`SELECT COUNT(*) as cnt FROM \`${table}\``);
  const num = (parseInt(rows[0].cnt) + 1).toString().padStart(4, '0');
  return `${prefix}-${num}`;
};

module.exports = { nextRef };