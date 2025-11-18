import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPasswordStep1, forgotPasswordStep2 } from '../services/api';

export default function ForgotPasswordStep1() {
  const navigate = useNavigate();
  const [empNo, setEmpNo] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingAnswer, setVerifyingAnswer] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 = enter empNo, 2 = enter answer
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
        securityQuestion: response.securityQuestion,
        empNo: empNo.trim()
      });
      setStep(2);
    } catch (err) {
      const errorMsg = err?.msg || err?.message || 'Failed to verify staff number. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!answer.trim()) {
      setError('Please enter your answer.');
      return;
    }

    setVerifyingAnswer(true);
    try {
      const response = await forgotPasswordStep2(userData.userId, answer.trim());
      // Navigate to step 3 with the userId
      navigate('/forgot-password/step3', {
        state: {
          userId: userData.userId,
          empNo: userData.empNo
        }
      });
    } catch (err) {
      const errorMsg = err?.msg || err?.message || 'Incorrect answer. Please try again.';
      setError(errorMsg);
    } finally {
      setVerifyingAnswer(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset your password</h1>
          <p className="text-gray-600">
            {step === 1 ? 'Enter your Staff Number to continue' : 'Answer your security question'}
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
              {loading ? 'Checking...' : 'Get Question'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAnswerSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Security Question
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800">
                {userData?.securityQuestion}
              </div>
            </div>

            <div>
              <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer
              </label>
              <input
                id="answer"
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter your answer"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={verifyingAnswer}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {verifyingAnswer ? 'Verifying...' : 'Verify Answer'}
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