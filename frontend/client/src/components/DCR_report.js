import React, { useState, useEffect } from "react";

// Sample data
const doctors = [
  "M. Mendis - VP", "M. Mendis - MO", "M. Mendis - PEAD", "M. Mendis - GP", "Dr. Davis",
  "Dr. Miller", "Dr. Wilson", "Dr. Moore", "Dr. Taylor", "Dr. Anderson"
];

// Data structure now includes prices for calculation
const productCategories = {
  "Dicardia": [
    { name: "10mg 100's", samplingPrice: 150, stockingPrice: 120, detailedPrice: 10 },
    { name: "20mg 100's", samplingPrice: 200, stockingPrice: 180, detailedPrice: 10 }
  ],
  "Dicloran": [
    { name: "50mg 100's", samplingPrice: 100, stockingPrice: 80, detailedPrice: 5 },
    { name: "SR 75 100's", samplingPrice: 120, stockingPrice: 95, detailedPrice: 5 },
    { name: "100 100's", samplingPrice: 180, stockingPrice: 150, detailedPrice: 5 },
    { name: "50g Gel", samplingPrice: 75, stockingPrice: 60, detailedPrice: 0 },
    { name: "25g Gel", samplingPrice: 50, stockingPrice: 40, detailedPrice: 0 },
  ],
  "Pedivit Forte": [
    { name: "Syrup 100ml", samplingPrice: 130, stockingPrice: 110, detailedPrice: 10 },
    { name: "Drops 15ml", samplingPrice: 90, stockingPrice: 75, detailedPrice: 10 }
  ],
  "Unimelo": [
    { name: "10mg 100's", samplingPrice: 220, stockingPrice: 200, detailedPrice: 15 }
  ],
  "Vasslip": [
    { name: "10mg 100's", samplingPrice: 160, stockingPrice: 140, detailedPrice: 10 },
    { name: "20mg 100's", samplingPrice: 210, stockingPrice: 190, detailedPrice: 10 }
  ]
};

const managers = ['Manager A', 'Manager B', 'Manager C'];

// --- Helper Functions for Calculation & Summary (Defined outside) ---

/**
 * Calculates the total value for a single doctor's row.
 */
const calculateDoctorTotal = (doctorRow) => {
  let total = 0;
  if (!doctorRow || !doctorRow.productData) return total;

  Object.keys(productCategories).forEach(category => {
    if (productCategories[category] && doctorRow.productData[category]) {
      const productsWithPrices = productCategories[category];
      const productStates = doctorRow.productData[category];

      productsWithPrices.forEach((priceInfo, index) => {
        if (index < productStates.length) {
          const stateInfo = productStates[index];
          if (stateInfo.sampling && stateInfo.samplingQty) {
            total += (priceInfo.samplingPrice || 0) * (parseInt(stateInfo.samplingQty) || 0);
          }
          if (stateInfo.stocking && stateInfo.stockingQty) {
            total += (priceInfo.stockingPrice || 0) * (parseInt(stateInfo.stockingQty) || 0);
          }
          if (stateInfo.detailed) {
            total += (priceInfo.detailedPrice || 0);
          }
        }
      });
    }
  });
  return total;
};

/**
 * Generates a structured summary of all selected items and managers for all doctors.
 */
