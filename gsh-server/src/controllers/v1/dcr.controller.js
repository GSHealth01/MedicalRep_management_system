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
        callReport: callReport ? JSON.parse(callReport) : null,
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
      dcrs = allDcrs.filter(dcr => dcr.user.id == userId);
      console.log('Filtered DCRs for employeeId', userId, ':', dcrs.length);
    } else {
      // Always show only user's own data in main dashboard
      dcrs = allDcrs.filter(dcr => dcr.user.id == req.user.id);
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
        createdAt: true
      }
    });

    if (!dcr) {
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

    // Handle file uploads
    const otherBillImages = req.files?.otherBillImages || [];
    const orderFormImageFiles = req.files?.orderFormImages || [];
    const odometerReading = req.files?.odometerReading || [];
    const fuelBill = req.files?.fuelBill || [];

    // Parse existing images
    const existingOtherBillImagesParsed = existingOtherBillImages ? JSON.parse(existingOtherBillImages) : [];
    const existingOrderFormImagesParsed = existingOrderFormImages ? JSON.parse(existingOrderFormImages) : [];

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
        callReport: callReport ? JSON.parse(callReport) : existingDCR.callReport,
        dailyExpenses: dailyExpenses ? JSON.parse(dailyExpenses) : existingDCR.dailyExpenses,
        otherBills: otherBills ? {
          details: JSON.parse(otherBills),
          images: [...existingOtherBillImagesParsed, ...otherBillImages.map(file => file.filename)]
        } : existingDCR.otherBills,
        mileage: mileage ? JSON.parse(mileage) : existingDCR.mileage,
        odometerReading: odometerReading.length > 0 ? odometerReading[0].filename : existingDCR.odometerReading,
        fuelBill: fuelBill.length > 0 ? fuelBill[0].filename : existingDCR.fuelBill,
        remarks,
        orderFormImages: [...existingOrderFormImagesParsed, ...orderFormImageFiles.map(file => file.filename)]
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