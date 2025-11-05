import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    specialty: '',
    range_id: ''
  });

  const [editingDoctor, setEditingDoctor] = useState(null);
  const [ranges, setRanges] = useState([]);

  // Fetch doctors and form data on component mount
  useEffect(() => {
    fetchDoctors();
    fetchFormData();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctors');
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setMessage('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const response = await api.get('/ranges');
      setRanges(response.data.ranges || []);
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
      setMessage('Please enter doctor name');
      return;
    }

    try {
      setSubmitting(true);
      const submitData = {
        name: form.name,
        specialty: form.specialty || undefined,
        range_id: form.range_id || undefined
      };

      if (editingDoctor) {
        // Update existing doctor
        const response = await api.put(`/doctors/${editingDoctor.id}`, submitData);
        setMessage('Doctor updated successfully!');
      } else {
        // Create new doctor
        const response = await api.post('/doctors', submitData);
        setMessage('Doctor created successfully!');
      }

      setForm({ name: '', specialty: '' });
      setEditingDoctor(null);
      fetchDoctors(); // Refresh the list
    } catch (error) {
      console.error('Error saving doctor:', error);
      const errorMsg = error.response?.data?.message || 'Failed to save doctor';
      setMessage(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (doctor) => {
    setForm({
      name: doctor.name,
      specialty: doctor.specialty || '',
      range_id: doctor.range?.id || ''
    });
    setEditingDoctor(doctor);
  };

  const handleCancelEdit = () => {
    setForm({ name: '', specialty: '', range_id: '' });
    setEditingDoctor(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) {
      return;
    }

    try {
      await api.delete(`/doctors/${id}`);
      setMessage('Doctor deleted successfully!');
      fetchDoctors(); // Refresh the list
    } catch (error) {
      console.error('Error deleting doctor:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete doctor';
      setMessage(errorMsg);
    }
  };

  if (loading) {
    return <div className="p-6">Loading doctors...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Doctors Management</h1>

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
          <h2 className="text-xl font-semibold mb-4">
            {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doctor Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter doctor name"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialty (Optional)
              </label>
              <input
                type="text"
                name="specialty"
                value={form.specialty}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter specialty (e.g., Cardiology)"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Range (Sector) (Optional)
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

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {submitting ? (editingDoctor ? 'Updating...' : 'Creating...') : (editingDoctor ? 'Update Doctor' : 'Create Doctor')}
              </button>
              {editingDoctor && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Doctors List */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">All Doctors</h2>

          {doctors.length === 0 ? (
            <p className="text-gray-500">No doctors found.</p>
          ) : (
            <div className="space-y-3">
              {doctors.map(doctor => (
                <div key={doctor.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                  <div className="flex-1">
                    <h3 className="font-medium">{doctor.name}</h3>
                    <p className="text-xs text-gray-500">
                      Specialty: {doctor.specialty || 'N/A'} |
                      Range: {doctor.range?.name || 'N/A'} |
                      Medical Reps: {doctor._count?.users || 0} |
                      Prescriptions: {doctor._count?.prescriptions || 0}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(doctor)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(doctor.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}