const generateSummaryData = (tableData) => {
  const summary = [];
  tableData.forEach(doc => {
    const docSummary = {
      doctor: doc.doctor,
      items: [],
      total: calculateDoctorTotal(doc),
      // NEW: Add selected managers if joint visit is checked
      managersSelected: (doc.jointVisit && doc.jointVisitManagers)
        ? Object.entries(doc.jointVisitManagers)
            .filter(([key, value]) => value === true)
            .map(([key, value]) => key)
        : []
    };

    if (doc.productData) {
        Object.keys(doc.productData).forEach(category => {
            if (productCategories[category] && doc.productData[category]) {
                doc.productData[category].forEach((productState, index) => {
                    if (index < productCategories[category].length) {
                        const priceInfo = productCategories[category][index];

                        if (productState.sampling && productState.samplingQty) {
                          const qty = parseInt(productState.samplingQty) || 0;
                          const price = priceInfo.samplingPrice || 0;
                          docSummary.items.push({
                            name: `${category} - ${productState.name}`, type: "Sampling", qty: qty, unitPrice: price, lineTotal: qty * price
                          });
                        }
                        if (productState.detailed) {
                          const price = priceInfo.detailedPrice || 0;
                          docSummary.items.push({
                            name: `${category} - ${productState.name}`, type: "Detailed", qty: 1, unitPrice: price, lineTotal: price
                          });
                        }
                        if (productState.stocking && productState.stockingQty) {
                          const qty = parseInt(productState.stockingQty) || 0;
                          const price = priceInfo.stockingPrice || 0;
                          docSummary.items.push({
                            name: `${category} - ${productState.name}`, type: "Stocking", qty: qty, unitPrice: price, lineTotal: qty * price
                          });
                        }
                    }
                });
            }
        });
    }
    // Only add to summary if there are items OR selected managers
    if (docSummary.items.length > 0 || docSummary.managersSelected.length > 0) {
      summary.push(docSummary);
    }
  });
  return summary;
};


/**
 * Summary Table Component (Shows prices, totals, and managers for selected items)
 */
