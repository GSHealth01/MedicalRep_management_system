const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middlewares/auth');
const { prisma } = require('../../../lib/prisma');

// All routes require authentication
router.use(requireAuth);

// GET /api/v1/chemists - Get all chemists (accessible by all authenticated users)
router.get('/', async (req, res) => {
  try {
    const chemists = await prisma.chemist.findMany({
      include: {
        distributor: { select: { distributor_code: true, name: true } }
      },
      orderBy: { id: 'desc' }
    });
    
    res.json({
      success: true,
      chemists: chemists
    });
  } catch (error) {
    console.error('Error fetching chemists:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch chemists' });
  }
});

module.exports = router;
