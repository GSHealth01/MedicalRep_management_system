import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [ranges, setRanges] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    range_id: '',
    agency_id: ''
  });

  // Fetch teams and form data on component mount
  useEffect(() => {
    fetchTeams();
    fetchFormData();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/teams');
      setTeams(response.data.teams || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setMessage('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const response = await api.get('/teams/formdata');
      setRanges(response.data.ranges || []);
      setAgencies(response.data.agencies || []);
    } catch (error) {
      console.error('Error fetching form data:', error);
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
      setMessage('Please enter team name');
      return;
    }

    try {
      setSubmitting(true);
      const submitData = {
        name: form.name,
        range_id: form.range_id || undefined,
        agency_id: form.agency_id || undefined
      };

      const response = await api.post('/teams', submitData);

      setMessage('Team created successfully!');
      setForm({ name: '', range_id: '', agency_id: '' });
      fetchTeams(); // Refresh the list
    } catch (error) {
      console.error('Error creating team:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create team';
      setMessage(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team?')) {
      return;
    }

    try {
      await api.delete(`/teams/${id}`);
      setMessage('Team deleted successfully!');
      fetchTeams(); // Refresh the list
    } catch (error) {
      console.error('Error deleting team:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete team';
      setMessage(errorMsg);
    }
  };

  if (loading) {
    return <div className="p-6">Loading teams...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Teams Management</h1>

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
          <h2 className="text-xl font-semibold mb-4">Add New Team</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter team name"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Range (Optional)
              </label>
              <select
                name="range_id"
                value={form.range_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a range (optional)</option>
                {ranges.map(range => (
                  <option key={range.id} value={range.id}>
                    {range.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agency (Optional)
              </label>
              <select
                name="agency_id"
                value={form.agency_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an agency (optional)</option>
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
              {submitting ? 'Creating...' : 'Create Team'}
            </button>
          </form>
        </div>

        {/* Teams List */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">All Teams</h2>

          {teams.length === 0 ? (
            <p className="text-gray-500">No teams found.</p>
          ) : (
            <div className="space-y-3">
              {teams.map(team => (
                <div key={team.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                  <div>
                    <h3 className="font-medium">{team.name}</h3>
                    <p className="text-xs text-gray-500">
                      Range: {team.range?.name || 'N/A'} | Agency: {team.agency?.name || 'N/A'} | Users: {team._count?.users || 0}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(team.id)}
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