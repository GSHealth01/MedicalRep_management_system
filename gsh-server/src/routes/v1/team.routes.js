const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middlewares/auth');
const ctrl = require('../../controllers/v1/team.controller');

// All routes require authentication
router.use(requireAuth);

// GET /api/v1/teams/formdata - Get form dropdown data
router.get('/formdata', ctrl.getFormData);

// POST /api/v1/teams - Create new team
router.post('/', ctrl.createTeam);

// GET /api/v1/teams - Get all teams
router.get('/', ctrl.getAllTeams);

// GET /api/v1/teams/:id - Get one team
router.get('/:id', ctrl.getOneTeam);

// PUT /api/v1/teams/:id - Update team
router.put('/:id', ctrl.updateTeam);

// DELETE /api/v1/teams/:id - Delete team
router.delete('/:id', ctrl.deleteTeam);

// POST /api/v1/teams/:teamId/assign-user - Assign user to team
router.post('/:teamId/assign-user', ctrl.assignUser);

// PATCH /api/v1/teams/:teamId/user/:userId/status - Update user status
router.patch('/:teamId/user/:userId/status', ctrl.updateUserStatus);

// PATCH /api/v1/teams/:teamId/user/:userId/role - Update user role
router.patch('/:teamId/user/:userId/role', ctrl.updateUserRole);

// DELETE /api/v1/teams/:teamId/user/:userId - Remove user from team
router.delete('/:teamId/user/:userId', ctrl.removeUserFromTeam);

module.exports = router;