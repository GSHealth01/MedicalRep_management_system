const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middlewares/auth');
const ctrl = require('../../controllers/v1/dcr.controller');

// All routes require authentication
router.use(requireAuth);

// POST /api/v1/dcrs - Create new DCR
router.post('/', ctrl.upload.fields([
  { name: 'otherBillImages', maxCount: 10 },
  { name: 'orderFormImages', maxCount: 10 }
]), ctrl.createDCR);

// GET /api/v1/dcrs - Get user's DCRs grouped by month
router.get('/', ctrl.getUserDCRs);

// GET /api/v1/dcrs/:id - Get specific DCR by ID
router.get('/:id', ctrl.getDCRById);

module.exports = router;