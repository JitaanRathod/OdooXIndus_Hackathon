const { sequelize } = require('../config/db');

// Allowed prefixes — prevents SQL injection via allowlist
const ALLOWED_PREFIXES = ['REC', 'DEL', 'TRF', 'ADJ'];
const ALLOWED_TABLES   = ['receipts', 'deliveries', 'transfers', 'adjustments'];

/**
 * Generates the next sequential reference number in a concurrency-safe way.
 * Uses a transaction with FOR UPDATE to prevent duplicate refs under concurrent requests.
 */
const nextRef = async (prefix, table) => {
  if (!ALLOWED_PREFIXES.includes(prefix)) throw new Error(`Invalid prefix: ${prefix}`);
  if (!ALLOWED_TABLES.includes(table))     throw new Error(`Invalid table: ${table}`);

  return sequelize.transaction(async (t) => {
    // Lock the table row to prevent concurrent reads of the same MAX
    const [rows] = await sequelize.query(
      `SELECT MAX(CAST(SUBSTRING_INDEX(reference_no, '-', -1) AS UNSIGNED)) AS maxNum
       FROM \`${table}\`
       WHERE reference_no LIKE :pattern
       FOR UPDATE`,
      {
        replacements: { pattern: `${prefix}-%` },
        transaction: t,
      }
    );
    const maxNum = rows[0]?.maxNum ? parseInt(rows[0].maxNum, 10) : 0;
    const num    = (maxNum + 1).toString().padStart(4, '0');
    return `${prefix}-${num}`;
  });
};

module.exports = { nextRef };