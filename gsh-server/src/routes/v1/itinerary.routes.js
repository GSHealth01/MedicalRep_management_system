const express = require('express');
const router = express.Router();
const {
  createItinerary,
  getItineraries,
  getItinerary,
  updateItinerary,
  deleteItinerary,
  // generatePDF, // Commented out for now
  generateExcel
} = require('../../controllers/v1/itinerary.controller');
const { requireAuth } = require('../../middlewares/auth');

// All itinerary routes require authentication
router.use(requireAuth);

// CRUD routes
router.post('/', createItinerary);
router.get('/', getItineraries);
router.get('/:id', getItinerary);
router.put('/:id', updateItinerary);
router.delete('/:id', deleteItinerary);

// Download routes
// router.get('/:id/pdf', generatePDF); // Commented out for now
router.get('/:id/excel', generateExcel);

module.exports = router;