const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { signToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const { OTP_EXPIRES_MINUTES } = require('../config/env');

// ─── Register ────────────────────────────────────────────────────────────────
const register = async ({ name, email, password, role }) => {
  // Check if email already exists
  const existing = await User.scope('withPassword').findOne({ where: { email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const password_hash = await bcrypt.hash(password, 12);

  const user = await User.create({ name, email, password_hash, role });

  const token = signToken({ id: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

// ─── Login ───────────────────────────────────────────────────────────────────
const login = async ({ email, password }) => {
  // Need password_hash so use withPassword scope
  const user = await User.scope('withPassword').findOne({ where: { email } });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.is_active) {
    throw new AppError('Your account has been deactivated. Contact admin.', 403);
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordCorrect) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({ id: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

// ─── Get current user (me) ────────────────────────────────────────────────────
const getMe = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
};

// ─── Forgot password (generate OTP) ─────────────────────────────────────────
const forgotPassword = async ({ email }) => {
  const user = await User.scope('withPassword').findOne({ where: { email } });

  // Always return success even if email not found (security best practice)
  if (!user) {
    return { message: 'If that email exists, an OTP has been sent.' };
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otp_expires_at = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

  await user.update({ otp, otp_expires_at });

  // In production, send via email. For hackathon, we log to console.
  console.log(`\n🔑 OTP for ${email}: ${otp} (expires in ${OTP_EXPIRES_MINUTES} mins)\n`);

  return { message: `OTP sent. Check console (dev mode). Valid for ${OTP_EXPIRES_MINUTES} minutes.` };
};

// ─── Reset password (verify OTP + set new password) ─────────────────────────
const resetPassword = async ({ email, otp, new_password }) => {
  const user = await User.scope('withPassword').findOne({ where: { email } });

  if (!user) throw new AppError('Invalid email or OTP', 400);

  if (!user.otp || user.otp !== otp) {
    throw new AppError('Invalid OTP', 400);
  }

  if (!user.otp_expires_at || new Date() > user.otp_expires_at) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  const password_hash = await bcrypt.hash(new_password, 12);

  // Clear OTP after successful reset
  await user.update({ password_hash, otp: null, otp_expires_at: null });

  return { message: 'Password reset successfully. Please login.' };
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };