const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middlewares/auth');
const ctrl = require('../../controllers/v1/user.controller');

// All routes require authentication
router.use(requireAuth);

// GET /api/v1/users/formdata - Get form data for dropdowns
router.get('/formdata', ctrl.getFormData);

// POST /api/v1/users - Create new user
router.post('/', ctrl.createUser);

// GET /api/v1/users - Get all users
router.get('/', ctrl.getAllUsers);

module.exports = router;