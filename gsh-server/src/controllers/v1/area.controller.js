const { prisma } = require('../../../lib/prisma');

async function createArea(req, res) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newArea = await prisma.area.create({
      data: { name }
    });

    res.status(201).json({
      message: 'Area created successfully',
      area: newArea
    });
  } catch (error) {
    console.error('Error creating area:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Area name already exists' });
    }

    res.status(500).json({ message: 'Failed to create area' });
  }
}

async function getAllAreas(req, res) {
  try {
    const areas = await prisma.area.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ areas });
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ message: 'Failed to fetch areas' });
  }
}

async function getOneArea(req, res) {
  try {
    const { id } = req.params;
    const area = await prisma.area.findUnique({
      where: { id: parseInt(id) },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            emp_no: true,
            designation: true
          }
        }
      }
    });

    if (!area) {
      return res.status(404).json({ message: 'Area not found' });
    }

    res.json({ area });
  } catch (error) {
    console.error('Error fetching area:', error);
    res.status(500).json({ message: 'Failed to fetch area' });
  }
}

async function updateArea(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedArea = await prisma.area.update({
      where: { id: parseInt(id) },
      data: { name }
    });

    res.json({
      message: 'Area updated successfully',
      area: updatedArea
    });
  } catch (error) {
    console.error('Error updating area:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Area name already exists' });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Area not found' });
    }

    res.status(500).json({ message: 'Failed to update area' });
  }
}

async function deleteArea(req, res) {
  try {
    const { id } = req.params;

    await prisma.area.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Area deleted successfully' });
  } catch (error) {
    console.error('Error deleting area:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Area not found' });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Cannot delete area with existing relationships' });
    }

    res.status(500).json({ message: 'Failed to delete area' });
  }
}

module.exports = {
  createArea,
  getAllAreas,
  getOneArea,
  updateArea,
  deleteArea
};