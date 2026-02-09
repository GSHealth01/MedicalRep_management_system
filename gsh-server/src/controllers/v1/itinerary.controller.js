const { prisma } = require('../../../lib/prisma');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const AppError = require('../../utils/AppError');
// const pdf = require('html-pdf'); // Commented out for now
const ExcelJS = require('exceljs');

// Create Itinerary
const createItinerary = asyncHandler(async (req, res) => {
  const { repName, distributor, town, month, itinerary, status } = req.body;
  const userId = req.user.id;
  console.log('Creating itinerary for userId:', userId, 'name:', req.user.name, 'designation:', req.user.designation);
  
  // Validate required fields
  if (!repName || !distributor || !month || !itinerary || !Array.isArray(itinerary)) {
    throw new AppError(400, 'Missing required fields: repName, distributor, month, and itinerary are required');
  }

  // Check if itinerary already exists for this user and month
  const existingItinerary = await prisma.itinerary.findFirst({
    where: {
      user_id: userId,
      month: month
    }
  });

  if (existingItinerary) {
    throw new AppError(409, 'An itinerary already exists for this month. Please edit the existing itinerary or delete it first.');
  }

  // Validate itinerary entries
  if (!itinerary || !Array.isArray(itinerary) || itinerary.length === 0) {
    throw new AppError(400, 'Itinerary entries are required and must be a non-empty array');
  }
  
  // Validate each entry
  const validEntries = itinerary.filter(entry =>
    entry.date && entry.area && entry.town &&
    entry.doctorCalls !== undefined && entry.chemistCalls !== undefined && entry.mileage !== undefined
  );
  
  if (validEntries.length === 0) {
    throw new AppError(400, 'At least one valid itinerary entry is required with date, area, town, doctorCalls, chemistCalls, and mileage');
  }
  
  // Create itinerary with entries
  const newItinerary = await prisma.itinerary.create({
    data: {
      repName,
      distributor,
      town,
      month,
      status: status || "pending",
      user_id: userId,
      entries: {
        create: itinerary.map(entry => ({
          date: entry.date,
          dayNo: parseInt(entry.dayNo) || 0,
          area: entry.area || null,
          town: entry.town || null,
          doctorCalls: parseInt(entry.doctorCalls) || 0,
          chemistCalls: parseInt(entry.chemistCalls) || 0,
          mileage: parseFloat(entry.mileage) || 0,
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
  let userId = req.user.id;
  console.log('Original userId:', userId, 'designation:', req.user.designation);
  if (req.query.employeeId) {
    userId = parseInt(req.query.employeeId);
    console.log('Switched to employeeId:', userId);
  }

  // Temporary fix: if OM and no employeeId, show all itineraries
  if (!req.query.employeeId && req.user.designation === 'OM') {
    console.log('OM viewing all itineraries');
  }

  console.log('Fetching itineraries for userId:', userId);

  const allItineraries = await prisma.itinerary.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          emp_no: true
        }
      }
    }
  });
  console.log('All itineraries in DB count:', allItineraries.length);

  const allItinerariesWithUser = await prisma.itinerary.findMany({
    include: {
      entries: true,
      user: {
        select: {
          id: true,
          name: true,
          emp_no: true,
          team_id: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10 // limit to 10
  });

  console.log('All itineraries with user count:', allItinerariesWithUser.length);

  let itineraries;
  if (req.query.employeeId) {
    userId = parseInt(req.query.employeeId);
    itineraries = allItinerariesWithUser.filter(it => parseInt(it.user_id) === userId);
  } else {
    // Always show only user's own data in main dashboard
    itineraries = allItinerariesWithUser.filter(it => parseInt(it.user_id) === req.user.id);
  }

  console.log('Filtered itineraries for userId', req.user.id, 'count:', itineraries.length);
  if (itineraries.length > 0) {
    console.log('Itinerary ids:', itineraries.map(it => it.id));
  }
  if (itineraries.length === 0 && allItinerariesWithUser.length > 0) {
    console.log('Sample user_ids in db:', allItinerariesWithUser.slice(0, 5).map(it => it.user_id));
  }

  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.status(200).json(new ApiResponse(200, itineraries, 'Itineraries fetched successfully'));
});

// Get Single Itinerary
const getItinerary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log('Getting itinerary id:', id);
  let userId = req.user.id;
  if (req.query.employeeId) {
    userId = parseInt(req.query.employeeId);
    console.log('Switched to employeeId:', userId);
  }

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
  const { repName, distributor, town, month, itinerary, status } = req.body;
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

  // Validate itinerary entries
  if (!itinerary || !Array.isArray(itinerary) || itinerary.length === 0) {
    throw new AppError(400, 'Itinerary entries are required and must be a non-empty array');
  }
  
  // Validate each entry
  const validEntries = itinerary.filter(entry =>
    entry.date && entry.area && entry.town &&
    entry.doctorCalls !== undefined && entry.chemistCalls !== undefined && entry.mileage !== undefined
  );
  
  if (validEntries.length === 0) {
    throw new AppError(400, 'At least one valid itinerary entry is required with date, area, town, doctorCalls, chemistCalls, and mileage');
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
      town,
      month,
      status: status || "pending",
      entries: {
        create: itinerary.map(entry => ({
          date: entry.date,
          dayNo: parseInt(entry.dayNo) || 0,
          area: entry.area || null,
          town: entry.town || null,
          doctorCalls: parseInt(entry.doctorCalls) || 0,
          chemistCalls: parseInt(entry.chemistCalls) || 0,
          mileage: parseFloat(entry.mileage) || 0,
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

// Generate PDF
const generatePDF = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const itinerary = await prisma.itinerary.findFirst({
    where: {
      id: id
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

  const html = generateItineraryHTML(itinerary);

  const pdf = require('html-pdf');
  pdf.create(html, { format: 'A4' }).toBuffer((err, buffer) => {
    if (err) {
      console.error('PDF generation error:', err);
      return res.status(500).json(new ApiResponse(500, null, 'PDF generation failed'));
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=itinerary-${itinerary.month}-${itinerary.user.emp_no}.pdf`);
    res.send(buffer);
  });
});

// Get Itinerary Summary
const getItinerarySummary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const itinerary = await prisma.itinerary.findFirst({
    where: {
      id: parseInt(id)
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

  // Calculate summary
  const summary = {
    totalDays: itinerary.entries.length,
    totalDoctorCalls: itinerary.entries.reduce((sum, entry) => sum + (entry.doctorCalls || 0), 0),
    totalChemistCalls: itinerary.entries.reduce((sum, entry) => sum + (entry.chemistCalls || 0), 0),
    totalMileage: itinerary.entries.reduce((sum, entry) => sum + (entry.mileage || 0), 0),
    areas: [...new Set(itinerary.entries.map(entry => entry.area).filter(area => area))],
    nightOutAreas: [...new Set(itinerary.entries.map(entry => entry.nightOutArea).filter(area => area))],
    itinerary: {
      id: itinerary.id,
      repName: itinerary.repName,
      distributor: itinerary.distributor,
      town: itinerary.town,
      month: itinerary.month,
      status: itinerary.status,
      createdAt: itinerary.createdAt,
      user: itinerary.user
    }
  };

  res.status(200).json(new ApiResponse(200, summary, 'Itinerary summary fetched successfully'));
});

// Get Itinerary Entry by Date for DCR
const getItineraryByDate = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const userId = req.user.id;

  if (!date) {
    return res.status(400).json(new ApiResponse(400, null, 'Date is required'));
  }

  // Find itinerary entry for this user and date
  const entry = await prisma.itineraryEntry.findFirst({
    where: {
      itinerary: {
        user_id: userId
      },
      date: date
    },
    include: {
      itinerary: true
    }
  });

  if (!entry) {
    return res.status(200).json(new ApiResponse(200, { found: false }, 'No itinerary found for this date'));
  }

  res.status(200).json(new ApiResponse(200, {
    area: entry.area,
    town: entry.town,
    itineraryEntryId: entry.id
  }, 'Itinerary entry found'));
});

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
  worksheet.addRow(['Town:', itinerary.town || 'N/A']);
  worksheet.addRow(['Month:', itinerary.month]);
  worksheet.addRow(['Generated On:', new Date().toLocaleDateString()]);
  worksheet.addRow(['']);

  // Add table headers
  worksheet.addRow(['Date', 'Day No', 'Area', 'Town', 'Doctor Calls', 'Chemist Calls', 'Scheduled Mileage (km)', 'Night Out Area']);

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
      entry.town ||'',
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
          <tr><td>Town:</td><td>${itinerary.town || 'N/A'}</td></tr>
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
            <th>Town</th>
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
              <td>${entry.town || ''}</td>
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
  getItinerarySummary,
  updateItinerary,
  deleteItinerary,
  generatePDF,
  generateExcel,
  getItineraryByDate
};