const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middlewares/auth');
const ctrl = require('../../controllers/v1/agency.controller');

// All routes require authentication
router.use(requireAuth);

// POST /api/v1/agencies - Create new agency
router.post('/', ctrl.createAgency);

// GET /api/v1/agencies - Get all agencies
router.get('/', ctrl.getAllAgencies);

// GET /api/v1/agencies/:id - Get one agency
router.get('/:id', ctrl.getOneAgency);

// PUT /api/v1/agencies/:id - Update agency
router.put('/:id', ctrl.updateAgency);

// DELETE /api/v1/agencies/:id - Delete agency
router.delete('/:id', ctrl.deleteAgency);

module.exports = router;