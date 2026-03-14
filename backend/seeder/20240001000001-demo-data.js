'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const daysAgo = (n) => new Date(Date.now() - n * 86400000);

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const passwordHash = await bcrypt.hash('stockify123', 12);

    const adminId = uuidv4(), managerId = uuidv4(), staffId = uuidv4(), dispatchId = uuidv4();

    await queryInterface.bulkInsert('users', [
      { id: adminId,    name: 'Admin User',        email: 'admin@stockify.com',      password_hash: passwordHash, role: 'admin',             is_active: true, otp: null, otp_expires_at: null, createdAt: now, updatedAt: now },
      { id: managerId,  name: 'Inventory Manager', email: 'manager@stockify.com',    password_hash: passwordHash, role: 'inventory_manager',  is_active: true, otp: null, otp_expires_at: null, createdAt: now, updatedAt: now },
      { id: staffId,    name: 'Warehouse Staff',   email: 'staff@stockify.com',      password_hash: passwordHash, role: 'warehouse_staff',    is_active: true, otp: null, otp_expires_at: null, createdAt: now, updatedAt: now },
      { id: dispatchId, name: 'Dispatcher',        email: 'dispatcher@stockify.com', password_hash: passwordHash, role: 'dispatcher',         is_active: true, otp: null, otp_expires_at: null, createdAt: now, updatedAt: now },
    ]);

    await queryInterface.bulkInsert('categories', [
      { name: 'Raw Materials',  description: 'Unprocessed input materials', createdAt: now, updatedAt: now },
      { name: 'Finished Goods', description: 'Ready-to-ship products',      createdAt: now, updatedAt: now },
    ]);

    const [cats] = await queryInterface.sequelize.query(`SELECT id, name FROM categories`);
    const rawMatId   = cats.find(c => c.name === 'Raw Materials').id;
    const finGoodsId = cats.find(c => c.name === 'Finished Goods').id;

    await queryInterface.bulkInsert('warehouses', [
      { name: 'Main Warehouse',      address: 'GIDC, Ahmedabad, Gujarat',        is_active: true, createdAt: now, updatedAt: now },
      { name: 'Production Facility', address: 'Phase 2, Gandhinagar, Gujarat',   is_active: true, createdAt: now, updatedAt: now },
    ]);

    const [whs] = await queryInterface.sequelize.query(`SELECT id, name FROM warehouses`);
    const mainWhId = whs.find(w => w.name === 'Main Warehouse').id;
    const prodWhId = whs.find(w => w.name === 'Production Facility').id;

    await queryInterface.bulkInsert('locations', [
      { warehouse_id: mainWhId, name: 'Main Store',       zone: 'Storage',          createdAt: now, updatedAt: now },
      { warehouse_id: mainWhId, name: 'Rack A',           zone: 'Rack A',           createdAt: now, updatedAt: now },
      { warehouse_id: prodWhId, name: 'Production Floor', zone: 'Production Floor', createdAt: now, updatedAt: now },
      { warehouse_id: prodWhId, name: 'Storage Room',     zone: 'Storage',          createdAt: now, updatedAt: now },
    ]);

    const [locs] = await queryInterface.sequelize.query(`SELECT id, name FROM locations`);
    const mainStoreId   = locs.find(l => l.name === 'Main Store').id;
    const rackAId       = locs.find(l => l.name === 'Rack A').id;
    const prodFloorId   = locs.find(l => l.name === 'Production Floor').id;
    const storageRoomId = locs.find(l => l.name === 'Storage Room').id;

    const p1 = uuidv4(), p2 = uuidv4(), p3 = uuidv4(), p4 = uuidv4(), p5 = uuidv4();
    const p6 = uuidv4(), p7 = uuidv4(), p8 = uuidv4(), p9 = uuidv4(), p10 = uuidv4();

    await queryInterface.bulkInsert('products', [
      { id: p1,  name: 'Steel Rods',          sku: 'RM-001', category_id: rawMatId,   unit_of_measure: 'kg',  reorder_point: 100, is_active: true, createdAt: now, updatedAt: now },
      { id: p2,  name: 'Aluminium Sheets',    sku: 'RM-002', category_id: rawMatId,   unit_of_measure: 'pcs', reorder_point: 50,  is_active: true, createdAt: now, updatedAt: now },
      { id: p3,  name: 'Copper Wire',         sku: 'RM-003', category_id: rawMatId,   unit_of_measure: 'kg',  reorder_point: 80,  is_active: true, createdAt: now, updatedAt: now },
      { id: p4,  name: 'Plastic Granules',    sku: 'RM-004', category_id: rawMatId,   unit_of_measure: 'kg',  reorder_point: 200, is_active: true, createdAt: now, updatedAt: now },
      { id: p5,  name: 'Rubber Gaskets',      sku: 'RM-005', category_id: rawMatId,   unit_of_measure: 'pcs', reorder_point: 500, is_active: true, createdAt: now, updatedAt: now },
      { id: p6,  name: 'Industrial Fan Unit', sku: 'FG-001', category_id: finGoodsId, unit_of_measure: 'pcs', reorder_point: 20,  is_active: true, createdAt: now, updatedAt: now },
      { id: p7,  name: 'Control Panel Board', sku: 'FG-002', category_id: finGoodsId, unit_of_measure: 'pcs', reorder_point: 15,  is_active: true, createdAt: now, updatedAt: now },
      { id: p8,  name: 'Hydraulic Pump',      sku: 'FG-003', category_id: finGoodsId, unit_of_measure: 'pcs', reorder_point: 10,  is_active: true, createdAt: now, updatedAt: now },
      { id: p9,  name: 'Conveyor Belt (5m)',  sku: 'FG-004', category_id: finGoodsId, unit_of_measure: 'pcs', reorder_point: 8,   is_active: true, createdAt: now, updatedAt: now },
      { id: p10, name: 'Electric Motor 5HP',  sku: 'FG-005', category_id: finGoodsId, unit_of_measure: 'pcs', reorder_point: 12,  is_active: true, createdAt: now, updatedAt: now },
    ]);

    // p3(20<80), p5(100<500), p9(5<8) are deliberately below reorder point
    await queryInterface.bulkInsert('inventory', [
      { product_id: p1,  location_id: mainStoreId,   qty_on_hand: 350 },
      { product_id: p1,  location_id: rackAId,        qty_on_hand: 150 },
      { product_id: p2,  location_id: mainStoreId,   qty_on_hand: 120 },
      { product_id: p3,  location_id: rackAId,        qty_on_hand: 20  },
      { product_id: p4,  location_id: storageRoomId,  qty_on_hand: 600 },
      { product_id: p5,  location_id: mainStoreId,   qty_on_hand: 100 },
      { product_id: p6,  location_id: prodFloorId,   qty_on_hand: 45  },
      { product_id: p7,  location_id: prodFloorId,   qty_on_hand: 30  },
      { product_id: p8,  location_id: storageRoomId,  qty_on_hand: 18  },
      { product_id: p9,  location_id: prodFloorId,   qty_on_hand: 5   },
      { product_id: p10, location_id: storageRoomId,  qty_on_hand: 22  },
    ]);

    const rec1Id = uuidv4(), rec2Id = uuidv4(), rec3Id = uuidv4();
    await queryInterface.bulkInsert('receipts', [
      { id: rec1Id, reference_no: 'REC-0001', supplier_name: 'Mehta Steel Pvt Ltd',   notes: 'Q1 steel order',        status: 'done',  created_by: staffId, validated_by: managerId, validated_at: daysAgo(5), createdAt: daysAgo(6), updatedAt: daysAgo(5) },
      { id: rec2Id, reference_no: 'REC-0002', supplier_name: 'Gujarat Plastics Co.',  notes: 'Monthly granule supply', status: 'done',  created_by: staffId, validated_by: managerId, validated_at: daysAgo(2), createdAt: daysAgo(3), updatedAt: daysAgo(2) },
      { id: rec3Id, reference_no: 'REC-0003', supplier_name: 'National Wire & Cable', notes: 'Copper wire restock',   status: 'draft', created_by: staffId, validated_by: null,      validated_at: null,      createdAt: daysAgo(1), updatedAt: daysAgo(1) },
    ]);

    await queryInterface.bulkInsert('receipt_lines', [
      { receipt_id: rec1Id, product_id: p1, location_id: mainStoreId,  qty_expected: 200, qty_received: 200 },
      { receipt_id: rec1Id, product_id: p2, location_id: mainStoreId,  qty_expected: 50,  qty_received: 50  },
      { receipt_id: rec2Id, product_id: p4, location_id: storageRoomId, qty_expected: 400, qty_received: 400 },
      { receipt_id: rec3Id, product_id: p3, location_id: rackAId,       qty_expected: 100, qty_received: null },
    ]);

    const del1Id = uuidv4(), del2Id = uuidv4();
    await queryInterface.bulkInsert('deliveries', [
      { id: del1Id, reference_no: 'DEL-0001', customer_name: 'Adani Power Ltd',    notes: 'Urgent order',     status: 'done',  created_by: dispatchId, validated_by: managerId, validated_at: daysAgo(4), createdAt: daysAgo(5), updatedAt: daysAgo(4) },
      { id: del2Id, reference_no: 'DEL-0002', customer_name: 'Torrent Pharma Ltd', notes: 'Monthly delivery', status: 'draft', created_by: dispatchId, validated_by: null,      validated_at: null,      createdAt: daysAgo(1), updatedAt: daysAgo(1) },
    ]);

    await queryInterface.bulkInsert('delivery_lines', [
      { delivery_id: del1Id, product_id: p6, location_id: prodFloorId,  qty: 10 },
      { delivery_id: del1Id, product_id: p7, location_id: prodFloorId,  qty: 5  },
      { delivery_id: del2Id, product_id: p8, location_id: storageRoomId, qty: 3  },
    ]);

    const trf1Id = uuidv4();
    await queryInterface.bulkInsert('transfers', [
      { id: trf1Id, reference_no: 'TRF-0001', from_location_id: mainStoreId, to_location_id: prodFloorId, notes: 'Move steel for production', status: 'draft', created_by: staffId, confirmed_by: null, createdAt: daysAgo(1), updatedAt: daysAgo(1) },
    ]);
    await queryInterface.bulkInsert('transfer_lines', [
      { transfer_id: trf1Id, product_id: p1, qty: 50 },
    ]);

    await queryInterface.bulkInsert('stock_moves', [
      { id: uuidv4(), product_id: p1, from_location_id: null, to_location_id: mainStoreId,  qty: 200, type: 'receipt',  reference_id: rec1Id, reference_type: 'receipt',  user_id: managerId, notes: 'REC-0001 validated', createdAt: daysAgo(5) },
      { id: uuidv4(), product_id: p2, from_location_id: null, to_location_id: mainStoreId,  qty: 50,  type: 'receipt',  reference_id: rec1Id, reference_type: 'receipt',  user_id: managerId, notes: 'REC-0001 validated', createdAt: daysAgo(5) },
      { id: uuidv4(), product_id: p4, from_location_id: null, to_location_id: storageRoomId, qty: 400, type: 'receipt', reference_id: rec2Id, reference_type: 'receipt',  user_id: managerId, notes: 'REC-0002 validated', createdAt: daysAgo(2) },
      { id: uuidv4(), product_id: p6, from_location_id: prodFloorId, to_location_id: null,  qty: 10,  type: 'delivery', reference_id: del1Id, reference_type: 'delivery', user_id: managerId, notes: 'DEL-0001 validated', createdAt: daysAgo(4) },
      { id: uuidv4(), product_id: p7, from_location_id: prodFloorId, to_location_id: null,  qty: 5,   type: 'delivery', reference_id: del1Id, reference_type: 'delivery', user_id: managerId, notes: 'DEL-0001 validated', createdAt: daysAgo(4) },
    ]);

    console.log('\n✅ Seed complete! Login: admin/manager/staff/dispatcher @stockify.com | password: stockify123\n');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('stock_moves',     null, {});
    await queryInterface.bulkDelete('transfer_lines',  null, {});
    await queryInterface.bulkDelete('transfers',       null, {});
    await queryInterface.bulkDelete('delivery_lines',  null, {});
    await queryInterface.bulkDelete('deliveries',      null, {});
    await queryInterface.bulkDelete('receipt_lines',   null, {});
    await queryInterface.bulkDelete('receipts',        null, {});
    await queryInterface.bulkDelete('inventory',       null, {});
    await queryInterface.bulkDelete('products',        null, {});
    await queryInterface.bulkDelete('locations',       null, {});
    await queryInterface.bulkDelete('warehouses',      null, {});
    await queryInterface.bulkDelete('categories',      null, {});
    await queryInterface.bulkDelete('users',           null, {});
  },
};