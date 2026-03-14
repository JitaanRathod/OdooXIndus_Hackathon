const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(
    ['admin', 'inventory_manager', 'warehouse_staff', 'dispatcher'],
    { errorMap: () => ({ message: 'Invalid role' }) }
  ).optional().default('warehouse_staff'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };