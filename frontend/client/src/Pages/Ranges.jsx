import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNotification } from '../components/NotificationPopup';

export default function Ranges() {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();

  // Hardcoded agencies list
  const hardcodedAgencies = [
    'A1', 'A2', 'A3', 'A4', 'A5',
    'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10'
  ];

  const [form, setForm] = useState({
    agency: '',
    range: ''
  });

  // Fetch sectors on component mount
  useEffect(() => {
    fetchSectors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSectors = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/sectors?t=${Date.now()}`);
      console.log('Fetched sectors:', response.data.data?.items);
      setSectors(response.data.data?.items || []);
    } catch (error) {
      console.error('Error fetching sectors:', error);
      showNotification('Failed to load sectors', 'error');
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

    if (!form.agency || !form.range) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    // Check if sector already exists
    const existingSector = sectors.find(s =>
      s.agency === form.agency && s.range === form.range
    );
    
    if (existingSector) {
      showNotification(`Sector with Agency ${form.agency} and Range ${form.range} already exists.`, 'warning');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/admin/sectors', form);

      showNotification('Sector created successfully!', 'success');
      setForm({ agency: '', range: '' });
      fetchSectors(); // Refresh the list
    } catch (error) {
      console.error('Error creating sector:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create sector';
      showNotification(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sector?')) {
      return;
    }

    try {
      await api.delete(`/admin/sectors/${id}`);
      showNotification('Sector deleted successfully!', 'success');
      fetchSectors(); // Refresh the list
    } catch (error) {
      console.error('Error deleting sector:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete sector';
      showNotification(errorMsg, 'error');
    }
  };


  if (loading) {
    return <div className="p-6">Loading ranges...</div>;
  }

  return (
    <div className="p-8 overflow-y-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Manage Sectors</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Add New Sector Form */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Add New Sector</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="range" className="block text-sm font-medium text-gray-700 mb-1">
                Range *
              </label>
              <select
                id="range"
                name="range"
                value={form.range}
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
                Agency *
              </label>
              <select
                id="agency"
                name="agency"
                value={form.agency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select an Agency</option>
                {hardcodedAgencies.map(agency => (
                  <option key={agency} value={agency}>
                    {agency}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Sector'}
            </button>
          </form>
        </div>

        {/* Column 2: List of Existing Sectors */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
             <h2 className="text-xl font-semibold text-gray-700">All Sectors</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agency</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Range</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                  <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sectors.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 px-6 text-center text-gray-500">
                      No sectors found.
                    </td>
                  </tr>
                ) : (
                  sectors.map(sector => (
                    <tr key={sector.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{sector.agency}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{sector.range}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        Users: {sector._count?.users || 0} | Teams: {sector._count?.teams || 0} | Doctors: {sector._count?.doctors || 0} | Distributors: {sector._count?.distributors || 0}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleDelete(sector.id)}
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
      {NotificationComponent}
    </div>
  );
}