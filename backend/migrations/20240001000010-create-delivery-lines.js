'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('delivery_lines', {
      id:          { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      delivery_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'deliveries', key: 'id' }, onDelete: 'CASCADE' },
      product_id:  { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'RESTRICT' },
      location_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'locations', key: 'id' }, onDelete: 'RESTRICT' },
      qty:         { type: Sequelize.DECIMAL(10,2), allowNull: false },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('delivery_lines'); },
};