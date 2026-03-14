const catchAsync    = require('../utils/catchAsync');
const dashService   = require('../services/dashboard.service');

const get = catchAsync(async (req, res) => {
  const data = await dashService.get();
  res.json({ success: true, data });
});

module.exports = { get };