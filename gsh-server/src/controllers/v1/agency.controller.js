const { prisma } = require('../../../lib/prisma');

async function createAgency(req, res) {
  try {
    const { name, range = 'A' } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newSector = await prisma.sector.create({
      data: { agency: name, range }
    });

    res.status(201).json({
      message: 'Agency created successfully',
      agency: { id: newSector.id, name: newSector.agency }
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
    const sectors = await prisma.sector.findMany({
      select: {
        id: true,
        agency: true,
        _count: {
          select: { users: true, distributors: true }
        }
      },
      orderBy: { agency: 'asc' }
    });

    const agencies = sectors.map(s => ({
      id: s.id,
      name: s.agency,
      _count: s._count
    }));

    res.json({ agencies });
  } catch (error) {
    console.error('Error fetching agencies:', error);
    res.status(500).json({ message: 'Failed to fetch agencies' });
  }
}

async function getOneAgency(req, res) {
  try {
    const { id } = req.params;
    const sector = await prisma.sector.findUnique({
      where: { id: parseInt(id) },
      include: {
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
            distributor_code: true,
            name: true
          }
        }
      }
    });

    if (!sector) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    const agency = {
      id: sector.id,
      name: sector.agency,
      users: sector.users,
      distributors: sector.distributors
    };

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

    const updatedSector = await prisma.sector.update({
      where: { id: parseInt(id) },
      data: { agency: name }
    });

    res.json({
      message: 'Agency updated successfully',
      agency: { id: updatedSector.id, name: updatedSector.agency }
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

    await prisma.sector.delete({
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