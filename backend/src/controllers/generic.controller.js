const catchAsync = require('../utils/catchAsync');

const make = (service) => ({
  list:   catchAsync(async (req, res) => { const data = await service.list(req.query);              res.json({ success: true, data }); }),
  getOne: catchAsync(async (req, res) => { const data = await service.getOne(req.params.id);        res.json({ success: true, data }); }),
  create: catchAsync(async (req, res) => { const data = await service.create(req.body, req.user.id); res.status(201).json({ success: true, data }); }),
  update: catchAsync(async (req, res) => { const data = await service.update(req.params.id, req.body); res.json({ success: true, data }); }),
  remove: catchAsync(async (req, res) => { await service.remove(req.params.id);                    res.json({ success: true, data: null }); }),
  action: (action) => catchAsync(async (req, res) => {
    const data = await service[action](req.params.id, req.user.id);
    res.json({ success: true, data });
  }),
});

module.exports = { make };