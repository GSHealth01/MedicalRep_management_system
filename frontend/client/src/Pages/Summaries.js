// src/components/SummariesPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Summaries.css';

export default function SummariesPage() {
  const navigate = useNavigate();

  return (
    <div className="summaries-page">
      <h1 className="summaries-title">Summaries Page</h1>

      <div className="summaries-grid">
        <div
          className="summary-card"
          onClick={() => navigate('/summaries/stocking')}
        >
          Stocking Summaries
        </div>
        <div
          className="summary-card"
          onClick={() => navigate('/summaries/expenses')}
        >
          Expenses Summaries
        </div>
        <div
          className="summary-card"
          onClick={() => navigate('/summaries/remark')}
        >
          Remark Summaries
        </div>
        <div
          className="summary-card"
          onClick={() => navigate('/summaries/sample')}
        >
          Sample Summaries
        </div>
        <div
          className="summary-card"
          onClick={() => navigate('/summaries/doctor-calls')}
        >
          Doctor Call Summaries
        </div>
        <div
          className="summary-card"
          onClick={() => navigate('/summaries/chemist-calls')}
        >
          Chemist Call Summaries
        </div>
      </div>

      <div className="back-button-container">
        <button className="back-button" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    </div>
  );
}
