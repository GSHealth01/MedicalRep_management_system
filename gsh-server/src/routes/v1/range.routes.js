const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middlewares/auth');
const ctrl = require('../../controllers/v1/range.controller');

// GET /api/v1/ranges - Get all ranges (public for forms)
router.get('/', ctrl.getAllRanges);

// All other routes require authentication
router.use(requireAuth);

// POST /api/v1/ranges - Create new range
router.post('/', ctrl.createRange);

// GET /api/v1/ranges/:id - Get one range
router.get('/:id', ctrl.getOneRange);

// PUT /api/v1/ranges/:id - Update range
router.put('/:id', ctrl.updateRange);

// DELETE /api/v1/ranges/:id - Delete range
router.delete('/:id', ctrl.deleteRange);

module.exports = router;