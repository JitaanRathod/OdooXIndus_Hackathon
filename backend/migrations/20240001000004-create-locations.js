'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('locations', {
      id:           { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      warehouse_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'warehouses', key: 'id' }, onDelete: 'RESTRICT' },
      name:         { type: Sequelize.STRING, allowNull: false },
      zone:         { type: Sequelize.STRING, allowNull: true },
      createdAt:    { type: Sequelize.DATE, allowNull: false },
      updatedAt:    { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('locations'); },
};