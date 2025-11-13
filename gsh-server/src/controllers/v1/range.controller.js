const { prisma } = require('../../../lib/prisma');

async function createRange(req, res) {
  try {
    const { name, agency_id } = req.body;

    if (!name || !agency_id) {
      return res.status(400).json({ message: 'Name and agency_id are required' });
    }

    // Check if agency exists, if not create it
    let agency = await prisma.agency.findUnique({
      where: { name: agency_id }
    });

    if (!agency) {
      agency = await prisma.agency.create({
        data: { name: agency_id }
      });
    }

    const newRange = await prisma.range.create({
      data: {
        name,
        agency_id: agency.id
      },
      include: {
        agency: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({
      message: 'Range created successfully',
      range: newRange
    });
  } catch (error) {
    console.error('Error creating range:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Range name already exists' });
    }

    res.status(500).json({ message: 'Failed to create range' });
  }
}

async function getAllRanges(req, res) {
  try {
    const ranges = await prisma.range.findMany({
      include: {
        agency: { select: { id: true, name: true } },
        _count: {
          select: { users: true, teams: true }
        }
      },
      orderBy: { id: 'desc' }
    });

    res.json({ ranges });
  } catch (error) {
    console.error('Error fetching ranges:', error);
    res.status(500).json({ message: 'Failed to fetch ranges' });
  }
}

async function getOneRange(req, res) {
  try {
    const { id } = req.params;
    const range = await prisma.range.findUnique({
      where: { id: parseInt(id) },
      include: {
        agency: { select: { id: true, name: true } },
        users: {
          select: {
            id: true,
            name: true,
            emp_no: true,
            designation: true
          }
        },
        teams: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!range) {
      return res.status(404).json({ message: 'Range not found' });
    }

    res.json({ range });
  } catch (error) {
    console.error('Error fetching range:', error);
    res.status(500).json({ message: 'Failed to fetch range' });
  }
}

async function updateRange(req, res) {
  try {
    const { id } = req.params;
    const { name, agency_id } = req.body;

    const updatedRange = await prisma.range.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(agency_id && { agency_id: parseInt(agency_id) })
      },
      include: {
        agency: { select: { id: true, name: true } }
      }
    });

    res.json({
      message: 'Range updated successfully',
      range: updatedRange
    });
  } catch (error) {
    console.error('Error updating range:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Range name already exists' });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid agency_id' });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Range not found' });
    }

    res.status(500).json({ message: 'Failed to update range' });
  }
}

async function deleteRange(req, res) {
  try {
    const { id } = req.params;

    await prisma.range.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Range deleted successfully' });
  } catch (error) {
    console.error('Error deleting range:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Range not found' });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Cannot delete range with existing relationships' });
    }

    res.status(500).json({ message: 'Failed to delete range' });
  }
}

module.exports = {
  createRange,
  getAllRanges,
  getOneRange,
  updateRange,
  deleteRange
};