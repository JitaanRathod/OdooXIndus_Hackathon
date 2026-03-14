'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('adjustments', {
      id:           { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      reference_no: { type: Sequelize.STRING, allowNull: false, unique: true },
      location_id:  { type: Sequelize.INTEGER, allowNull: false, references: { model: 'locations', key: 'id' }, onDelete: 'RESTRICT' },
      reason:       { type: Sequelize.TEXT, allowNull: true },
      status:       { type: Sequelize.ENUM('draft','applied','cancelled'), defaultValue: 'draft' },
      created_by:   { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      createdAt:    { type: Sequelize.DATE, allowNull: false },
      updatedAt:    { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('adjustments'); },
};