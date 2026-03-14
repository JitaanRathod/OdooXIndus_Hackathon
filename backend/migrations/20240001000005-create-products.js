'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id:              { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name:            { type: Sequelize.STRING, allowNull: false },
      sku:             { type: Sequelize.STRING, allowNull: false, unique: true },
      category_id:     { type: Sequelize.INTEGER, allowNull: false, references: { model: 'categories', key: 'id' }, onDelete: 'RESTRICT' },
      unit_of_measure: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pcs' },
      reorder_point:   { type: Sequelize.DECIMAL(10,2), defaultValue: 0 },
      is_active:       { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt:       { type: Sequelize.DATE, allowNull: false },
      updatedAt:       { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('products', ['sku']);
  },
  async down(queryInterface) { await queryInterface.dropTable('products'); },
};