import React, { useState, useEffect } from "react";

// Sample data
const doctors = [
  "Dr. Smith",
  "Dr. Johnson",
  "Dr. Williams",
  "Dr. Brown",
  "Dr. Davis",
  "Dr. Miller",
  "Dr. Wilson",
  "Dr. Moore",
  "Dr. Taylor",
  "Dr. Anderson"
];

const sampleProducts = [
  { product: "Amoxicillin", dosage: "500mg", form: "Capsule" },
  { product: "Ibuprofen", dosage: "200mg", form: "Tablet" },
  { product: "Omeprazole", dosage: "20mg", form: "Capsule" },
  { product: "Metformin", dosage: "850mg", form: "Tablet" }
];

export default function RepdetailsReport() {
  const [step, setStep] = useState(1);

  // STEP 1 STATE 
  const [date, setDate] = useState("");
  const [range, setRange] = useState("");
  const [agency, setAgency] = useState("");
  const [repName, setRepName] = useState("");
  const [empNo, setEmpNo] = useState("");
  const [distributor, setDistributor] = useState("");
  const [area, setArea] = useState("");
  const [town, setTown] = useState("");

  // Doctor dropdown
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

    // NEW OTHER BILLS STATE
  const [otherBillsOpen, setOtherBillsOpen] = useState(false);
  const [otherBills, setOtherBills] = useState({
    parking: { checked: false, amount: "" },
    highway: { checked: false, amount: "" },
    other:   { checked: false, amount: "" }
  });
  const [otherBillImages, setOtherBillImages] = useState([]);

   // OTHER BILLS HELPERS 
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
    setOtherBills(prev => ({
      ...prev,
      [key]: { ...prev[key], amount: value }
    }));
  };

  const onOtherBillFilesChange = (e) => {
  setOtherBillImages(prev => [
    ...prev,
    ...Array.from(e.target.files)
  ]);
};



  const toggleDoctor = (doc) => {
    setSelectedDoctors((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
  };

  useEffect(() => {
    // click outside closes dropdown
    const onClick = (e) => {
      if (showDoctorDropdown && !e.target.closest("#doctor-dropdown"))
        setShowDoctorDropdown(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showDoctorDropdown]);

  const step1Valid =
    date &&
    range.trim() &&
    agency.trim() &&
    repName.trim() &&
    empNo.trim() &&
    distributor.trim() &&
    area.trim() &&
    town.trim() &&
    selectedDoctors.length > 0;

  // STEP 2 STATE 
  const [tableData, setTableData] = useState([]);

  // Generate table data based on selected doctors
  useEffect(() => {
    if (step === 2 && selectedDoctors.length > 0) {
      const newTableData = selectedDoctors.map((doctor) => ({
        doctor,
        jointVisit: false,
        rows: sampleProducts.map((product) => ({
          ...product,
          sampling: false,
          samplingQty: "",
          detailed: false,
          stocking: false,
          stockingQty: ""
        })),
        totalPrice: "Rs.0.00"
      }));
      setTableData(newTableData);
    }
  }, [step, selectedDoctors]);

  const updateCell = (docIdx, colIdx, field, value) => {
    setTableData((old) =>
      old.map((doc, i) => {
        if (i !== docIdx) return doc;
        const rows = doc.rows.map((cell, j) =>
          j !== colIdx ? cell : { ...cell, [field]: value }
        );
        return { ...doc, rows };
      })
    );
  };

  //Joint Visit toggle
  const toggleJointVisit = (idx) => {
    setTableData((prev) =>
      prev.map((doc, i) =>
        i === idx ? { ...doc, jointVisit: !doc.jointVisit } : doc
      )
    );
  };

  //  EXPENSES STATE
  const [expenses, setExpenses] = useState({
    bata: false,
    nightOut: false,
    fuel: false
  });

  const handleExpenseChange = (key) => {
    setExpenses((prev) => {
      const newVal = !prev[key];
      if (key === "bata" && newVal) {
        return { ...prev, bata: true, nightOut: false };
      } else if (key === "nightOut" && newVal) {
        return { ...prev, bata: false, nightOut: true };
      } else {
        return { ...prev, [key]: newVal };
      }
    });
  };

  const calculateGrandTotal = () => {
    let total = 0;
    tableData.forEach((doc) => {
      doc.rows.forEach((row) => {
        if (row.sampling && row.samplingQty) {
          total += parseInt(row.samplingQty, 10) * 10;
        }
        if (row.stocking && row.stockingQty) {
          total += parseInt(row.stockingQty, 10) * 25;
        }
      });
    });
    return `Rs.${total.toFixed(2)}`;
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        margin: "1rem auto",
        background: "#fff",
        borderRadius: "6px",
        padding: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        boxSizing: "border-box"
      }}
    >
      {/* STEP 1: Rep Details */}
      {step === 1 && (
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2
            style={{
              marginBottom: "1.5rem",
              fontSize: "1.6rem",
              color: "#2c3e50",
              paddingBottom: "0.5rem",
              borderBottom: "2px solid #f0f0f0",
              textAlign: "center"
            }}
          >
            Daily Call Report
          </h2>

          {/* Date */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                color: "#34495e"
              }}
            >
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #dcdde1",
                borderRadius: "4px",
                fontSize: "1rem",
                outline: "none"
              }}
            />
          </div>

          {/* Range */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                color: "#34495e"
              }}
            >
              Range
            </label>
            <input
              type="text"
              value={range}
              placeholder="Enter Range"
              onChange={(e) => setRange(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #dcdde1",
                borderRadius: "4px",
                fontSize: "1rem",
                outline: "none"
              }}
            />
          </div>

          {/* Agency */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                color: "#34495e"
              }}
            >
              Agency
            </label>
            <input
              type="text"
              value={agency}
              placeholder="Enter Agency"
              onChange={(e) => setAgency(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #dcdde1",
                borderRadius: "4px",
                fontSize: "1rem",
                outline: "none"
              }}
            />
          </div>

          {/* Rep Name */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                color: "#34495e"
              }}
            >
              Rep Name
            </label>
            <input
              type="text"
              value={repName}
              placeholder="Enter Rep Name"
              onChange={(e) => setRepName(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #dcdde1",
                borderRadius: "4px",
                fontSize: "1rem",
                outline: "none"
              }}
            />
          </div>

          {/* Emp No */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                color: "#34495e"
              }}
            >
              Emp No
            </label>
            <input
              type="text"
              value={empNo}
              placeholder="Enter Emp No"
              onChange={(e) => setEmpNo(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #dcdde1",
                borderRadius: "4px",
                fontSize: "1rem",
                outline: "none"
              }}
            />
          </div>

          {/* Distributor */}
          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                color: "#34495e"
              }}
            >
              Distributor
            </label>
            <input
              type="text"
              value={distributor}
              placeholder="Enter Distributor"
              onChange={(e) => setDistributor(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #dcdde1",
                borderRadius: "4px",
                fontSize: "1rem",
                outline: "none"
              }}
            />
          </div>

          {/* Area + Town side‐by‐side */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "1rem"
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                  color: "#34495e"
                }}
              >
                Area
              </label>
              <input
                type="text"
                value={area}
                placeholder="Enter Area"
                onChange={(e) => setArea(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #dcdde1",
                  borderRadius: "4px",
                  fontSize: "1rem",
                  outline: "none"
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                  color: "#34495e"
                }}
              >
                Town
              </label>
              <input
                type="text"
                value={town}
                placeholder="Enter Town"
                onChange={(e) => setTown(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #dcdde1",
                  borderRadius: "4px",
                  fontSize: "1rem",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Doctor dropdown */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
                color: "#34495e"
              }}
            >
              Doctor
            </label>
            <div
              id="doctor-dropdown"
              style={{ position: "relative" }}
              onClick={() => setShowDoctorDropdown((v) => !v)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem",
                  border: "1px solid #dcdde1",
                  borderRadius: "4px",
                  background: "#f8f9fa",
                  cursor: "pointer",
                  transition: "border-color 0.2s"
                }}
              >
                <span>Select Doctor(s)</span>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {selectedDoctors.length > 0 && (
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#3498db",
                        marginRight: "0.5rem",
                        fontWeight: "500"
                      }}
                    >
                      {selectedDoctors.length} selected
                    </span>
                  )}
                  <span style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>
                    ▾
                  </span>
                </div>
              </div>
              {showDoctorDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 0.25rem)",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #dcdde1",
                    borderRadius: "4px",
                    maxHeight: "250px",
                    overflowY: "auto",
                    zIndex: 100,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                  }}
                >
                  {doctors.map((doc) => (
                    <label
                      key={doc}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "0.75rem",
                        cursor: "pointer",
                        transition: "background 0.2s",
                        fontSize: "0.95rem",
                        background: selectedDoctors.includes(doc)
                          ? "#e3f2fd"
                          : "transparent",
                        fontWeight: selectedDoctors.includes(doc)
                          ? "500"
                          : "normal"
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedDoctors.includes(doc)) {
                          e.target.style.background = "#f5f7fa";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedDoctors.includes(doc)) {
                          e.target.style.background = "transparent";
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDoctors.includes(doc)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleDoctor(doc);
                        }}
                        style={{ marginRight: "0.75rem" }}
                      />
                      {doc}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <button
              disabled={!step1Valid}
              onClick={() => setStep(2)}
              style={{
                padding: "0.8rem 1.8rem",
                fontSize: "1rem",
                fontWeight: "600",
                border: "none",
                borderRadius: "4px",
                cursor: step1Valid ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                background: step1Valid ? "#3498db" : "#bdc3c7",
                color: "white"
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Daily Quantities Table */}
      {step === 2 && (
        <div>
          <h2
            style={{
              marginBottom: "1.5rem",
              fontSize: "1.6rem",
              color: "#2c3e50",
              paddingBottom: "0.5rem",
              borderBottom: "2px solid #f0f0f0"
            }}
          >
            Step 2: Daily Call Report
          </h2>

          <div
            style={{
              overflowX: "auto",
              marginTop: "1rem",
              border: "1px solid #ecf0f1",
              borderRadius: "6px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: "1000px",
                borderCollapse: "collapse",
                tableLayout: "auto"
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      border: "1px solid #ecf0f1",
                      padding: "0.75rem",
                      background: "#2c3e50",
                      color: "white",
                      fontWeight: "600",
                      textAlign: "center",
                      position: "sticky",
                      left: 0,
                      zIndex: 10
                    }}
                  >
                    No.
                  </th>
                  <th
                    style={{
                      border: "1px solid #ecf0f1",
                      padding: "0.75rem",
                      background: "#2c3e50",
                      color: "white",
                      fontWeight: "600",
                      textAlign: "center",
                      position: "sticky",
                      left: "60px",
                      zIndex: 10
                    }}
                  >
                    Doctor
                  </th>
                  {/* Joint Visit header */}
                  <th
                    style={{
                      border: "1px solid #ecf0f1",
                      padding: "0.75rem",
                      background: "#2c3e50",
                      color: "white",
                      fontWeight: "600",
                      textAlign: "center"
                    }}
                  >
                    Joint Visit
                  </th>
                  {sampleProducts.map((product, i) => (
                    <th
                      key={i}
                      style={{
                        border: "1px solid #ecf0f1",
                        padding: "0.75rem",
                        background: "#2c3e50",
                        color: "white",
                        fontWeight: "600",
                        textAlign: "center",
                        minWidth: "150px"
                      }}
                    >
                      <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                        {product.product}
                      </div>
                      <div style={{ fontSize: "0.85rem", opacity: "0.8" }}>
                        {product.dosage} {product.form}
                      </div>
                    </th>
                  ))}
                  <th
                    style={{
                      border: "1px solid #ecf0f1",
                      padding: "0.75rem",
                      background: "#2c3e50",
                      color: "white",
                      fontWeight: "600",
                      textAlign: "center"
                    }}
                  >
                    Price
                  </th>
                </tr>
              </thead>

              <tbody>
                {tableData.map((doc, docIdx) => (
                  <tr
                    key={docIdx}
                    style={{
                      background: docIdx % 2 === 0 ? "#f8f9fa" : "#fff"
                    }}
                  >
                    <td
                      style={{
                        border: "1px solid #ecf0f1",
                        padding: "0.75rem",
                        verticalAlign: "top",
                        position: "sticky",
                        left: 0,
                        zIndex: 5,
                        background: docIdx % 2 === 0 ? "#f8f9fa" : "#fff",
                        boxShadow: "1px 0 2px rgba(0,0,0,0.05)"
                      }}
                    >
                      {docIdx + 1}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ecf0f1",
                        padding: "0.75rem",
                        verticalAlign: "top",
                        fontWeight: "500",
                        whiteSpace: "nowrap",
                        position: "sticky",
                        left: "60px",
                        zIndex: 5,
                        background: docIdx % 2 === 0 ? "#f8f9fa" : "#fff",
                        boxShadow: "1px 0 2px rgba(0,0,0,0.05)"
                      }}
                    >
                      {doc.doctor}
                    </td>
                    {/* Joint Visit checkbox cell */}
                    <td style={{ textAlign: "center", padding: "0.75rem" }}>
                      <input
                        type="checkbox"
                        checked={doc.jointVisit}
                        onChange={() => toggleJointVisit(docIdx)}
                        style={{ transform: "scale(1.2)", cursor: "pointer" }}
                      />
                    </td>
                    {doc.rows.map((cell, colIdx) => (
                      <td
                        key={colIdx}
                        style={{
                          border: "1px solid #ecf0f1",
                          padding: "0.75rem",
                          verticalAlign: "top"
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem"
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              fontSize: "0.9rem",
                              padding: "0.4rem 0.6rem",
                              borderRadius: "4px",
                              transition: "background 0.2s",
                              background: cell.sampling ? "#e3f2fd" : "transparent",
                              borderLeft: cell.sampling
                                ? "3px solid #3498db"
                                : "none"
                            }}
                          >
                            <span style={{ flex: 1, textAlign: "left" }}>
                              Sampling
                            </span>
                            <input
                              type="checkbox"
                              checked={cell.sampling || false}
                              onChange={(e) =>
                                updateCell(docIdx, colIdx, "sampling", e.target.checked)
                              }
                              style={{ margin: 0, cursor: "pointer", transform: "scale(1.2)" }}
                            />
                            <input
                              type="number"
                              min="0"
                              value={cell.samplingQty || ""}
                              onChange={(e) =>
                                updateCell(docIdx, colIdx, "samplingQty", e.target.value)
                              }
                              placeholder="QTY"
                              disabled={!cell.sampling}
                              style={{
                                width: "60px",
                                padding: "0.4rem",
                                border: "1px solid #dcdde1",
                                borderRadius: "4px",
                                textAlign: "center"
                              }}
                            />
                          </label>

                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              fontSize: "0.9rem",
                              padding: "0.4rem 0.6rem",
                              borderRadius: "4px",
                              transition: "background 0.2s",
                              background: cell.detailed ? "#e3f2fd" : "transparent",
                              borderLeft: cell.detailed
                                ? "3px solid #3498db"
                                : "none"
                            }}
                          >
                            <span style={{ flex: 1, textAlign: "left" }}>
                              Detailed
                            </span>
                            <input
                              type="checkbox"
                              checked={cell.detailed || false}
                              onChange={(e) =>
                                updateCell(docIdx, colIdx, "detailed", e.target.checked)
                              }
                              style={{ margin: 0, cursor: "pointer", transform: "scale(1.2)" }}
                            />
                            <div style={{ width: "75px" }}></div>
                          </label>

                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              fontSize: "0.9rem",
                              padding: "0.4rem 0.6rem",
                              borderRadius: "4px",
                              transition: "background 0.2s",
                              background: cell.stocking ? "#e3f2fd" : "transparent",
                              borderLeft: cell.stocking
                                ? "3px solid #3498db"
                                : "none"
                            }}
                          >
                            <span style={{ flex: 1, textAlign: "left" }}>
                              Stocking
                            </span>
                            <input
                              type="checkbox"
                              checked={cell.stocking || false}
                              onChange={(e) =>
                                updateCell(docIdx, colIdx, "stocking", e.target.checked)
                              }
                              style={{ margin: 0, cursor: "pointer", transform: "scale(1.2)" }}
                            />
                            <input
                              type="number"
                              min="0"
                              value={cell.stockingQty || ""}
                              onChange={(e) =>
                                updateCell(docIdx, colIdx, "stockingQty", e.target.value)
                              }
                              placeholder="QTY"
                              disabled={!cell.stocking}
                              style={{
                                width: "60px",
                                padding: "0.4rem",
                                border: "1px solid #dcdde1",
                                borderRadius: "4px",
                                textAlign: "center"
                              }}
                            />
                          </label>
                        </div>
                      </td>
                    ))}

                    <td
                      style={{
                        border: "1px solid #ecf0f1",
                        padding: "0.75rem",
                        verticalAlign: "top",
                        fontWeight: "600",
                        textAlign: "center",
                        color: "#27ae60",
                        fontSize: "1.05rem"
                      }}
                    >
                      {doc.totalPrice}
                    </td>
                  </tr>
                ))}

                {/* Total row */}
                <tr style={{ background: "#f39c12", fontWeight: "600" }}>
                  <td
                    colSpan={sampleProducts.length + 3}
                    style={{
                      border: "1px solid #ecf0f1",
                      padding: "0.75rem",
                      textAlign: "right",
                      color: "white",
                      fontSize: "1.1rem"
                    }}
                  >
                    Grand Total:
                  </td>
                  <td
                    style={{
                      border: "1px solid #ecf0f1",
                      padding: "0.75rem",
                      textAlign: "center",
                      color: "white",
                      fontSize: "1.2rem",
                      fontWeight: "700"
                    }}
                  >
                    {calculateGrandTotal()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
         
          {/* Daily Expenses (with Other Bills) */}
          <table style={{ marginTop: "2rem", width: "100%", maxWidth: 400, marginLeft: 20, borderCollapse: "collapse" }}>
            <caption style={{ captionSide: "top", textAlign: "left", fontSize: "1.2rem", color: "#2c3e50", marginBottom: 8, fontWeight: "bold" }}>
              Daily Expenses
            </caption>
            <tbody>
              {["bata","nightOut","fuel"].map(key => (
                <tr key={key}>
                  <td style={{ padding: 8, borderBottom: "1px solid #ecf0f1" }}>
                    {key === "bata" ? "Daily Bata" : key === "nightOut" ? "Night Out" : "Fuel"}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #ecf0f1" }}>
                    <input
                      type="checkbox"
                      checked={expenses[key]}
                      onChange={() => handleExpenseChange(key)}
                      style={{ transform: "scale(1.2)", cursor: "pointer" }}
                    />
                  </td>
                </tr>
              ))}

              {/* Other Bills dropdown */}
              <tr>
                <td colSpan={2} style={{ padding: 8 }}>
                  <div
                    onClick={() => setOtherBillsOpen(o => !o)}
                    style={{
                      border: "1px solid #dcdde1",
                      borderRadius: 4,
                      padding: 8,
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                  >
                    Other Bills ▾
                  </div>
                  {otherBillsOpen && (
                    <div style={{ padding: 8, border: "1px solid #dcdde1", borderTop: "none" }}>
                      {["parking","highway","other"].map(key => (
                        <div key={key} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                          <input
                            type="checkbox"
                            checked={otherBills[key].checked}
                            onChange={() => toggleOtherBillItem(key)}
                            style={{ transform: "scale(1.2)", marginRight: 8 }}
                          />
                          <span style={{ flex: 1, textTransform: "capitalize" }}>{key}</span>
                          {otherBills[key].checked && (
                            <input
                              type="number"
                              placeholder="Amount"
                              value={otherBills[key].amount}
                              onChange={e => setOtherBillAmount(key, e.target.value)}
                              style={{ width: 80, padding: 4, border: "1px solid #dcdde1", borderRadius: 4 }}
                            />
                          )}
                        </div>
                      ))}

                      <div style={{ marginTop: 16 }}>
                        <label style={{ display: "block", marginBottom: 4 }}>Upload Receipts:</label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={onOtherBillFilesChange}
                        />
                        {otherBillImages.length > 0 && (
                          <ul style={{ marginTop: 8 }}>
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

          {/* Right: Mileage Box */}
<table
  style={{
    marginTop: "2rem",
    width: "100%",
    maxWidth: "400px",
    marginLeft: "20px",
    borderCollapse: "collapse"
  }}
>
  <caption
    style={{
      captionSide: "top",
      textAlign: "left",
      fontSize: "1.2rem",
      color: "#2c3e50",
      marginBottom: "0.5rem",
      fontWeight: "bold"
    }}
  >
    Mileage
  </caption>
  <tbody>
    <tr>
      <td
        style={{
          padding: "0.75rem",
          borderBottom: "20px solid #ecf0f1"
        }}
      >
        Schedule mileage
      </td>
      <td
        style={{
          padding: "0.75rem",
          borderBottom: "20px solid #ecf0f1"
        }}
      >
        <input type="text" placeholder="1000 km" />
      </td>
    </tr>
    <tr>
      <td
        style={{
          padding: "0.75rem",
          borderBottom: "20px solid #ecf0f1"
        }}
      >
        Opening mileage
      </td>
      <td
        style={{
          padding: "0.75rem",
          borderBottom: "20px solid #ecf0f1"
        }}
      >
        <input type="text" />
      </td>
    </tr>
    <tr>
      <td
        style={{
          padding: "0.75rem",
          borderBottom: "20px solid #ecf0f1"
        }}
      >
        Closing mileage
      </td>
      <td
        style={{
          padding: "0.75rem",
          borderBottom: "20px solid #ecf0f1"
        }}
      >
        <input type="text" />
      </td>
    </tr>
    <tr>
      <td
        style={{
          padding: "0.75rem",
          borderBottom: "20px solid #ecf0f1"
        }}
      >
        Private mileage
      </td>
      <td
        style={{
          padding: "0.75rem",
          borderBottom: "20px solid #ecf0f1"
        }}
      >
        <input type="text" />
      </td>
    </tr>
    <tr>
      <td
        style={{
          padding: "0.75rem",
          borderBottom: "20px solid #ecf0f1"
        }}
      >
        Odometer Reading
      </td>
      <td
        style={{
          padding: "0.75rem",
          borderBottom: "20px solid #ecf0f1"
        }}
      >
        <input type="file" accept="image/*" />
      </td>
    </tr>
    <tr>
      <td
        style={{
          padding: "0.75rem",
          borderBottom: "20px solid #ecf0f1"
        }}
      >
        Fuel Pumped
      </td>
      <td
        style={{
          padding: "0.75rem",
          borderBottom: "20px solid #ecf0f1"
        }}
      >
        <input type="text" />
      </td>
    </tr>
    <tr>
      <td
        style={{
          padding: "0.75rem",
          borderBottom: "20px solid #ecf0f1"
        }}
      >
        Cost
      </td>
      <td
        style={{
          padding: "0.75rem",
          borderBottom: "20px solid #ecf0f1"
        }}
      >
        <input type="text" placeholder="Rs." />
      </td>
    </tr>
    <tr>
      <td style={{ padding: "0.75rem" }}>Fuel Bill</td>
      <td style={{ padding: "0.75rem" }}>
        <input type="file" accept="image/*" />
      </td>
    </tr>
  </tbody>
</table>


          {/* REMARK SECTION */}
          <div
            style={{
              marginTop: "2rem",
              marginBottom: "1rem",
              width: "100%",
              maxWidth: "800px",
              marginLeft: "20px"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "0.75rem"
              }}
            >
              <label
                style={{
                  fontWeight: "bold",
                  color: "#2c3e50",
                  fontSize: "1.1rem",
                  marginRight: "1rem"
                }}
              >
                Remark
              </label>
              <div
                style={{
                  height: "1px",
                  flexGrow: 1,
                  background: "#ecf0f1",
                  marginLeft: "0.5rem"
                }}
              ></div>
            </div>

            <textarea
              placeholder="Enter your remarks..."
              style={{
                width: "100%",
                padding: "1rem",
                border: "1px solid #dcdde1",
                borderRadius: "6px",
                fontSize: "1rem",
                outline: "none",
                minHeight: "120px",
                resize: "vertical",
                marginBottom: "1rem",
                fontFamily: "inherit",
                boxSizing: "border-box",
                lineHeight: "1.5"
              }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <input
                type="file"
                accept="image/*"
                style={{
                  padding: "0.5rem",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  border: "1px solid #dcdde1",
                  borderRadius: "4px",
                  background: "#f8f9fa"
                }}
              />
              <span style={{ fontSize: "0.85rem", color: "#7f8c8d" }}>
                Upload order form image
              </span>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              gap: "1rem",
              justifyContent: "center"
            }}
          >
            <button
              onClick={() => setStep(1)}
              style={{
                padding: "0.8rem 1.8rem",
                fontSize: "1rem",
                fontWeight: "600",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.2s",
                background: "#95a5a6",
                color: "white"
              }}
            >
              Back
            </button>
            <button
              onClick={() => alert("Submitted")}
              style={{
                padding: "0.8rem 1.8rem",
                fontSize: "1rem",
                fontWeight: "600",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.2s",
                background: "#3498db",
                color: "white"
              }}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

