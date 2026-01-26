const express = require('express');
const { prisma } = require('../../../lib/prisma');

const router = express.Router();

// Debug endpoint to check database state
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        designation: true,
        emp_no: true,
        sector_id: true,
        team_id: true
      }
    });
    res.json({ users, count: users.length });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/itineraries', async (req, res) => {
  try {
    const itineraries = await prisma.itinerary.findMany({
      include: {
        entries: true,
        user: {
          select: {
            name: true,
            emp_no: true,
            email: true
          }
        }
      }
    });
    res.json({ itineraries, count: itineraries.length });
  } catch (error) {
    console.error('Error fetching itineraries:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;