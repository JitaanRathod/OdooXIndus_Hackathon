'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory', {
      id:          { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      product_id:  { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'RESTRICT' },
      location_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'locations', key: 'id' }, onDelete: 'RESTRICT' },
      qty_on_hand: { type: Sequelize.DECIMAL(10,2), defaultValue: 0 },
    });
    await queryInterface.addIndex('inventory', ['product_id', 'location_id'], { unique: true });
    await queryInterface.addIndex('inventory', ['product_id']);
    await queryInterface.addIndex('inventory', ['location_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('inventory'); },
};