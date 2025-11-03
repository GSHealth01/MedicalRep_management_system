import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import logo from '../assets/gsh.logo.png';
import { useAuth } from '../context/AuthContext'; 

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      // login() comes from AuthContext; it calls POST /auth/signin and stores tokens/user
      const user = await login({ email, password });

      // If ADMIN → admin portal
      const designation = String(user?.designation || '').toUpperCase();
      if (designation === 'ADMIN') {
        navigate('/admin/portal', { replace: true });
      } else {
        // Regular users → rep dashboard
        navigate('/rep-dashboard', { replace: true });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <img src={logo} alt="Logo" className="login-logo" />
        <h2>User Login</h2>

        {error && <div className="login-error">{error}</div>}

        <label htmlFor="email">
          Email<br />
          <input
            id="email"
            type="email"
            placeholder="admin@example.com"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label htmlFor="password">
          Password<br />
          <div className="password-row">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              className="linklike"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
