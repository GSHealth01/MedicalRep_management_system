// src/components/LoginPage.js
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './LoginPage.css';
import logo from '../assets/gsh.logo.png';
import { API } from '../services/api';

export default function LoginPage() {
  const { role } = useParams(); // "manager" or "rep"
  const isManager = role === 'manager';

  const [empId, setEmpId]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // EMP ID validation: must start with '0' + 5 digits
    if (!/^0\d{5}$/.test(empId)) {
      setError('EMP ID must start with 0 followed by 5 digits (e.g. 044555).');
      return;
    }

    // Password complexity: at least 7 chars, one uppercase, one lowercase, one digit
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/.test(password)) {
      setError(
        'Password must be at least 7 characters and include uppercase, lowercase, and a digit.'
      );
      return;
    }

    try {
      const res = await API.post('/auth/login', { empId, password, role });
      localStorage.setItem('token', res.data.token);
      if (isManager) navigate('/manager-dashboard');
      else         navigate('/add-rep');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Login failed. Check your EMP ID and password.'
      );
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <img src={logo} alt="Logo" className="login-logo" />
        <h2>{isManager ? 'Manager Login' : 'Medical Rep Login'}</h2>
        {error && <div className="login-error">{error}</div>}

        <label htmlFor="empId">EMP ID<br/>
          <input
            id="empId"
            type="text"
            value={empId}
            onChange={e => setEmpId(e.target.value)}
            placeholder="Enter the EMP No"
            pattern="0\d{5}"
            title="Must start with 0 followed by 5 digits"
            required
          />
        </label>

        <label htmlFor="password">Password<br/>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter the Password"
            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}"
            title="Min 7 chars, include uppercase, lowercase, and a digit"
            required
          />
        </label>

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

