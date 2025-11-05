const { prisma } = require('../../../lib/prisma');

async function createDoctor(req, res) {
  try {
    const { name, specialty, range_id } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const doctorData = {
      name,
      specialty: specialty || null
    };

    if (range_id) {
      doctorData.range_id = parseInt(range_id);
    }

    const newDoctor = await prisma.doctor.create({
      data: doctorData,
      include: {
        range: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            users: true,
            prescriptions: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Doctor created successfully',
      doctor: newDoctor
    });
  } catch (error) {
    console.error('Error creating doctor:', error);

    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid range_id provided' });
    }

    res.status(500).json({ message: 'Failed to create doctor' });
  }
}

async function getAllDoctors(req, res) {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        range: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            users: true,
            prescriptions: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Failed to fetch doctors' });
  }
}

async function getOneDoctor(req, res) {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(id) },
      include: {
        range: {
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
        prescriptions: {
          select: {
            product: {
              select: {
                id: true,
                name: true,
                generic_name: true
              }
            }
          }
        }
      }
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json({ doctor });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ message: 'Failed to fetch doctor' });
  }
}

async function updateDoctor(req, res) {
  try {
    const { id } = req.params;
    const { name, specialty, range_id } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updateData = {
      name,
      specialty: specialty || null
    };

    if (range_id !== undefined) {
      updateData.range_id = range_id ? parseInt(range_id) : null;
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        range: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            users: true,
            prescriptions: true
          }
        }
      }
    });

    res.json({
      message: 'Doctor updated successfully',
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error('Error updating doctor:', error);

    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Invalid range_id provided' });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(500).json({ message: 'Failed to update doctor' });
  }
}

async function deleteDoctor(req, res) {
  try {
    const { id } = req.params;

    await prisma.doctor.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Cannot delete doctor with existing relationships' });
    }

    res.status(500).json({ message: 'Failed to delete doctor' });
  }
}

module.exports = {
  createDoctor,
  getAllDoctors,
  getOneDoctor,
  updateDoctor,
  deleteDoctor
};