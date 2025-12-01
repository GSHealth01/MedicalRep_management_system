import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPasswordStep1, forgotPasswordStep2 } from '../services/api';

export default function ForgotPasswordStep1() {
  const navigate = useNavigate();
  const [empNo, setEmpNo] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); 
  const [userData, setUserData] = useState(null);

  const handleEmpNoSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!empNo.trim()) {
      setError('Please enter your Staff Number.');
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPasswordStep1(empNo.trim());
      setUserData({
        userId: response.userId,
        empNo: empNo.trim()
      });
      setStep(2);
    } catch (err) {
      const errorMsg = err?.msg || err?.message || 'Failed to verify employee number. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Please enter the 4-digit code.');
      return;
    }

    setVerifyingCode(true);
    try {
      const response = await forgotPasswordStep2(userData.userId, code.trim());
      // Navigate to step 3 with the userId
      navigate('/forgot-password/step3', {
        state: {
          userId: userData.userId,
          empNo: userData.empNo
        }
      });
    } catch (err) {
      const errorMsg = err?.msg || err?.message || 'Invalid code. Please try again.';
      setError(errorMsg);
    } finally {
      setVerifyingCode(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset your password</h1>
          <p className="text-gray-600">
            {step === 1 ? 'Enter your Employee Number to continue' : 'Enter the 4-digit code sent to your email'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleEmpNoSubmit} className="space-y-6">
            <div>
              <label htmlFor="empNo" className="block text-sm font-medium text-gray-700 mb-2">
                Staff Number
              </label>
              <input
                id="empNo"
                type="text"
                value={empNo}
                onChange={(e) => setEmpNo(e.target.value)}
                placeholder="Enter your staff number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                4-Digit Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter the 4-digit code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Check your email for the 4-digit code.</p>
            </div>

            <button
              type="submit"
              disabled={verifyingCode}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {verifyingCode ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}