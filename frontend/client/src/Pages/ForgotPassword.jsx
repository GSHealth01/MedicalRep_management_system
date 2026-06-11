import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPasswordCheckEmail, forgotPasswordVerifyEmployee, forgotPasswordReset } from '../services/api';
import logo from '../assets/gsh.logo.png';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [empNo, setEmpNo] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await forgotPasswordCheckEmail(email.trim());
      setStep(2);
    } catch (err) {
      setError(err?.msg || err?.message || 'Email not found in our records.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmpNoSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!empNo.trim()) {
      setError('Please enter your employee number.');
      return;
    }
    setLoading(true);
    try {
      await forgotPasswordVerifyEmployee(email.trim(), empNo.trim());
      setStep(3);
    } catch (err) {
      setError(err?.msg || err?.message || 'Invalid Employee Number for this email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
      await forgotPasswordReset(email.trim(), empNo.trim(), newPassword, confirmPassword);
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setError(err?.msg || err?.message || 'Reset failed. Check your employee number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <img src={logo} alt="GSH Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">Password Recovery</h1>
          <p className="text-gray-500 text-sm mt-2">
            {step === 1 && "Start by entering your registered email"}
            {step === 2 && "Great! Now enter your employee number"}
            {step === 3 && "Finally, set your new account password"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded">
            {success}
          </div>
        )}

        {!success && (
          <>
            {step === 1 && (
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. name@gsh.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:bg-gray-400"
                >
                  {loading ? 'Verifying...' : 'Next Step'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleEmpNoSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Employee Number</label>
                  <input
                    type="text"
                    value={empNo}
                    onChange={(e) => setEmpNo(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter your staff ID"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:bg-gray-400"
                  >
                    {loading ? 'Verifying...' : 'Continue'}
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Repeat password"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:bg-gray-400"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold hover:underline"
          >
            Return to Login Page
          </button>
        </div>
      </div>
    </div>
  );
}
