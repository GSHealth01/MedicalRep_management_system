import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import logo from '../assets/gsh.logo.png'; // replace with your actual logo path

export default function LoginPage() {
  const navigate = useNavigate();

  // local state for the three fields and any validation error
  const [role, setRole]         = useState('');
  const [empId, setEmpId]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // 1) Make sure a role is selected
    if (!role) {
      setError('Please select your role.');
      return;
    }

    // 2) EMP ID validation: must start with '0' followed by exactly 5 digits
    if (!/^0\d{5}$/.test(empId)) {
      setError('EMP ID must start with 0 and have 5 digits (e.g. 044555).');
      return;
    }

    // 3) Password complexity: ≥7 chars, at least one uppercase, one lowercase, one digit
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/.test(password)) {
      setError(
        'Password must be at least 7 characters and include uppercase, lowercase, and a digit.'
      );
      return;
    }

    // --- At this point, all validations have passed ---
    // Simulate a successful login (replace with your real API call):
    // e.g. const res = await API.post('/auth/login', { role, empId, password });
    // localStorage.setItem('token', res.data.token);
    localStorage.setItem('token', 'dummy-token');

    // Redirect based on selected role
    if (role === 'manager') {
      navigate('/manager-dashboard');
    } else {
      navigate('/rep-dashboard');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        {/* Company logo at top */}
        <img src={logo} alt="Logo" className="login-logo" />

        <h2>User Login</h2>

        {/* Any validation errors appear here */}
        {error && <div className="login-error">{error}</div>}

        {/* 1) Select Your Role */}
        <label htmlFor="role">Select your Role<br/>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="">– select –</option>
            <option value="manager">Manager</option>
            <option value="rep">Medical Rep</option>
          </select>
        </label>

        {/* 2) Username (EMP ID) */}
        <label htmlFor="empId">Username (EMP ID)<br/>
          <input
            id="empId"
            type="text"
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            placeholder="Enter your Employee ID"
            pattern="0\d{5}"
            title="Must start with 0 and have 5 digits"
            required
          />
        </label>

        {/* 3) Password */}
        <label htmlFor="password">Password<br/>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter the password"
            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}"
            title="At least 7 chars, including uppercase, lowercase, and a digit"
            required
          />
        </label>

        {/* Submit button */}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
