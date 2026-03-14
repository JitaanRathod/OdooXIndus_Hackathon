'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('receipts', {
      id:            { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      reference_no:  { type: Sequelize.STRING, allowNull: false, unique: true },
      supplier_name: { type: Sequelize.STRING, allowNull: false },
      notes:         { type: Sequelize.TEXT, allowNull: true },
      status:        { type: Sequelize.ENUM('draft','waiting','ready','done','cancelled'), defaultValue: 'draft' },
      created_by:    { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      validated_by:  { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      validated_at:  { type: Sequelize.DATE, allowNull: true },
      createdAt:     { type: Sequelize.DATE, allowNull: false },
      updatedAt:     { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('receipts', ['status']);
    await queryInterface.addIndex('receipts', ['created_by']);
  },
  async down(queryInterface) { await queryInterface.dropTable('receipts'); },
};