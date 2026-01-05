import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Ranges() {
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Hardcoded agencies list
  const agencies = [
    { id: 'A1', name: 'A1' },
    { id: 'A2', name: 'A2' },
    { id: 'A3', name: 'A3' },
    { id: 'B1', name: 'B1' },
    { id: 'B2', name: 'B2' },
    { id: 'B3', name: 'B3' },
    { id: 'B4', name: 'B4' },
    { id: 'B5', name: 'B5' },
    { id: 'B6', name: 'B6' }
  ];

  const [form, setForm] = useState({
    name: '',
    agency_id: ''
  });

  // Fetch ranges on component mount
  useEffect(() => {
    fetchRanges();
  }, []);

  const fetchRanges = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ranges');
      setRanges(response.data.ranges || []);
    } catch (error) {
      console.error('Error fetching ranges:', error);
      setMessage('Failed to load ranges');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!form.name || !form.agency_id) {
      setMessage('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/ranges', form);

      setMessage('Range created successfully!');
      setForm({ name: '', agency_id: '' });
      fetchRanges(); // Refresh the list
    } catch (error) {
      console.error('Error creating range:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create range';
      setMessage(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this range?')) {
      return;
    }

    try {
      await api.delete(`/ranges/${id}`);
      setMessage('Range deleted successfully!');
      fetchRanges(); // Refresh the list
    } catch (error) {
      console.error('Error deleting range:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete range';
      setMessage(errorMsg);
    }
  };

  if (loading) {
    return <div className="p-6">Loading ranges...</div>;
  }

  return (
    <div className="p-8 overflow-y-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Manage Ranges</h1>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('successfully')
            ? 'bg-green-100 text-green-700 border border-green-400'
            : 'bg-red-100 text-red-700 border border-red-400'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Add New Range Form */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Add New Range</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="range-name" className="block text-sm font-medium text-gray-700 mb-1">
                Range Name *
              </label>
              <select
                id="range-name"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Range</option>
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
            </div>

            <div>
              <label htmlFor="agency" className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Agency *
              </label>
              <select
                id="agency"
                name="agency_id"
                value={form.agency_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select an Agency</option>
                {agencies.map(agency => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Range'}
            </button>
          </form>
        </div>

        {/* Column 2: List of Existing Ranges */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
             <h2 className="text-xl font-semibold text-gray-700">All Ranges</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Range</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ranges.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-4 px-6 text-center text-gray-500">
                      No ranges found.
                    </td>
                  </tr>
                ) : (
                  ranges.map(range => (
                    <tr key={range.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{range.name}</div>
                        <div className="text-sm text-gray-500">Agency: {range.agency?.name || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        Users: {range._count?.users || 0} | Teams: {range._count?.teams || 0}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleDelete(range.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}