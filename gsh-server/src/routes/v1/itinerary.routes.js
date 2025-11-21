const express = require('express');
const router = express.Router();
const {
  createItinerary,
  getItineraries,
  getItinerary,
  getItinerarySummary,
  updateItinerary,
  deleteItinerary,
  generatePDF,
  generateExcel
} = require('../../controllers/v1/itinerary.controller');
const { requireAuth } = require('../../middlewares/auth');

router.use(requireAuth);

router.post('/', createItinerary);
router.get('/', getItineraries);
router.get('/:id', getItinerary);
router.get('/:id/summary', getItinerarySummary);
router.put('/:id', updateItinerary);
router.delete('/:id', deleteItinerary);
router.get('/:id/pdf', generatePDF);
router.get('/:id/excel', generateExcel);

module.exports = router;