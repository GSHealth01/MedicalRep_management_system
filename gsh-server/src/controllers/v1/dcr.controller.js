const { prisma } = require('../../../lib/prisma');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/dcr/'); // Make sure this directory exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

async function createDCR(req, res) {
  try {
    const userId = req.user.id;
    const {
      date,
      range,
      agency,
      repName,
      empNo,
      distributor,
      area,
      town,
      callReport,
      dailyExpenses,
      otherBills,
      mileage,
      remarks,
      orderFormImages
    } = req.body;

    // Handle file uploads
    const otherBillImages = req.files?.otherBillImages || [];
    const orderFormImageFiles = req.files?.orderFormImages || [];
    const odometerReading = req.files?.odometerReading || [];
    const fuelBill = req.files?.fuelBill || [];

    const parsedCallReport = callReport ? JSON.parse(callReport) : null;

    // Extract joint user ids
    let jointUserIds = [];
    if (parsedCallReport) {
      const selectedManagers = new Set();
      parsedCallReport.forEach(doctor => {
        if (doctor.jointVisit && doctor.jointVisitManagers) {
          Object.entries(doctor.jointVisitManagers).forEach(([manager, selected]) => {
            if (selected) {
              selectedManagers.add(manager);
            }
          });
        }
      });

      if (selectedManagers.size > 0) {
        // Map manager strings to user ids
        const designationMap = {
          'Sales Executive': 'SE',
          'Territory Manager': 'TM',
          'Product Manager': 'PM',
          'Junior Executive': 'JE',
          'Field Coordinator': 'FC',
          'Area Sales Manager': 'ASM',
          'Regional Sales Manager': 'RSM',
          'National Sales Manager': 'NSM',
          'Operations Manager': 'OM',
          'Medical Representative': 'MR',
          'Administrator': 'ADMIN'
        };

        const managerQueries = Array.from(selectedManagers).map(managerStr => {
          const [name, fullDesignation] = managerStr.split(' - ');
          const designation = designationMap[fullDesignation];
          return { name, designation };
        });

        const users = await prisma.user.findMany({
          where: {
            OR: managerQueries.map(q => ({ name: q.name, designation: q.designation }))
          },
          select: { id: true, name: true, designation: true }
        });

        jointUserIds = users.map(u => u.id);
      }
    }

    // Create DCR record
    const newDCR = await prisma.dcr.create({
      data: {
        date,
        range,
        agency,
        repName,
        empNo,
        distributor,
        area,
        town,
        callReport: parsedCallReport,
        dailyExpenses: dailyExpenses ? JSON.parse(dailyExpenses) : null,
        otherBills: {
          details: otherBills ? JSON.parse(otherBills) : null,
          images: otherBillImages.map(file => file.filename)
        },
        mileage: mileage ? JSON.parse(mileage) : null,
        odometerReading: odometerReading.length > 0 ? odometerReading[0].filename : null,
        fuelBill: fuelBill.length > 0 ? fuelBill[0].filename : null,
        remarks,
        orderFormImages: orderFormImageFiles.map(file => file.filename),
        joint_user_ids: jointUserIds.length > 0 ? jointUserIds : null,
        user_id: userId
      }
    });

    res.status(201).json({
      message: 'DCR created successfully',
      dcr: newDCR
    });
  } catch (error) {
    console.error('Error creating DCR:', error);
    res.status(500).json({ message: 'Failed to create DCR' });
  }
}

async function getUserDCRs(req, res) {
  try {
    let userId = req.user.id;
    if (req.query.employeeId) {
      userId = parseInt(req.query.employeeId);
    }

    const allDcrs = await prisma.dcr.findMany({
      orderBy: { date: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            emp_no: true,
            team_id: true
          }
        }
      }
    });

    let dcrs;
    if (req.query.employeeId) {
      dcrs = allDcrs.filter(dcr => dcr.user.id == userId || (dcr.joint_user_ids && dcr.joint_user_ids.includes(userId)));
      console.log('Filtered DCRs for employeeId', userId, ':', dcrs.length);
    } else {
      // Show user's own DCRs and DCRs where user is in joint visits
      dcrs = allDcrs.filter(dcr => dcr.user.id == req.user.id || (dcr.joint_user_ids && dcr.joint_user_ids.includes(req.user.id)));
      console.log('Filtered DCRs for user', req.user.id, ':', dcrs.length);
    }
    console.log('All DCRs count:', allDcrs.length);
    if (allDcrs.length > 0) {
      console.log('Sample user_ids in DCRs:', allDcrs.slice(0, 5).map(d => d.user_id));
    }

    // Group by month
    const groupedDCRs = dcrs.reduce((acc, dcr) => {
      const date = new Date(dcr.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });

      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      acc[monthYear].push(dcr);
      return acc;
    }, {});

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json({ dcrs: groupedDCRs });
  } catch (error) {
    console.error('Error fetching DCRs:', error);
    res.status(500).json({ message: 'Failed to fetch DCRs' });
  }
}

