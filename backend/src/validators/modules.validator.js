const { z } = require('zod');

// ── Products ──────────────────────────────────────────────────────────────────
const productSchema = z.object({
  name:            z.string().min(1, 'Name is required').max(200),
  sku:             z.string().min(1, 'SKU is required').max(50),
  category_id:     z.coerce.number().int().positive('Category is required'),
  unit_of_measure: z.string().min(1, 'Unit of measure is required').max(20),
  reorder_point:   z.coerce.number().min(0).default(0),
  is_active:       z.boolean().optional().default(true),
});

const productUpdateSchema = productSchema.partial();

// ── Categories ────────────────────────────────────────────────────────────────
const categorySchema = z.object({
  name:        z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
});

// ── Warehouses ────────────────────────────────────────────────────────────────
const warehouseSchema = z.object({
  name:      z.string().min(1, 'Name is required').max(100),
  address:   z.string().optional(),
  is_active: z.boolean().optional().default(true),
});

// ── Locations ─────────────────────────────────────────────────────────────────
const locationSchema = z.object({
  warehouse_id: z.coerce.number().int().positive('Warehouse is required'),
  name:         z.string().min(1, 'Name is required').max(100),
  zone:         z.string().optional(),
});

// ── Receipt ───────────────────────────────────────────────────────────────────
const receiptLineSchema = z.object({
  product_id:  z.string().uuid('Invalid product'),
  location_id: z.coerce.number().int().positive('Location is required'),
  qty:         z.coerce.number().positive('Quantity must be greater than 0'),
});

const receiptSchema = z.object({
  supplier_name: z.string().min(1, 'Supplier name is required').max(200),
  notes:         z.string().optional(),
  lines:         z.array(receiptLineSchema).min(1, 'At least one product line is required'),
});

// ── Delivery ──────────────────────────────────────────────────────────────────
const deliveryLineSchema = z.object({
  product_id:  z.string().uuid('Invalid product'),
  location_id: z.coerce.number().int().positive('Location is required'),
  qty:         z.coerce.number().positive('Quantity must be greater than 0'),
});

const deliverySchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required').max(200),
  notes:         z.string().optional(),
  lines:         z.array(deliveryLineSchema).min(1, 'At least one product line is required'),
});

// ── Transfer ──────────────────────────────────────────────────────────────────
const transferLineSchema = z.object({
  product_id: z.string().uuid('Invalid product'),
  qty:        z.coerce.number().positive('Quantity must be greater than 0'),
});

const transferSchema = z.object({
  from_location_id: z.coerce.number().int().positive('From location is required'),
  to_location_id:   z.coerce.number().int().positive('To location is required'),
  notes:            z.string().optional(),
  lines:            z.array(transferLineSchema).min(1, 'At least one product line is required'),
}).refine(
  (data) => data.from_location_id !== data.to_location_id,
  { message: 'Source and destination locations must be different', path: ['to_location_id'] }
);

// ── Adjustment ────────────────────────────────────────────────────────────────
const adjustmentLineSchema = z.object({
  product_id:  z.string().uuid('Invalid product'),
  qty_counted: z.coerce.number().min(0, 'Counted quantity cannot be negative'),
});

const adjustmentSchema = z.object({
  location_id: z.coerce.number().int().positive('Location is required'),
  reason:      z.string().optional(),
  lines:       z.array(adjustmentLineSchema).min(1, 'At least one product line is required'),
});

module.exports = {
  productSchema, productUpdateSchema,
  categorySchema,
  warehouseSchema,
  locationSchema,
  receiptSchema,
  deliverySchema,
  transferSchema,
  adjustmentSchema,
};