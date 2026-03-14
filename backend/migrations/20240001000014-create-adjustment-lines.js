'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('adjustment_lines', {
      id:             { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      adjustment_id:  { type: Sequelize.UUID, allowNull: false, references: { model: 'adjustments', key: 'id' }, onDelete: 'CASCADE' },
      product_id:     { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'RESTRICT' },
      qty_expected:   { type: Sequelize.DECIMAL(10,2), allowNull: false },
      qty_counted:    { type: Sequelize.DECIMAL(10,2), allowNull: false },
      qty_difference: { type: Sequelize.DECIMAL(10,2), allowNull: false },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('adjustment_lines'); },
};