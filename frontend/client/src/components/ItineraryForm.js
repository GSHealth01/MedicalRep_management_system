// src/components/ItineraryForm.js
import React, { useState, useEffect } from 'react';
import './ItineraryForm.css';
import { distributors } from '../data/distributors';
import { API } from '../services/api';

export default function ItineraryForm() {
  const [repName, setRepName]         = useState('');
  const [distributor, setDistributor] = useState('');
  const [month, setMonth]             = useState('2025-04');
  const [itinerary, setItinerary]     = useState([]);
  const [daysInMonth, setDaysInMonth] = useState(0);

  // rebuild rows whenever month changes
  useEffect(() => {
    if (!month) return;
    const [y, m] = month.split('-').map(n => +n);
    const dim = new Date(y, m, 0).getDate();
    setDaysInMonth(dim);

    const rows = Array.from({ length: dim }, (_, i) => ({
      date:         `${month}-${String(i+1).padStart(2,'0')}`,
      dayNo:        i+1,
      area:         '',
      doctorCalls:  '',
      chemistCalls: '',
      mileage:      '',
      nightOutArea: ''
    }));
    setItinerary(rows);
  }, [month]);

  const updateRow = (idx, field, value) => {
    setItinerary(rows => {
      const copy = [...rows];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = { repName, distributor, month, itinerary };
    try {
      await API.post('/itineraries', payload);
      alert('Itinerary saved!');
    } catch {
      alert('Save failed');
    }
  };

  const minDate = `${month}-01`;
  const maxDate = `${month}-${String(daysInMonth).padStart(2,'0')}`;

  return (
    <form className="itinerary-form" onSubmit={handleSubmit}>
      <h2>Monthly Itinerary Planner</h2>

      <div className="top-fields">
        <label>
          Rep Name
          <input
            type="text"
            value={repName}
            onChange={e => setRepName(e.target.value)}
            required
          />
        </label>

        <label>
          Distributor
          <select
            value={distributor}
            onChange={e => setDistributor(e.target.value)}
            required
          >
            <option value="">– select –</option>
            {distributors.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>

        <label>
          Month
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            min="2025-01"
            required
          />
        </label>
      </div>

      <table className="itinerary-table">
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
          {itinerary.map((row, i) => (
            <tr key={i}>
              <td>
                <input
                  type="date"
                  value={row.date}
                  min={minDate}
                  max={maxDate}
                  onChange={e => updateRow(i, 'date', e.target.value)}
                  required
                />
              </td>
              <td>{row.dayNo}</td>
              <td>
                <input
                  type="text"
                  value={row.area}
                  onChange={e => updateRow(i, 'area', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  value={row.doctorCalls}
                  onChange={e => updateRow(i, 'doctorCalls', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  value={row.chemistCalls}
                  onChange={e => updateRow(i, 'chemistCalls', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  value={row.mileage}
                  onChange={e => updateRow(i, 'mileage', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  placeholder="Overnight area"
                  value={row.nightOutArea}
                  onChange={e => updateRow(i, 'nightOutArea', e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="submit">Save Itinerary</button>
    </form>
  );
}

