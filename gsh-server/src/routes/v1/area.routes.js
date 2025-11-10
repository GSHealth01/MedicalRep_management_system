const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middlewares/auth');
const ctrl = require('../../controllers/v1/area.controller');

// GET /api/v1/areas - Get all areas (public for forms)
router.get('/', ctrl.getAllAreas);

// All other routes require authentication
router.use(requireAuth);

// POST /api/v1/areas - Create new area
router.post('/', ctrl.createArea);

// GET /api/v1/areas - Get all areas
router.get('/', ctrl.getAllAreas);

// GET /api/v1/areas/:id - Get one area
router.get('/:id', ctrl.getOneArea);

// PUT /api/v1/areas/:id - Update area
router.put('/:id', ctrl.updateArea);

// DELETE /api/v1/areas/:id - Delete area
router.delete('/:id', ctrl.deleteArea);

module.exports = router;