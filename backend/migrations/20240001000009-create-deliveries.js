'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('deliveries', {
      id:            { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      reference_no:  { type: Sequelize.STRING, allowNull: false, unique: true },
      customer_name: { type: Sequelize.STRING, allowNull: false },
      notes:         { type: Sequelize.TEXT, allowNull: true },
      status:        { type: Sequelize.ENUM('draft','picking','packing','done','cancelled'), defaultValue: 'draft' },
      created_by:    { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      validated_by:  { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT' },
      validated_at:  { type: Sequelize.DATE, allowNull: true },
      createdAt:     { type: Sequelize.DATE, allowNull: false },
      updatedAt:     { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('deliveries', ['status']);
  },
  async down(queryInterface) { await queryInterface.dropTable('deliveries'); },
};