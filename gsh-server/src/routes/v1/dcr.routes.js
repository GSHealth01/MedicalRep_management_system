const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middlewares/auth');
const ctrl = require('../../controllers/v1/dcr.controller');

// All routes require authentication
router.use(requireAuth);

// POST /api/v1/dcrs - Create new DCR
router.post('/', ctrl.upload.fields([
  { name: 'otherBillImages', maxCount: 10 },
  { name: 'orderFormImages', maxCount: 10 },
  { name: 'odometerReading', maxCount: 1 },
  { name: 'fuelBill', maxCount: 1 }
]), ctrl.createDCR);

// GET /api/v1/dcrs - Get user's DCRs grouped by month
router.get('/', ctrl.getUserDCRs);

// GET /api/v1/dcrs/:id - Get specific DCR by ID
router.get('/:id', ctrl.getDCRById);

// PUT /api/v1/dcrs/:id - Update specific DCR by ID
router.put('/:id', ctrl.upload.fields([
  { name: 'otherBillImages', maxCount: 10 },
  { name: 'orderFormImages', maxCount: 10 },
  { name: 'odometerReading', maxCount: 1 },
  { name: 'fuelBill', maxCount: 1 }
]), ctrl.updateDCR);

// DELETE /api/v1/dcrs/:id - Delete specific DCR by ID
router.delete('/:id', ctrl.deleteDCR);

module.exports = router;