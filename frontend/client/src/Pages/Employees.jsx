import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Employees() {
  const [formData, setFormData] = useState({
    agencies: [],
    ranges: [],
    teams: [],
    distributors: []
  });

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    emp_no: '',
    designation: '',
    join_date: '',
    birthday: '',
    agency_id: '',
    range_id: '',
    team_id: '',
    distributor_id: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch form data on component mount
  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/formdata');
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching form data:', error);
      setMessage('Failed to load form data');
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

    // Basic validation
    if (!form.email || !form.password || !form.name || !form.emp_no || !form.designation) {
      setMessage('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/users', form);

      setMessage('Employee created successfully!');
      // Reset form
      setForm({
        email: '',
        password: '',
        name: '',
        emp_no: '',
        designation: '',
        join_date: '',
        birthday: '',
        agency_id: '',
        range_id: '',
        team_id: '',
        distributor_id: ''
      });
    } catch (error) {
      console.error('Error creating employee:', error);
      const errorMsg = error.response?.data?.message || 'Failed to create employee';
      setMessage(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading form data...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Employee</h1>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('successfully')
            ? 'bg-green-100 text-green-700 border border-green-400'
            : 'bg-red-100 text-red-700 border border-red-400'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Employee Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee Number *
            </label>
            <input
              type="text"
              name="emp_no"
              value={form.emp_no}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Designation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Designation *
            </label>
            <select
              name="designation"
              value={form.designation}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Designation</option>
              <option value="MEDICAL_REP">Medical Representative</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Join Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Join Date
            </label>
            <input
              type="date"
              name="join_date"
              value={form.join_date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Birthday */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birthday
            </label>
            <input
              type="date"
              name="birthday"
              value={form.birthday}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Agency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agency
            </label>
            <select
              name="agency_id"
              value={form.agency_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Agency</option>
              {formData.agencies.map(agency => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Range
            </label>
            <select
              name="range_id"
              value={form.range_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Range</option>
              {formData.ranges.map(range => (
                <option key={range.id} value={range.id}>
                  {range.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team
            </label>
            <select
              name="team_id"
              value={form.team_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Team</option>
              {formData.teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.team_name}
                </option>
              ))}
            </select>
          </div>

          {/* Distributor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Distributor
            </label>
            <select
              name="distributor_id"
              value={form.distributor_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Distributor</option>
              {formData.distributors.map(distributor => (
                <option key={distributor.id} value={distributor.id}>
                  {distributor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {submitting ? 'Creating Employee...' : 'Create Employee'}
          </button>
        </div>
      </form>
    </div>
  );
}