async function getDCRById(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    console.log('Fetching DCR by ID:', id, 'for user:', userId);

    const dcr = await prisma.dcr.findFirst({
      where: {
        id: parseInt(id)
      },
      select: {
        id: true,
        date: true,
        range: true,
        agency: true,
        repName: true,
        empNo: true,
        distributor: true,
        area: true,
        town: true,
        callReport: true,
        dailyExpenses: true,
        otherBills: true,
        mileage: true,
        odometerReading: true,
        fuelBill: true,
        remarks: true,
        orderFormImages: true,
        createdAt: true,
        user_id: true,
        joint_user_ids: true
      }
    });

    console.log('DCR found:', dcr ? 'yes' : 'no', dcr ? `user_id: ${dcr.user_id}, joint: ${dcr.joint_user_ids}` : '');

    if (!dcr) {
      console.log('DCR not found');
      return res.status(404).json({ message: 'DCR not found' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, designation: true } });
    console.log('Current user designation:', currentUser?.designation, 'name:', currentUser?.name);

    const isOwner = dcr.user_id === userId;
    const isJoint = dcr.joint_user_ids && dcr.joint_user_ids.includes(userId);
    console.log('Is owner:', isOwner, 'Is joint:', isJoint);

    if (isOwner || isJoint || currentUser.designation === 'OM') {
      console.log('Access granted as owner, joint, or OM');
    } else {
      console.log('Access denied: not owner, joint, or OM');
      return res.status(404).json({ message: 'DCR not found' });
    }

    res.json({ dcr });
  } catch (error) {
    console.error('Error fetching DCR:', error);
    res.status(500).json({ message: 'Failed to fetch DCR' });
  }
}

async function updateDCR(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      date,
      range,
      agency,
      repName,
      empNo,
      distributor,
      area,
      town,
      callReport,
      dailyExpenses,
      otherBills,
      mileage,
      remarks,
      orderFormImages,
      existingOtherBillImages,
      existingOrderFormImages
    } = req.body;

    // Check if DCR exists and belongs to user or user is in joint visits
    const existingDCR = await prisma.dcr.findFirst({
      where: {
        id: parseInt(id)
      }
    });

    if (!existingDCR || (existingDCR.user_id !== userId && !(existingDCR.joint_user_ids && existingDCR.joint_user_ids.includes(userId)))) {
      return res.status(404).json({ message: 'DCR not found' });
    }

    // Handle file uploads
    const otherBillImages = req.files?.otherBillImages || [];
    const orderFormImageFiles = req.files?.orderFormImages || [];
    const odometerReading = req.files?.odometerReading || [];
    const fuelBill = req.files?.fuelBill || [];

    // Parse existing images
    const existingOtherBillImagesParsed = existingOtherBillImages ? JSON.parse(existingOtherBillImages) : [];
    const existingOrderFormImagesParsed = existingOrderFormImages ? JSON.parse(existingOrderFormImages) : [];

    const parsedCallReport = callReport ? JSON.parse(callReport) : existingDCR.callReport;

    // Extract joint user ids if callReport is updated
    let jointUserIds = existingDCR.joint_user_ids;
    if (callReport) {
      const selectedManagers = new Set();
      parsedCallReport.forEach(doctor => {
        if (doctor.jointVisit && doctor.jointVisitManagers) {
          Object.entries(doctor.jointVisitManagers).forEach(([manager, selected]) => {
            if (selected) {
              selectedManagers.add(manager);
            }
          });
        }
      });

      if (selectedManagers.size > 0) {
        // Map manager strings to user ids
        const designationMap = {
          'Senior Executive': 'SE',
          'Territory Manager': 'TM',
          'Product Manager': 'PM',
          'Junior Executive': 'JE',
          'Field Coordinator': 'FC',
          'Operations Manager': 'OM',
          'Medical Representative': 'MR',
          'Administrator': 'ADMIN'
        };

        const managerQueries = Array.from(selectedManagers).map(managerStr => {
          const [name, fullDesignation] = managerStr.split(' - ');
          const designation = designationMap[fullDesignation];
          return { name, designation };
        });

        const users = await prisma.user.findMany({
          where: {
            OR: managerQueries.map(q => ({ name: q.name, designation: q.designation }))
          },
          select: { id: true, name: true, designation: true }
        });

        jointUserIds = users.map(u => u.id);
      } else {
        jointUserIds = null;
      }
    }

    // Update DCR record
    const updatedDCR = await prisma.dcr.update({
      where: { id: parseInt(id) },
      data: {
        date,
        range,
        agency,
        repName,
        empNo,
        distributor,
        area,
        town,
        callReport: parsedCallReport,
        dailyExpenses: dailyExpenses ? JSON.parse(dailyExpenses) : existingDCR.dailyExpenses,
        otherBills: otherBills ? {
          details: JSON.parse(otherBills),
          images: [...existingOtherBillImagesParsed, ...otherBillImages.map(file => file.filename)]
        } : existingDCR.otherBills,
        mileage: mileage ? JSON.parse(mileage) : existingDCR.mileage,
        odometerReading: odometerReading.length > 0 ? odometerReading[0].filename : existingDCR.odometerReading,
        fuelBill: fuelBill.length > 0 ? fuelBill[0].filename : existingDCR.fuelBill,
        remarks,
        orderFormImages: [...existingOrderFormImagesParsed, ...orderFormImageFiles.map(file => file.filename)],
        joint_user_ids: jointUserIds
      }
    });

    res.status(200).json({
      message: 'DCR updated successfully',
      dcr: updatedDCR
    });
  } catch (error) {
    console.error('Error updating DCR:', error);
    res.status(500).json({ message: 'Failed to update DCR' });
  }
}

async function deleteDCR(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if DCR exists and belongs to user
    const existingDCR = await prisma.dcr.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId
      }
    });

    if (!existingDCR) {
      return res.status(404).json({ message: 'DCR not found' });
    }

    // Delete DCR record
    await prisma.dcr.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({ message: 'DCR deleted successfully' });
  } catch (error) {
    console.error('Error deleting DCR:', error);
    res.status(500).json({ message: 'Failed to delete DCR' });
  }
}

module.exports = {
  createDCR,
  getUserDCRs,
  getDCRById,
  updateDCR,
  deleteDCR,
  upload
};