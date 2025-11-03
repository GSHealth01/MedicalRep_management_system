import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Agencies() {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    name: ''
  });

  // Fetch agencies on component mount
  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/agencies');
      setAgencies(response.data.agencies || []);
    } catch (error) {
      console.error('Error fetching agencies:', error);
      setMessage('Failed to load agencies');
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

    if (!form.name) {
      setMessage('Please enter agency name');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/agencies', form);

      setMessage('Agency created successfully!');
      setForm({ name: '' });
      fetchAgencies(); // Refresh the list
    } catch (error) {
      console.error('Error creating agency:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create agency';
      setMessage(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this agency?')) {
      return;
    }

    try {
      await api.delete(`/agencies/${id}`);
      setMessage('Agency deleted successfully!');
      fetchAgencies(); // Refresh the list
    } catch (error) {
      console.error('Error deleting agency:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete agency';
      setMessage(errorMsg);
    }
  };

  if (loading) {
    return <div className="p-6">Loading agencies...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Agencies Management</h1>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('successfully')
            ? 'bg-green-100 text-green-700 border border-green-400'
            : 'bg-red-100 text-red-700 border border-red-400'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Add New Agency</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agency Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter agency name"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Agency'}
            </button>
          </form>
        </div>

        {/* Agencies List */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">All Agencies</h2>

          {agencies.length === 0 ? (
            <p className="text-gray-500">No agencies found.</p>
          ) : (
            <div className="space-y-3">
              {agencies.map(agency => (
                <div key={agency.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                  <div>
                    <h3 className="font-medium">{agency.name}</h3>
                    <p className="text-xs text-gray-500">
                      Ranges: {agency._count?.ranges || 0} | Users: {agency._count?.users || 0} | Distributors: {agency._count?.distributors || 0}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(agency.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}