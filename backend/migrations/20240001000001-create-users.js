'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id:             { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name:           { type: Sequelize.STRING, allowNull: false },
      email:          { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash:  { type: Sequelize.STRING, allowNull: false },
      role:           { type: Sequelize.ENUM('admin','inventory_manager','warehouse_staff','dispatcher'), allowNull: false, defaultValue: 'warehouse_staff' },
      otp:            { type: Sequelize.STRING(6), allowNull: true },
      otp_expires_at: { type: Sequelize.DATE, allowNull: true },
      is_active:      { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt:      { type: Sequelize.DATE, allowNull: false },
      updatedAt:      { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('users'); },
};