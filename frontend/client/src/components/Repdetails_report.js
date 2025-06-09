import React, { useState, useEffect } from "react";
import "./Repdetails_report.css";
import { doctors } from "../data/doctors";
import { sampleDoctorProducts } from "../data/sampleDoctorProducts";

export default function Repdetails_report() {
  const [step, setStep] = useState(1);

  // ─── STEP 1 STATE ─────────────────────────────────────────────────────────
  const [date, setDate]             = useState("");
  const [range, setRange]           = useState("");
  const [agency, setAgency]         = useState("");
  const [repName, setRepName]       = useState("");
  const [empNo, setEmpNo]           = useState("");
  const [distributor, setDistributor] = useState("");
  const [area, setArea]             = useState("");
  const [town, setTown]             = useState("");
  const [selectedDoctors, setSelectedDoctors]   = useState([]);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  // toggle a doctor in/out of the selected list
  const toggleDoctor = doc => {
    setSelectedDoctors(prev =>
      prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]
    );
  };

  // close dropdown if you click outside
  useEffect(() => {
    const onClick = e => {
      if (showDoctorDropdown && !e.target.closest("#doctor-dropdown")) {
        setShowDoctorDropdown(false);
      }
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

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="form-container">
      {/* ─── STEP 1 ───────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="form-step">
          <h2>Step 1 – Rep Details</h2>

          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </label>

          <label>
            Range
            <input
              type="text"
              placeholder="Enter Range"
              value={range}
              onChange={e => setRange(e.target.value)}
            />
          </label>

          <label>
            Agency
            <input
              type="text"
              placeholder="Enter Agency"
              value={agency}
              onChange={e => setAgency(e.target.value)}
            />
          </label>

          <label>
            Rep Name
            <input
              type="text"
              placeholder="Enter Rep Name"
              value={repName}
              onChange={e => setRepName(e.target.value)}
            />
          </label>

          <label>
            Emp No
            <input
              type="text"
              placeholder="Enter Emp No"
              value={empNo}
              onChange={e => setEmpNo(e.target.value)}
            />
          </label>

          <label>
            Distributor
            <input
              type="text"
              placeholder="Enter Distributor"
              value={distributor}
              onChange={e => setDistributor(e.target.value)}
            />
          </label>

          <div className="field-row">
            <label>
              Area
              <input
                type="text"
                placeholder="Enter Area"
                value={area}
                onChange={e => setArea(e.target.value)}
              />
            </label>
            <label>
              Town
              <input
                type="text"
                placeholder="Enter Town"
                value={town}
                onChange={e => setTown(e.target.value)}
              />
            </label>
          </div>

          <label>
            Doctor
            <div
              id="doctor-dropdown"
              className="dropdown-container"
              onClick={() => setShowDoctorDropdown(v => !v)}
            >
              <div className="dropdown-input">
                {selectedDoctors.length > 0
                  ? selectedDoctors.join(", ")
                  : "Select Doctor(s)"}
                <span className="dropdown-arrow">▾</span>
              </div>
              {showDoctorDropdown && (
                <div className="dropdown-list">
                  {doctors.map(doc => (
                    <label key={doc} className="dropdown-item">
                      <input
                        type="checkbox"
                        checked={selectedDoctors.includes(doc)}
                        onChange={e => {
                          e.stopPropagation();
                          toggleDoctor(doc);
                        }}
                      />
                      {doc}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </label>

          <button
            className="next-button"
            onClick={() => setStep(2)}
            disabled={!step1Valid}
          >
            Next
          </button>
        </div>
      )}

      {/* ─── STEP 2 ───────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="form-step">
          <h2>Step 2 – Daily Call Report</h2>
          <table className="doctor-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Doctor</th>
                {sampleDoctorProducts[0]?.rows.map((r, i) => (
                  <th key={i}>{r.productName}</th>
                ))}
                <th>Total Price</th>
              </tr>
            </thead>
            <tbody>
              {sampleDoctorProducts.map((doc, rowIndex) => (
                <tr key={rowIndex}>
                  <td>{rowIndex + 1}</td>
                  <td>{doc.doctor}</td>
                  {doc.rows.map((cell, i) => (
                    <td key={i}>
                      <div className="cell-selection">
                        <div className="selection-row">
                          <label>
                            <input type="checkbox" /> Sampling
                          </label>
                          <input
                            type="number"
                            placeholder="Qty"
                            className="selection-qty"
                          />
                        </div>
                        <div className="selection-row">
                          <label>
                            <input type="checkbox" /> Detailed
                          </label>
                        </div>
                        <div className="selection-row">
                          <label>
                            <input type="checkbox" /> Stocking
                          </label>
                          <input
                            type="number"
                            placeholder="Qty"
                            className="selection-qty"
                          />
                        </div>
                      </div>
                    </td>
                  ))}
                  <td>{doc.totalPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="button-row">
            <button onClick={() => setStep(1)}>Back</button>
            <button onClick={() => {/* TODO: submit handler */}}>
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
