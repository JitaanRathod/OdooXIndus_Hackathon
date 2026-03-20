const { sequelize } = require('../config/db');

const ALLOWED_PREFIXES = ['REC', 'DEL', 'TRF', 'ADJ'];
const ALLOWED_TABLES   = ['receipts', 'deliveries', 'transfers', 'adjustments'];

const nextRef = async (prefix, table, transaction = null) => {
  if (!ALLOWED_PREFIXES.includes(prefix)) throw new Error(`Invalid prefix: ${prefix}`);
  if (!ALLOWED_TABLES.includes(table))     throw new Error(`Invalid table: ${table}`);

  const run = async (t) => {
    const [rows] = await sequelize.query(
      `SELECT MAX(CAST(SPLIT_PART(reference_no, '-', 2) AS INTEGER)) AS "maxNum"
      FROM "${table}"
      WHERE reference_no LIKE :pattern`,
      {
        replacements: { pattern: `${prefix}-%` },
        transaction: t,
      }
    );
    const maxNum = rows[0]?.maxNum ? parseInt(rows[0].maxNum, 10) : 0;
    const num    = (maxNum + 1).toString().padStart(4, '0');
    return `${prefix}-${num}`;
  };

  // If a transaction is passed in, reuse it — otherwise create one
  if (transaction) return run(transaction);
  return sequelize.transaction(run);
};

module.exports = { nextRef };