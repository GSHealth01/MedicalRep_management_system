const { prisma } = require('../../../lib/prisma');

async function createAgency(req, res) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newAgency = await prisma.agency.create({
      data: { name }
    });

    res.status(201).json({
      message: 'Agency created successfully',
      agency: newAgency
    });
  } catch (error) {
    console.error('Error creating agency:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Agency name already exists' });
    }

    res.status(500).json({ message: 'Failed to create agency' });
  }
}

async function getAllAgencies(req, res) {
  try {
    const agencies = await prisma.agency.findMany({
      include: {
        _count: {
          select: { ranges: true, users: true, distributors: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ agencies });
  } catch (error) {
    console.error('Error fetching agencies:', error);
    res.status(500).json({ message: 'Failed to fetch agencies' });
  }
}

async function getOneAgency(req, res) {
  try {
    const { id } = req.params;
    const agency = await prisma.agency.findUnique({
      where: { id: parseInt(id) },
      include: {
        ranges: {
          select: {
            id: true,
            name: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            emp_no: true,
            designation: true
          }
        },
        distributors: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    res.json({ agency });
  } catch (error) {
    console.error('Error fetching agency:', error);
    res.status(500).json({ message: 'Failed to fetch agency' });
  }
}

async function updateAgency(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedAgency = await prisma.agency.update({
      where: { id: parseInt(id) },
      data: { name }
    });

    res.json({
      message: 'Agency updated successfully',
      agency: updatedAgency
    });
  } catch (error) {
    console.error('Error updating agency:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Agency name already exists' });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Agency not found' });
    }

    res.status(500).json({ message: 'Failed to update agency' });
  }
}

async function deleteAgency(req, res) {
  try {
    const { id } = req.params;

    await prisma.agency.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Agency deleted successfully' });
  } catch (error) {
    console.error('Error deleting agency:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Agency not found' });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Cannot delete agency with existing relationships' });
    }

    res.status(500).json({ message: 'Failed to delete agency' });
  }
}

module.exports = {
  createAgency,
  getAllAgencies,
  getOneAgency,
  updateAgency,
  deleteAgency
};