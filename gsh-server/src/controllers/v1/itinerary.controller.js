const { prisma } = require('../../../lib/prisma');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const AppError = require('../../utils/AppError');
// const pdf = require('html-pdf'); // Commented out for now
const ExcelJS = require('exceljs');

// Helper function to check if a date is a Sunday
const isSunday = (dateStr) => {
  if (!dateStr) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDay() === 0; // 0 = Sunday
};

// Helper function to filter out Sunday entries
const filterOutSundays = (entries) => {
  if (!Array.isArray(entries)) return [];
  return entries.filter(entry => !isSunday(entry.date));
};

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
  
  // Filter out Sunday entries (server-side validation)
  const filteredEntries = filterOutSundays(validEntries);
  
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
        create: filteredEntries.map(entry => ({
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
  console.log('Current userId:', userId, 'User designation:', req.user.designation);
  if (req.query.employeeId) {
    userId = parseInt(req.query.employeeId);
    console.log('Switched to employeeId:', userId);
  }

  // Debug: Check if itinerary exists at all (bypass user filter)
  const anyItinerary = await prisma.itinerary.findUnique({
    where: { id: parseInt(id) }
  });
  console.log('Itinerary exists (any):', anyItinerary ? 'YES' : 'NO', 'Itinerary user_id:', anyItinerary?.user_id);

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
  
  // Filter out Sunday entries (server-side validation)
  const filteredEntries = filterOutSundays(validEntries);
  
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
        create: filteredEntries.map(entry => ({
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
    mileage: entry.mileage,
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

const getComparisonReport = asyncHandler(async (req, res) => {
  let userId = req.user.id;
  if (req.query.employeeId) {
    userId = parseInt(req.query.employeeId);
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, emp_no: true, designation: true }
  });

  if (!targetUser) {
    throw new AppError(404, 'User not found');
  }

  const selectedMonth = req.query.month;
  if (!selectedMonth) {
    throw new AppError(400, 'Month is required');
  }

  // Convert month to YYYY-MM if it's in "Month Year" format
  let monthKey = selectedMonth;
  if (!monthKey.match(/^\d{4}-\d{2}$/)) {
    const [monthName, year] = selectedMonth.split(' ');
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
    monthKey = `${year}-${String(monthIndex).padStart(2, '0')}`;
  }

  // Fetch itinerary
  const itinerary = await prisma.itinerary.findFirst({
    where: {
      user_id: userId,
      month: monthKey
    },
    include: {
      entries: {
        orderBy: { date: 'asc' }
      }
    }
  });

  // Fetch DCRs
  const dcrsInMonth = await prisma.dcr.findMany({
    where: {
      date: {
        startsWith: monthKey
      }
    },
    orderBy: { date: 'asc' }
  });

  const filteredDcrs = dcrsInMonth.filter(dcr => {
    const isOwner = dcr.user_id === userId;
    let isJoint = false;
    if (dcr.joint_user_ids) {
      try {
        const jointIds = typeof dcr.joint_user_ids === 'string' ? JSON.parse(dcr.joint_user_ids) : dcr.joint_user_ids;
        if (Array.isArray(jointIds)) {
          isJoint = jointIds.map(Number).includes(userId);
        }
      } catch (err) {
        console.error('Error parsing joint_user_ids:', err);
      }
    }
    return isOwner || isJoint;
  });

  // Fetch allocated price based on user designation
  let dailyBata = 0;
  let nightOutRate = 0;
  let nightOutReturnRate = 0;
  
  if (targetUser.designation) {
    const designationMap = {
      'MR': 'Medical Rep',
      'FC': 'Field Coordinator',
      'JE': 'Junior Executive',
      'SE': 'Senior Executive',
      'TM': 'Territory Manager',
      'PM': 'Product Manager',
      'OM': 'Operations Manager',
      'ADMIN': 'Admin'
    };
    
    let allocatedPrice = await prisma.allocatedPrice.findFirst({
      where: { 
        designation: { 
          equals: targetUser.designation, 
          mode: 'insensitive' 
        }
      }
    });
    
    if (!allocatedPrice) {
      const fullName = designationMap[targetUser.designation.toUpperCase()];
      if (fullName) {
        allocatedPrice = await prisma.allocatedPrice.findFirst({
          where: { 
            designation: { 
              equals: fullName, 
              mode: 'insensitive' 
            }
          }
        });
      }
    }
    
    if (!allocatedPrice) {
      allocatedPrice = await prisma.allocatedPrice.findFirst({
        where: { 
          designation: {
            contains: targetUser.designation,
            mode: 'insensitive'
          }
        }
      });
    }

    if (allocatedPrice) {
      dailyBata = allocatedPrice.dailyBata || 0;
      nightOutRate = allocatedPrice.nightOut || 0;
      nightOutReturnRate = allocatedPrice.nightOutReturn || 0;
    }
  }

  // Build daily comparison records
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const daysInMonth = new Date(year, month, 0).getDate();
  
  const comparisonData = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${yearStr}-${monthStr}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month - 1, day);
    const isSun = dateObj.getDay() === 0;
    
    const itinEntry = itinerary?.entries.find(e => e.date === dateString);
    const dcrEntry = filteredDcrs.find(d => d.date === dateString);
    
    // Skip day if no itinerary entry AND no DCR report exists (and it's a Sunday)
    if (!itinEntry && !dcrEntry && isSun) {
      continue;
    }
    
    let actualDoctorCalls = 0;
    let actualChemistCalls = 0;
    let actualMileage = 0;
    let fuelCost = 0;
    let otherExpenses = 0;
    let hasBata = false;
    let hasNightOut = false;
    let hasNightOutReturn = false;
    
    if (dcrEntry) {
      if (dcrEntry.callReport && Array.isArray(dcrEntry.callReport)) {
        dcrEntry.callReport.forEach(call => {
          if (call.doctor) actualDoctorCalls++;
          if (call.chemist) actualChemistCalls++;
        });
      }
      
      if (dcrEntry.mileage) {
        const opening = parseFloat(dcrEntry.mileage.openingMileage || dcrEntry.mileage.odometerStart) || 0;
        const closing = parseFloat(dcrEntry.mileage.closingMileage || dcrEntry.mileage.odometerEnd) || 0;
        if (closing > 0 && opening > 0) {
          actualMileage = Math.abs(closing - opening);
        }
        fuelCost = parseFloat(dcrEntry.mileage.cost) || 0;
      }
      
      if (dcrEntry.dailyExpenses) {
        hasBata = !!dcrEntry.dailyExpenses.bata;
        hasNightOut = !!dcrEntry.dailyExpenses.nightOut;
        hasNightOutReturn = !!dcrEntry.dailyExpenses.nightOutReturn;
      }
      
      if (dcrEntry.otherBills && dcrEntry.otherBills.details) {
        otherExpenses += parseFloat(dcrEntry.otherBills.details.parking?.amount || 0);
        otherExpenses += parseFloat(dcrEntry.otherBills.details.highway?.amount || 0);
        otherExpenses += parseFloat(dcrEntry.otherBills.details.other?.amount || 0);
      }
    }
    
    comparisonData.push({
      date: dateString,
      dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      isSunday: isSun,
      schedArea: itinEntry?.area || '',
      schedTown: itinEntry?.town || '',
      schedDoctorCalls: itinEntry?.doctorCalls || 0,
      schedChemistCalls: itinEntry?.chemistCalls || 0,
      schedMileage: itinEntry?.mileage || 0,
      schedNightOutArea: itinEntry?.nightOutArea || '',
      actArea: dcrEntry?.actualWorkingArea || dcrEntry?.area || '',
      actTown: dcrEntry?.town || '',
      actDoctorCalls: actualDoctorCalls,
      actChemistCalls: actualChemistCalls,
      actMileage: actualMileage,
      actNightOut: hasNightOut ? 'Yes' : 'No',
      actNightOutReturn: hasNightOutReturn ? 'Yes' : 'No',
      actBata: hasBata ? 'Yes' : 'No',
      bataCost: hasBata ? dailyBata : 0,
      nightOutCost: (hasNightOut ? nightOutRate : 0) + (hasNightOutReturn ? nightOutReturnRate : 0),
      fuelCost: fuelCost,
      otherExpenses: otherExpenses
    });
  }

  // Excel Generation
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Comparison Summary');
  
  worksheet.views = [{ showGridLines: true }];

  worksheet.addRow(['Monthly Comparison Summary Report (Scheduled vs. Actual)']);
  worksheet.addRow(['']);
  worksheet.addRow(['Employee Name:', targetUser.name]);
  worksheet.addRow(['Employee No:', targetUser.emp_no]);
  worksheet.addRow(['Designation:', targetUser.designation || 'N/A']);
  worksheet.addRow(['Month:', selectedMonth]);
  worksheet.addRow(['Generated On:', new Date().toLocaleDateString()]);
  worksheet.addRow(['']);

  const titleRow = worksheet.getRow(1);
  titleRow.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E293B' } };
  
  for (let r = 3; r <= 7; r++) {
    worksheet.getRow(r).getCell(1).font = { bold: true, color: { argb: 'FF475569' } };
  }

  worksheet.addRow([
    'Date Info', '', 
    'Scheduled Itinerary Details', '', '', '', '', '',
    'Actual DCR Details', '', '', '', '', '', '', '', '', '', '', '', '',
    'Variance', '', ''
  ]);
  worksheet.addRow([
    'Date', 'Day',
    'Area', 'Town', 'Dr Calls', 'Ch Calls', 'Mileage (km)', 'Night Out Area',
    'Area', 'Town', 'Dr Calls', 'Ch Calls', 'Mileage (km)', 'Night Out', 'Night Out Return', 'Bata', 'Bata (Rs)', 'N/Out (Rs)', 'Fuel (Rs)', 'Other (Rs)', 'Total (Rs)',
    'Dr Calls', 'Ch Calls', 'Mileage (km)'
  ]);

  worksheet.mergeCells('A9:B9');   // Date Info
  worksheet.mergeCells('C9:H9');   // Scheduled Itinerary Details
  worksheet.mergeCells('I9:U9');   // Actual DCR Details
  worksheet.mergeCells('V9:X9');   // Variance

  const groupHeaderRow = worksheet.getRow(9);
  const detailHeaderRow = worksheet.getRow(10);

  groupHeaderRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  groupHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
  
  const groupColors = {
    dateInfo: 'FF475569',
    scheduled: 'FF2563EB',
    actual: 'FF10B981',
    variance: 'FFF59E0B'
  };

  for (let c = 1; c <= 24; c++) {
    let color = groupColors.dateInfo;
    if (c >= 3 && c <= 8) color = groupColors.scheduled;
    if (c >= 9 && c <= 21) color = groupColors.actual;
    if (c >= 22 && c <= 24) color = groupColors.variance;
    
    groupHeaderRow.getCell(c).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: color }
    };
  }

  detailHeaderRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E293B' } };
  detailHeaderRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  for (let c = 1; c <= 24; c++) {
    detailHeaderRow.getCell(c).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }
    };
    detailHeaderRow.getCell(c).border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  }

  groupHeaderRow.height = 28;
  detailHeaderRow.height = 24;

  let startRow = 11;
  let currentRow = startRow;
  
  comparisonData.forEach(data => {
    const row = worksheet.addRow([
      data.date,
      data.dayName,
      data.schedArea,
      data.schedTown,
      data.schedDoctorCalls,
      data.schedChemistCalls,
      data.schedMileage,
      data.schedNightOutArea,
      data.actArea,
      data.actTown,
      data.actDoctorCalls,
      data.actChemistCalls,
      data.actMileage,
      data.actNightOut,
      data.actNightOutReturn,
      data.actBata,
      data.bataCost,
      data.nightOutCost,
      data.fuelCost,
      data.otherExpenses,
      { formula: `=Q${currentRow}+R${currentRow}+S${currentRow}+T${currentRow}` },
      { formula: `=K${currentRow}-E${currentRow}` },
      { formula: `=L${currentRow}-F${currentRow}` },
      { formula: `=M${currentRow}-G${currentRow}` }
    ]);

    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(5).alignment = { horizontal: 'right' };
    row.getCell(6).alignment = { horizontal: 'right' };
    row.getCell(7).alignment = { horizontal: 'right' };
    row.getCell(11).alignment = { horizontal: 'right' };
    row.getCell(12).alignment = { horizontal: 'right' };
    row.getCell(13).alignment = { horizontal: 'right' };
    row.getCell(14).alignment = { horizontal: 'center' };
    row.getCell(15).alignment = { horizontal: 'center' };
    row.getCell(16).alignment = { horizontal: 'center' };
    row.getCell(17).alignment = { horizontal: 'right' };
    row.getCell(18).alignment = { horizontal: 'right' };
    row.getCell(19).alignment = { horizontal: 'right' };
    row.getCell(20).alignment = { horizontal: 'right' };
    row.getCell(21).alignment = { horizontal: 'right' };
    row.getCell(22).alignment = { horizontal: 'right' };
    row.getCell(23).alignment = { horizontal: 'right' };
    row.getCell(24).alignment = { horizontal: 'right' };

    row.getCell(7).numFmt = '0.0';
    row.getCell(13).numFmt = '0.0';
    row.getCell(17).numFmt = '"Rs." #,##0.00';
    row.getCell(18).numFmt = '"Rs." #,##0.00';
    row.getCell(19).numFmt = '"Rs." #,##0.00';
    row.getCell(20).numFmt = '"Rs." #,##0.00';
    row.getCell(21).numFmt = '"Rs." #,##0.00';
    row.getCell(22).numFmt = '+0;-0;0';
    row.getCell(23).numFmt = '+0;-0;0';
    row.getCell(24).numFmt = '+0.0;-0.0;0.0';

    for (let c = 1; c <= 24; c++) {
      row.getCell(c).border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      
      if (data.isSunday) {
        row.getCell(c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF1F5F9' }
        };
      }
    }

    currentRow++;
  });

  const totalRowIndex = currentRow;
  const totalRow = worksheet.addRow([
    'TOTALS', '', 
    '', '', 
    { formula: `=SUM(E${startRow}:E${totalRowIndex-1})` },
    { formula: `=SUM(F${startRow}:F${totalRowIndex-1})` },
    { formula: `=SUM(G${startRow}:G${totalRowIndex-1})` },
    '', 
    '', '', 
    { formula: `=SUM(K${startRow}:K${totalRowIndex-1})` },
    { formula: `=SUM(L${startRow}:L${totalRowIndex-1})` },
    { formula: `=SUM(M${startRow}:M${totalRowIndex-1})` },
    '', '', '', 
    { formula: `=SUM(Q${startRow}:Q${totalRowIndex-1})` },
    { formula: `=SUM(R${startRow}:R${totalRowIndex-1})` },
    { formula: `=SUM(S${startRow}:S${totalRowIndex-1})` },
    { formula: `=SUM(T${startRow}:T${totalRowIndex-1})` },
    { formula: `=SUM(U${startRow}:U${totalRowIndex-1})` },
    { formula: `=SUM(V${startRow}:V${totalRowIndex-1})` },
    { formula: `=SUM(W${startRow}:W${totalRowIndex-1})` },
    { formula: `=SUM(X${startRow}:X${totalRowIndex-1})` }
  ]);

  worksheet.mergeCells(`A${totalRowIndex}:B${totalRowIndex}`);
  totalRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  
  for (let c = 1; c <= 24; c++) {
    totalRow.getCell(c).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }
    };
    totalRow.getCell(c).border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } }
    };
  }

  totalRow.getCell(5).numFmt = '#,##0';
  totalRow.getCell(6).numFmt = '#,##0';
  totalRow.getCell(7).numFmt = '#,##0.0';
  totalRow.getCell(11).numFmt = '#,##0';
  totalRow.getCell(12).numFmt = '#,##0';
  totalRow.getCell(13).numFmt = '#,##0.0';
  totalRow.getCell(17).numFmt = '"Rs." #,##0.00';
  totalRow.getCell(18).numFmt = '"Rs." #,##0.00';
  totalRow.getCell(19).numFmt = '"Rs." #,##0.00';
  totalRow.getCell(20).numFmt = '"Rs." #,##0.00';
  totalRow.getCell(21).numFmt = '"Rs." #,##0.00';
  totalRow.getCell(22).numFmt = '+0;-0;0';
  totalRow.getCell(23).numFmt = '+0;-0;0';
  totalRow.getCell(24).numFmt = '+0.0;-0.0;0.0';

  totalRow.getCell(1).alignment = { horizontal: 'center' };
  totalRow.getCell(5).alignment = { horizontal: 'right' };
  totalRow.getCell(6).alignment = { horizontal: 'right' };
  totalRow.getCell(7).alignment = { horizontal: 'right' };
  totalRow.getCell(11).alignment = { horizontal: 'right' };
  totalRow.getCell(12).alignment = { horizontal: 'right' };
  totalRow.getCell(13).alignment = { horizontal: 'right' };
  totalRow.getCell(17).alignment = { horizontal: 'right' };
  totalRow.getCell(18).alignment = { horizontal: 'right' };
  totalRow.getCell(19).alignment = { horizontal: 'right' };
  totalRow.getCell(20).alignment = { horizontal: 'right' };
  totalRow.getCell(21).alignment = { horizontal: 'right' };
  totalRow.getCell(22).alignment = { horizontal: 'right' };
  totalRow.getCell(23).alignment = { horizontal: 'right' };
  totalRow.getCell(24).alignment = { horizontal: 'right' };

  worksheet.columns.forEach((column, i) => {
    let maxLen = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      let val = cell.value ? String(cell.value) : '';
      if (cell.formula) val = 'Rs. 99,999.00';
      if (val.length > maxLen) maxLen = val.length;
    });
    column.width = Math.min(Math.max(maxLen + 4, 12), 35);
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=comparison-report-${monthKey}-${targetUser.emp_no}.xlsx`);

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
  getItineraryByDate,
  getComparisonReport
};