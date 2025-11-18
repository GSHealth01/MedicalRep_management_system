import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { forgotPasswordStep2 } from '../services/api';

export default function ForgotPasswordStep2() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, securityQuestion, empNo } = location.state || {};

  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if no state data
  React.useEffect(() => {
    if (!userId || !securityQuestion) {
      navigate('/forgot-password/step1');
    }
  }, [userId, securityQuestion, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!answer.trim()) {
      setError('Please enter your answer.');
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPasswordStep2(userId, answer.trim());
      // Navigate to step 3
      navigate('/forgot-password/step3', {
        state: {
          userId: userId,
          empNo: empNo
        }
      });
    } catch (err) {
      const errorMsg = err?.msg || err?.message || 'Failed to verify answer. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/login');
  };

  if (!userId || !securityQuestion) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Reset your password</h1>
          <p className="text-gray-600">Answer your security question</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Question
            </label>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-800">{securityQuestion}</p>
            </div>
          </div>

          <div>
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
              Answer
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

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Verifying...' : 'Submit'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/forgot-password/step1')}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Back to Staff Number
          </button>
        </div>
      </div>
    </div>
  );
}