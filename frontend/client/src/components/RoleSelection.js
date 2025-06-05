// src/components/RoleSelection.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RoleSelection.css';

export default function RoleSelection() {
  const nav = useNavigate();
  return (
    <div className="role-select-container">
      <div className="role-card">
        <h2>Select Your Role</h2>
        <button onClick={() => nav('/login/manager')}>
          Manager
        </button>
        <button onClick={() => nav('/login/rep')}>
          Medical Rep
        </button>
      </div>
    </div>
  );
}
