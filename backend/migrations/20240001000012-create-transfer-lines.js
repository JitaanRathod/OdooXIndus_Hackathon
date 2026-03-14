'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transfer_lines', {
      id:          { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      transfer_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'transfers', key: 'id' }, onDelete: 'CASCADE' },
      product_id:  { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'RESTRICT' },
      qty:         { type: Sequelize.DECIMAL(10,2), allowNull: false },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('transfer_lines'); },
};