const LiveSummaryTable = ({ tableData }) => {
  const summaryData = generateSummaryData(tableData);

  if (summaryData.length === 0) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center text-gray-500">
        No items or joint visits selected yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {summaryData.map((docSummary, idx) => (
        <div key={idx} className="p-4 border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
          <h4 className="font-bold text-md text-blue-700 mb-1">{docSummary.doctor}</h4>
          {/* NEW: Display selected managers */}
          {docSummary.managersSelected.length > 0 && (
            <p className="text-xs text-gray-600 mb-3">
              <span className="font-semibold">Joint Visit with:</span> {docSummary.managersSelected.join(', ')}
            </p>
          )}

          {docSummary.items.length > 0 ? (
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Product</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">Unit Price</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">Quantity</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {docSummary.items.map((item, itemIdx) => (
                  <tr key={itemIdx} className="border-b last:border-b-0">
                    <td className="px-4 py-2 whitespace-nowrap">{item.name}</td>
                    <td className="px-4 py-2">{item.type}</td>
                    <td className="px-4 py-2 text-right">Rs. {item.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{item.qty}</td>
                    <td className="px-4 py-2 text-right font-medium">Rs. {item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-300">
                <tr>
                  <td colSpan="4" className="px-4 py-2 text-right font-bold text-gray-800">
                    Total for {docSummary.doctor}:
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-lg text-blue-600">
                    Rs. {docSummary.total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            // If only managers selected but no items
            <p className="text-sm text-gray-500 italic">No products selected for this doctor.</p>
          )}
        </div>
      ))}
    </div>
  );
};


// --- Main Component ---
export default function RepdetailsReport() {
  const [step, setStep] = useState(1); 

  // Step 1 State
  const [date, setDate] = useState("");
  const [range, setRange] = useState("");
  const [agency, setAgency] = useState("");
  const [repName, setRepName] = useState("");
  const [empNo, setEmpNo] = useState("");
  const [distributor, setDistributor] = useState("");
  const [area, setArea] = useState("");
  const [town, setTown] = useState("");
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  // Step 2 State
  const [selectedProductTab, setSelectedProductTab] = useState("Dicloran");
  const [tableData, setTableData] = useState([]);

  // Step 3 State (Combined)
  const [otherBillsOpen, setOtherBillsOpen] = useState(false);
  const [otherBills, setOtherBills] = useState({
    parking: { checked: false, amount: "" },
    highway: { checked: false, amount: "" },
    other: { checked: false, amount: "" }
  });
  const [otherBillImages, setOtherBillImages] = useState([]);
  const [expenses, setExpenses] = useState({ bata: false, nightOut: false, fuel: false });
  const [remarks, setRemarks] = useState("");
  const [orderFormImage, setOrderFormImage] = useState(null);


  // --- Step 1 Functions ---
  const toggleDoctor = (doc) => {
    setSelectedDoctors(prev =>
      prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]
    );
  };

  useEffect(() => {
    const onClick = (e) => {
      if (showDoctorDropdown && !e.target.closest("#doctor-dropdown"))
        setShowDoctorDropdown(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showDoctorDropdown]);

  const step1Valid =
    date && range.trim() && agency.trim() && repName.trim() &&
    empNo.trim() && distributor.trim() && area.trim() &&
    town.trim() && selectedDoctors.length > 0;

  // --- Step 2 Functions ---
  useEffect(() => {
    if (step === 2) {
      const doctorsInTable = tableData.map(d => d.doctor);
      const doctorsMatch = selectedDoctors.length === doctorsInTable.length && selectedDoctors.every(doc => doctorsInTable.includes(doc));

      if (!doctorsMatch) {
        const newTableData = selectedDoctors.map((doctor) => ({
          doctor,
          jointVisit: false,
          jointVisitManagers: { 'Manager A': false, 'Manager B': false, 'Manager C': false },
          productData: Object.keys(productCategories).reduce((acc, category) => {
            acc[category] = productCategories[category].map(product => ({
              name: product.name, // Only copy name
              sampling: false, samplingQty: "",
              detailed: false,
              stocking: false, stockingQty: ""
            }));
            return acc;
          }, {}),
        }));
        setTableData(newTableData);
      }
    }
  }, [step, selectedDoctors, tableData]);

  const updateCell = (docIdx, productIdx, field, value) => {
    setTableData(old => 
      old.map((doc, i) => {
        if (i !== docIdx) return doc;
        const newProductData = { ...doc.productData };
        if (!newProductData[selectedProductTab]) {
            newProductData[selectedProductTab] = productCategories[selectedProductTab].map(p => ({
                name: p.name, sampling: false, samplingQty: "", detailed: false, stocking: false, stockingQty: ""
            }));
        }
        const newProductTabArray = [...newProductData[selectedProductTab]];
        if (productIdx < newProductTabArray.length) {
            newProductTabArray[productIdx] = {
              ...newProductTabArray[productIdx],
              [field]: value
            };
            newProductData[selectedProductTab] = newProductTabArray;
        } else {
            console.error("Invalid product index:", productIdx, "for tab:", selectedProductTab);
        }
        return { ...doc, productData: newProductData };
      })
    );
  };

  const toggleJointVisit = (idx) => {
    setTableData(prev =>
      prev.map((doc, i) =>
        i === idx
          ? { ...doc,
              jointVisit: !doc.jointVisit,
              jointVisitManagers: doc.jointVisit
                ? { 'Manager A': false, 'Manager B': false, 'Manager C': false }
                : doc.jointVisitManagers
            }
          : doc
      )
    );
  };

  const toggleManagerCheckbox = (docIdx, managerKey) => {
    setTableData(prev =>
      prev.map((doc, i) => {
        if (i !== docIdx) return doc;
        return {
          ...doc,
          jointVisitManagers: {
            ...doc.jointVisitManagers,
            [managerKey]: !doc.jointVisitManagers[managerKey]
          }
        };
      })
    );
  };

  /**
   * Calculates the grand total for Step 2 display.
   */
  const calculateLiveGrandTotal = () => {
    const summary = generateSummaryData(tableData);
    return summary.reduce((acc, doc) => acc + doc.total, 0);
  };


  // --- Step 3 Functions ---
  const toggleOtherBillItem = (key) => {
    setOtherBills(prev => ({
      ...prev,
      [key]: {
        checked: !prev[key].checked,
        amount: prev[key].checked ? "" : prev[key].amount
      }
    }));
  };
  const setOtherBillAmount = (key, value) => {
    setOtherBills(prev => ({ ...prev, [key]: { ...prev[key], amount: value } }));
  };
  const onOtherBillFilesChange = (e) => {
    setOtherBillImages(prev => [...prev, ...Array.from(e.target.files)]);
  };

  const handleExpenseChange = (key) => {
    setExpenses(prev => {
      const newVal = !prev[key];
      if (key === "bata" && newVal) return { ...prev, bata: true, nightOut: false };
      if (key === "nightOut" && newVal) return { ...prev, bata: false, nightOut: true };
      return { ...prev, [key]: newVal };
    });
  };

  const handleSubmit = () => {
    const submissionData = {
      date, range, agency, repName, empNo, distributor, area, town,
      callReport: tableData,
      dailyExpenses: expenses,
      otherBills: {
          details: otherBills,
          images: otherBillImages.map(f => f.name) 
      },
    
      remarks,
      orderFormImage: orderFormImage ? orderFormImage.name : null 
    };
    console.log("Submitting Data:", submissionData);
    alert("Submitted!"); 
  }


  const FROZEN = { no: 40, doctor: 180, joint: 150 }; 
  const LEFTS = { no: 0, doctor: FROZEN.no, joint: FROZEN.no + FROZEN.doctor };
  const stickyBase = {
    position: 'sticky',
    background: '#ffffff', 
    zIndex: 30,
    
  };

  const renderStep1 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Daily Call Report</h2>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto rounded-full" />
      </div>
      {/* ... (Step 1 form fields - unchanged) ... */}
       {/* Date */}
      <div className="mb-6">
        <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      {/* Range */}
      <div className="mb-6">
        <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Range</label>
        <input type="text" value={range} placeholder="Enter Range" onChange={(e) => setRange(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      {/* Agency */}
      <div className="mb-6">
        <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Agency</label>
        <input type="text" value={agency} placeholder="Enter Agency" onChange={(e) => setAgency(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      {/* Rep Name */}
      <div className="mb-6">
        <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Rep Name</label>
        <input type="text" value={repName} placeholder="Enter Rep Name" onChange={(e) => setRepName(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      {/* Emp No */}
      <div className="mb-6">
        <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Emp No</label>
        <input type="text" value={empNo} placeholder="Enter Emp No" onChange={(e) => setEmpNo(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      {/* Distributor */}
      <div className="mb-6">
        <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Distributor</label>
        <input type="text" value={distributor} placeholder="Enter Distributor" onChange={(e) => setDistributor(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
      </div>
      {/* Area + Town */}
      <div className="flex gap-6 mb-6">
        <div className="flex-1">
          <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Area</label>
          <input type="text" value={area} placeholder="Enter Area" onChange={(e) => setArea(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div className="flex-1">
          <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Town</label>
          <input type="text" value={town} placeholder="Enter Town" onChange={(e) => setTown(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
      {/* Doctor dropdown */}
      <div className="mb-8">
        <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Doctor</label>
        <div id="doctor-dropdown" className="relative" onClick={() => setShowDoctorDropdown(v => !v)}>
          <div className="flex justify-between items-center px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:border-blue-500 hover:bg-blue-50">
            <span className="text-gray-700">Select Doctor(s)</span>
            <div className="flex items-center">
              {selectedDoctors.length > 0 && (
                <span className="text-sm text-blue-600 mr-3 font-semibold bg-blue-100 px-2 py-1 rounded-full">
                  {selectedDoctors.length} selected
                </span>
              )}
              <span className="text-gray-500 text-lg">▾</span>
            </div>
          </div>
          {showDoctorDropdown && (
            <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 rounded-lg max-h-60 overflow-y-auto z-10 shadow-xl mt-1">
              {doctors.map((doc) => (
                <label key={doc} className={`flex items-center px-4 py-3 cursor-pointer text-sm ${selectedDoctors.includes(doc) ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={selectedDoctors.includes(doc)} onChange={(e) => { e.stopPropagation(); toggleDoctor(doc); }} className="mr-3 scale-125 cursor-pointer" />
                  {doc}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Next Button */}
      <div className="text-center mt-10">
        <button
          disabled={!step1Valid}
          onClick={() => setStep(2)}
          className={`px-8 py-4 text-lg font-bold rounded-xl transition-all ${step1Valid ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          Next
        </button>
      </div>
    </div>
  );

 const renderStep2 = () => (
    <div className="w-full mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-gray-200">
        Step 2: Product Selection
      </h2>

      {/* Product Category Tabs */}
      <div className="flex items-center border-b-2 border-gray-200 mb-4 overflow-x-auto whitespace-nowrap">
        {Object.keys(productCategories).map(category => (
          <button
            key={category}
            onClick={() => setSelectedProductTab(category)}
            className={`px-6 py-3 font-semibold text-sm transition-all flex-shrink-0 ${
              selectedProductTab === category
                ? 'border-b-4 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Main Product Selection Table */}
      <div className="overflow-x-auto mt-4 border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full min-w-[1100px] border-collapse table-fixed"> {/* table-fixed helps maintain defined widths */}
          <colgroup> {/* Define column widths */}
             <col style={{ width: `${FROZEN.no}px` }} />
             <col style={{ width: `${FROZEN.doctor}px` }} />
             <col style={{ width: `${FROZEN.joint}px` }} />
             {/* Dynamic columns will take remaining space */}
          </colgroup>
          <thead>
            <tr>
              {/* No. */}
              <th style={{ ...stickyBase, left: LEFTS.no, width: FROZEN.no }} className="border border-gray-200 px-3 py-2 bg-gray-100 text-gray-700 font-semibold text-center text-xs">No.</th>
              {/* Doctor */}
              <th style={{ ...stickyBase, left: LEFTS.doctor, width: FROZEN.doctor }} className="border border-gray-200 px-3 py-2 bg-gray-100 text-gray-700 font-semibold text-center text-xs">Doctors</th>
              {/* Joint Visit - REMOVED border */}
              <th style={{ ...stickyBase, left: LEFTS.joint, width: FROZEN.joint }} className="border border-gray-200 px-3 py-2 bg-gray-100 text-gray-700 font-semibold text-center text-xs">Joint Visit</th>
              {/* Dynamic Product Columns */}
              {productCategories[selectedProductTab].map((product, i) => (
                <th key={i} className="border border-gray-200 px-3 py-2 bg-gray-100 text-gray-700 font-semibold text-center min-w-[180px] text-xs">{product.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((doc, docIdx) => {
              const rowBg = docIdx % 2 === 0 ? '#f9fafb' : '#ffffff';
              const stickyCellStyle = { ...stickyBase, background: rowBg };
              return (
                <tr key={docIdx} style={{ background: rowBg }}>
                  {/* No. */}
                  <td style={{ ...stickyCellStyle, left: LEFTS.no, width: FROZEN.no }} className="border border-gray-200 px-3 py-2 text-center text-sm">{docIdx + 1}</td>
                  {/* Doctor */}
                  <td style={{ ...stickyCellStyle, left: LEFTS.doctor, width: FROZEN.doctor }} className="border border-gray-200 px-3 py-2 font-medium whitespace-nowrap text-sm">{doc.doctor}</td>
                  {/* Joint Visit & Manager Checkboxes - REMOVED border */}
                  <td style={{ ...stickyCellStyle, left: LEFTS.joint, width: FROZEN.joint }} className="border border-gray-200 px-3 py-2">
                    <div className="flex flex-col items-start gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={doc.jointVisit} onChange={() => toggleJointVisit(docIdx)} className="scale-110 cursor-pointer" />
                        <span className="text-xs text-gray-600">Joint Visit</span>
                      </label>
                      {doc.jointVisit && (
                        <div className="pl-5 flex flex-col gap-1">
                          {managers.map(manager => (
                            <label key={manager} className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={doc.jointVisitManagers[manager]} onChange={() => toggleManagerCheckbox(docIdx, manager)} className="scale-110 cursor-pointer" />
                              <span className="text-xs text-gray-700">{manager}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  {/* Dynamic Product cells */}
                  {doc.productData && doc.productData[selectedProductTab] ? (
                    doc.productData[selectedProductTab].map((cell, productIdx) => (
                      <td key={productIdx} className="border border-gray-200 px-3 py-2 align-top min-w-[180px]">
                        <div className="flex flex-col gap-3">
                          <label className={`flex items-center gap-2 text-sm`}>
                            <input type="checkbox" checked={cell.sampling || false} onChange={(e) => updateCell(docIdx, productIdx, "sampling", e.target.checked)} className="scale-110 cursor-pointer" />
                            <span className="flex-1 text-left text-xs">Sampling</span>
                            <input type="number" min="0" value={cell.samplingQty || ""} onChange={(e) => updateCell(docIdx, productIdx, "samplingQty", e.target.value)} placeholder="QTY" disabled={!cell.sampling} className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center text-xs" />
                          </label>
                          <label className={`flex items-center gap-2 text-sm`}>
                            <input type="checkbox" checked={cell.detailed || false} onChange={(e) => updateCell(docIdx, productIdx, "detailed", e.target.checked)} className="scale-110 cursor-pointer" />
                            <span className="flex-1 text-left text-xs">Detailed</span>
                          </label>
                          <label className={`flex items-center gap-2 text-sm`}>
                            <input type="checkbox" checked={cell.stocking || false} onChange={(e) => updateCell(docIdx, productIdx, "stocking", e.target.checked)} className="scale-110 cursor-pointer" />
                            <span className="flex-1 text-left text-xs">Stocking</span>
                            <input type="number" min="0" value={cell.stockingQty || ""} onChange={(e) => updateCell(docIdx, productIdx, "stockingQty", e.target.value)} placeholder="QTY" disabled={!cell.stocking} className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center text-xs" />
                          </label>
                        </div>
                      </td>
                    ))
                  ) : (
                    Array(productCategories[selectedProductTab]?.length || 0).fill(null).map((_, idx) => (
                        <td key={idx} className="border border-gray-200 px-3 py-2 align-top min-w-[180px]"></td>
                    ))
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Live Summary Section */}
      <h3 className="text-xl font-bold text-gray-800 mt-10 mb-4">
        Selected Items Summary
      </h3>
      <div className="p-4 border border-gray-200 rounded-lg">
        <LiveSummaryTable tableData={tableData} />
      </div>

       {/* Grand Total Box */}
       <div className="mt-6 p-4 bg-gray-800 text-white rounded-lg flex justify-between items-center">
         <span className="text-xl font-bold">Grand Total:</span>
         <span className="text-2xl font-bold">Rs. {calculateLiveGrandTotal().toFixed(2)}</span>
       </div>

      {/* Buttons */}
      <div className="mt-8 flex gap-4 justify-center">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-3 text-base font-semibold rounded-md bg-gray-500 hover:bg-gray-600 text-white"
        >
          Back
        </button>
        <button
          onClick={() => setStep(3)} 
          className="px-6 py-3 text-base font-semibold rounded-md bg-blue-500 hover:bg-blue-600 text-white"
        >
          Next
        </button>
      </div>
    </div>
  );


  // Combined Step 3 (Layout adjusted: Expenses, Mileage, Remarks in a single column)
  const renderStep3 = () => (
    <div className="w-full max-w-2xl mx-auto"> {/* Centered content */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-gray-200">
        Step 3: Expenses, Mileage & Remarks
      </h2>

      {/* Expenses Section */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <caption className="caption-top text-left text-lg text-gray-800 mb-2 font-bold">
            Daily Expenses
          </caption>
          <tbody>
            {["bata", "nightOut", "fuel"].map(key => (
              <tr key={key}>
                <td className="px-2 py-2 border-b border-gray-200 text-sm">
                  {key === "bata" ? "Daily Bata" : key === "nightOut" ? "Night Out" : "Fuel"}
                </td>
                <td className="px-2 py-2 border-b border-gray-200">
                  <input type="checkbox" checked={expenses[key]} onChange={() => handleExpenseChange(key)} className="scale-125 cursor-pointer" />
                </td>
              </tr>
            ))}
            {/* Other Bills dropdown */}
            <tr>
              <td colSpan={2} className="px-2 py-2">
                <div onClick={() => setOtherBillsOpen(o => !o)} className="border border-gray-300 rounded-md px-3 py-2 cursor-pointer hover:border-blue-500 text-sm">
                  Other Bills ▾
                </div>
                {otherBillsOpen && (
                  <div className="px-3 py-2 border border-gray-300 border-t-0 text-sm">
                    {["parking", "highway", "other"].map(key => (
                      <div key={key} className="flex items-center mb-2">
                        <input type="checkbox" checked={otherBills[key].checked} onChange={() => toggleOtherBillItem(key)} className="scale-125 mr-3 cursor-pointer" />
                        <span className="flex-1 capitalize">{key}</span>
                        {otherBills[key].checked && (
                          <input type="number" placeholder="Amount" value={otherBills[key].amount} onChange={e => setOtherBillAmount(key, e.target.value)} className="w-20 px-2 py-1 border border-gray-300 rounded-md" />
                        )}
                      </div>
                    ))}
                    <div className="mt-4">
                      <label className="block mb-1 text-xs">Upload Receipts:</label>
                      <input type="file" multiple accept="image/*" onChange={onOtherBillFilesChange} className="text-xs" />
                      {otherBillImages.length > 0 && (
                        <ul className="mt-2 text-xs">
                          {otherBillImages.map((f, i) => <li key={i}>{f.name}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mileage Section - Below Expenses */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <caption className="caption-top text-left text-lg text-gray-800 mb-2 font-bold">
            Mileage
          </caption>
          <tbody>
            {[
              { label: "Schedule mileage", input: <input type="text" placeholder="1000 km" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /> },
              { label: "Opening mileage", input: <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /> },
              { label: "Closing mileage", input: <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /> },
              { label: "Private mileage", input: <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /> },
              { label: "Odometer Reading", input: <input type="file" accept="image/*" className="w-full text-sm" /> },
              { label: "Fuel Pumped", input: <input type="text" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /> },
              { label: "Cost", input: <input type="text" placeholder="Rs." className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /> },
              { label: "Fuel Bill", input: <input type="file" accept="image/*" className="w-full text-sm" /> }
            ].map((row, i) => (
              <tr key={i}>
                <td className="px-3 py-2 border-b border-gray-200 text-sm w-1/3">{row.label}</td> {/* Adjusted width */}
                <td className="px-3 py-2 border-b border-gray-200">{row.input}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

       {/* Remarks Section - Below Mileage */}
       <div className="mb-8">
          <label className="font-bold text-gray-800 text-lg mb-3 block">Remark</label>
          <textarea
            placeholder="Enter your remarks..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 min-h-32 resize-vertical text-sm"
          />
          <label className="font-bold text-gray-800 text-lg mb-3 block">Order Form</label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setOrderFormImage(e.target.files[0])}
              className="text-sm cursor-pointer border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-l-md file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100"
            />
          </div>
          {orderFormImage && (
            <span className="text-sm text-gray-500 mt-2 block">
              {orderFormImage.name}
            </span>
          )}
        </div>


      {/* Buttons */}
      <div className="mt-8 flex gap-4 justify-center">
        <button
          onClick={() => setStep(2)} 
          className="px-6 py-3 text-base font-semibold rounded-md bg-gray-500 hover:bg-gray-600 text-white"
        >
          Back
        </button>
        <button
          onClick={handleSubmit} 
          className="px-6 py-3 text-base font-semibold rounded-md bg-green-500 hover:bg-green-600 text-white"
        >
          Submit
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-red-50 py-8 px-4 relative">
      {step >= 2 && (
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dc2626' fill-opacity='0.08'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
      )}

      <div className="w-full max-w-7xl mx-auto bg-white rounded-xl p-8 shadow-2xl border border-gray-100 relative z-10">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}