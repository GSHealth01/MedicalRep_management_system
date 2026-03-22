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

// GET /api/v1/users/profile - Get current user's complete profile
router.get('/profile', ctrl.getCurrentUserProfile);

// GET /api/v1/users/employees - Get employees for OM
router.get('/employees', ctrl.getEmployees);

// GET /api/v1/users/team-subordinates - Get team members below the logged-in user in the hierarchy
router.get('/team-subordinates', ctrl.getTeamSubordinates);

module.exports = router;