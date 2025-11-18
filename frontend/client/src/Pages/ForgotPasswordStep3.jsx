import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { forgotPasswordStep3 } from '../services/api';

export default function ForgotPasswordStep3() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, empNo } = location.state || {};

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect if no state data
  React.useEffect(() => {
    if (!userId) {
      navigate('/forgot-password/step1');
    }
  }, [userId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPasswordStep3(userId, newPassword, confirmPassword);
      setSuccess(true);
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const errorMsg = err?.msg || err?.message || 'Failed to reset password. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  if (!userId) {
    return null; // Will redirect in useEffect
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Password Reset Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecting to login page in 3 seconds...
            </p>
            <button
              onClick={handleLogin}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              Log In Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset password</h1>
          <p className="text-gray-600">Enter your new password</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Enter New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Re-type Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Resetting...' : 'Apply Change'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleLogin}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}