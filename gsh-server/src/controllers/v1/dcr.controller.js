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
      remarks,
      orderFormImages
    } = req.body;

    // Handle file uploads
    const otherBillImages = req.files?.otherBillImages || [];
    const orderFormImageFiles = req.files?.orderFormImages || [];

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
    const userId = req.user.id;

    const dcrs = await prisma.dcr.findMany({
      where: { user_id: userId },
      orderBy: { date: 'desc' },
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
        remarks: true,
        orderFormImages: true,
        createdAt: true
      }
    });

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
        id: parseInt(id),
        user_id: userId
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

module.exports = {
  createDCR,
  getUserDCRs,
  getDCRById,
  upload
};