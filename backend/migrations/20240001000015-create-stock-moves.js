'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_moves', {
      id:               { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      product_id:       { type: Sequelize.UUID, allowNull: false, references: { model: 'products', key: 'id' }, onDelete: 'RESTRICT' },
      from_location_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'locations', key: 'id' }, onDelete: 'RESTRICT' },
      to_location_id:   { type: Sequelize.INTEGER, allowNull: true, references: { model: 'locations', key: 'id' }, onDelete: 'RESTRICT' },
      qty:              { type: Sequelize.DECIMAL(10,2), allowNull: false },
      type:             { type: Sequelize.ENUM('receipt','delivery','transfer','adjustment'), allowNull: false },
      reference_id:     { type: Sequelize.UUID, allowNull: true },
      reference_type:   { type: Sequelize.STRING, allowNull: true },
      user_id:          { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      notes:            { type: Sequelize.TEXT, allowNull: true },
      createdAt:        { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('stock_moves', ['product_id']);
    await queryInterface.addIndex('stock_moves', ['type']);
    await queryInterface.addIndex('stock_moves', ['createdAt']);
    await queryInterface.addIndex('stock_moves', ['user_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('stock_moves'); },
};