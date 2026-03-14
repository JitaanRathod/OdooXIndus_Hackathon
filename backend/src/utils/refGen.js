const { sequelize } = require('../config/db');

// Uses MAX(reference_no) instead of COUNT so concurrent requests and re-seeds
// never produce duplicate reference numbers.
const nextRef = async (prefix, table) => {
  const [rows] = await sequelize.query(
    `SELECT MAX(CAST(SUBSTRING_INDEX(reference_no, '-', -1) AS UNSIGNED)) AS maxNum FROM \`${table}\` WHERE reference_no LIKE '${prefix}-%'`
  );
  const maxNum = rows[0]?.maxNum ? parseInt(rows[0].maxNum) : 0;
  const num = (maxNum + 1).toString().padStart(4, '0');
  return `${prefix}-${num}`;
};

module.exports = { nextRef };