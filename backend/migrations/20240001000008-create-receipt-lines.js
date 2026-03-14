'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('receipt_lines', {
      id:           { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      receipt_id:   { type: Sequelize.UUID, allowNull: false, references: { model: 'receipts', key: 'id' }, onDelete: 'CASCADE' },
      product_id:   { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'RESTRICT' },
      location_id:  { type: Sequelize.INTEGER, allowNull: false, references: { model: 'locations', key: 'id' }, onDelete: 'RESTRICT' },
      qty_expected: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      qty_received: { type: Sequelize.DECIMAL(10,2), allowNull: true },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('receipt_lines'); },
};