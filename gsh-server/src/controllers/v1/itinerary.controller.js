const { prisma } = require('../../../lib/prisma');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const AppError = require('../../utils/AppError');
// const pdf = require('html-pdf'); // Commented out for now
const ExcelJS = require('exceljs');

// Create Itinerary
const createItinerary = asyncHandler(async (req, res) => {
  const { repName, distributor, month, itinerary } = req.body;
  const userId = req.user.id;

  // Create itinerary with entries
  const newItinerary = await prisma.itinerary.create({
    data: {
      repName,
      distributor,
      month,
      user_id: userId,
      entries: {
        create: itinerary.map(entry => ({
          date: entry.date,
          dayNo: entry.dayNo,
          area: entry.area || null,
          doctorCalls: entry.doctorCalls || 0,
          chemistCalls: entry.chemistCalls || 0,
          mileage: entry.mileage || 0,
          nightOutArea: entry.nightOutArea || null
        }))
      }
    },
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

  res.status(201).json(new ApiResponse(201, newItinerary, 'Itinerary created successfully'));
});

// Get All Itineraries for User
const getItineraries = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const itineraries = await prisma.itinerary.findMany({
    where: { user_id: userId },
    include: {
      entries: true,
      user: {
        select: {
          name: true,
          emp_no: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json(new ApiResponse(200, itineraries, 'Itineraries fetched successfully'));
});

// Get Single Itinerary
const getItinerary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const itinerary = await prisma.itinerary.findFirst({
    where: {
      id: parseInt(id),
      user_id: userId
    },
    include: {
      entries: {
        orderBy: { dayNo: 'asc' }
      },
      user: {
        select: {
          name: true,
          emp_no: true,
          email: true
        }
      }
    }
  });

  if (!itinerary) {
    throw new AppError(404, 'Itinerary not found');
  }

  res.status(200).json(new ApiResponse(200, itinerary, 'Itinerary fetched successfully'));
});

// Update Itinerary
const updateItinerary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { repName, distributor, month, itinerary } = req.body;
  const userId = req.user.id;

  // Check if itinerary exists and belongs to user
  const existingItinerary = await prisma.itinerary.findFirst({
    where: {
      id: parseInt(id),
      user_id: userId
    }
  });

  if (!existingItinerary) {
    throw new AppError(404, 'Itinerary not found');
  }

  // Delete existing entries and create new ones
  await prisma.itineraryEntry.deleteMany({
    where: { itinerary_id: parseInt(id) }
  });

  const updatedItinerary = await prisma.itinerary.update({
    where: { id: parseInt(id) },
    data: {
      repName,
      distributor,
      month,
      entries: {
        create: itinerary.map(entry => ({
          date: entry.date,
          dayNo: entry.dayNo,
          area: entry.area || null,
          doctorCalls: entry.doctorCalls || 0,
          chemistCalls: entry.chemistCalls || 0,
          mileage: entry.mileage || 0,
          nightOutArea: entry.nightOutArea || null
        }))
      }
    },
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

  res.status(200).json(new ApiResponse(200, updatedItinerary, 'Itinerary updated successfully'));
});

// Delete Itinerary
const deleteItinerary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const itinerary = await prisma.itinerary.findFirst({
    where: {
      id: parseInt(id),
      user_id: userId
    }
  });

  if (!itinerary) {
    throw new AppError(404, 'Itinerary not found');
  }

  await prisma.itinerary.delete({
    where: { id: parseInt(id) }
  });

  res.status(200).json(new ApiResponse(200, null, 'Itinerary deleted successfully'));
});

// Generate PDF - Commented out for now
// const generatePDF = asyncHandler(async (req, res) => {
//   // PDF generation logic will be added later
//   res.status(501).json(new ApiResponse(501, null, 'PDF generation not implemented yet'));
// });

// Generate Excel
const generateExcel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const itinerary = await prisma.itinerary.findFirst({
    where: {
      id: parseInt(id),
      user_id: userId
    },
    include: {
      entries: {
        orderBy: { dayNo: 'asc' }
      },
      user: {
        select: {
          name: true,
          emp_no: true,
          email: true
        }
      }
    }
  });

  if (!itinerary) {
    throw new AppError(404, 'Itinerary not found');
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Itinerary');

  // Add header information
  worksheet.addRow(['Monthly Itinerary Planner']);
  worksheet.addRow(['']);
  worksheet.addRow(['Rep Name:', itinerary.repName]);
  worksheet.addRow(['Employee No:', itinerary.user.emp_no]);
  worksheet.addRow(['Distributor:', itinerary.distributor]);
  worksheet.addRow(['Month:', itinerary.month]);
  worksheet.addRow(['Generated On:', new Date().toLocaleDateString()]);
  worksheet.addRow(['']);

  // Add table headers
  worksheet.addRow(['Date', 'Day No', 'Area', 'Doctor Calls', 'Chemist Calls', 'Mileage (km)', 'Night Out Area']);

  // Style headers
  const headerRow = worksheet.getRow(8);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };

  // Add data rows
  itinerary.entries.forEach(entry => {
    worksheet.addRow([
      entry.date,
      entry.dayNo,
      entry.area || '',
      entry.doctorCalls || 0,
      entry.chemistCalls || 0,
      entry.mileage || 0,
      entry.nightOutArea || ''
    ]);
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = 15;
  });

  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=itinerary-${itinerary.month}-${itinerary.user.emp_no}.xlsx`);

  // Write to response
  await workbook.xlsx.write(res);
  res.end();
});

// Helper function to generate HTML for PDF
function generateItineraryHTML(itinerary) {
  const monthName = new Date(itinerary.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Itinerary - ${monthName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .info { margin-bottom: 20px; }
        .info table { width: 100%; border-collapse: collapse; }
        .info td { padding: 5px; border: 1px solid #ddd; }
        .info td:first-child { font-weight: bold; background-color: #f5f5f5; width: 150px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Monthly Itinerary Planner</h1>
        <h2>${monthName}</h2>
      </div>

      <div class="info">
        <table>
          <tr><td>Rep Name:</td><td>${itinerary.repName}</td></tr>
          <tr><td>Employee No:</td><td>${itinerary.user.emp_no}</td></tr>
          <tr><td>Distributor:</td><td>${itinerary.distributor}</td></tr>
          <tr><td>Status:</td><td>${itinerary.status}</td></tr>
          <tr><td>Generated On:</td><td>${new Date().toLocaleDateString()}</td></tr>
        </table>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Day No</th>
            <th>Area</th>
            <th>Doctor Calls</th>
            <th>Chemist Calls</th>
            <th>Mileage (km)</th>
            <th>Night Out Area</th>
          </tr>
        </thead>
        <tbody>
          ${itinerary.entries.map(entry => `
            <tr>
              <td>${entry.date}</td>
              <td>${entry.dayNo}</td>
              <td>${entry.area || ''}</td>
              <td>${entry.doctorCalls || 0}</td>
              <td>${entry.chemistCalls || 0}</td>
              <td>${entry.mileage || 0}</td>
              <td>${entry.nightOutArea || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This itinerary was generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  createItinerary,
  getItineraries,
  getItinerary,
  updateItinerary,
  deleteItinerary,
  // generatePDF, // Commented out for now
  generateExcel
};