const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middlewares/auth');
const ctrl = require('../../controllers/v1/doctor.controller');

// All routes require authentication
router.use(requireAuth);

// POST /api/v1/doctors - Create new doctor
router.post('/', ctrl.createDoctor);

// GET /api/v1/doctors - Get all doctors
router.get('/', ctrl.getAllDoctors);

// GET /api/v1/doctors/:id - Get one doctor
router.get('/:id', ctrl.getOneDoctor);

// PUT /api/v1/doctors/:id - Update doctor
router.put('/:id', ctrl.updateDoctor);

// DELETE /api/v1/doctors/:id - Delete doctor
router.delete('/:id', ctrl.deleteDoctor);

module.exports = router;