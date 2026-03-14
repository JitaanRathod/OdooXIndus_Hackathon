const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');

// POST /api/v1/auth/register
const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  return res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: result,
  });
});

// POST /api/v1/auth/login
const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  return res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: result,
  });
});

// GET /api/v1/auth/me  (protected)
const getMe = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return res.status(200).json({
    success: true,
    data: { user },
  });
});

// POST /api/v1/auth/forgot-password
const forgotPassword = catchAsync(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

// POST /api/v1/auth/reset-password
const resetPassword = catchAsync(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

module.exports = { register, login, getMe, forgotPassword, resetPassword };