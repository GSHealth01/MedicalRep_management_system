import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

export default function ItineraryForm() {
  const navigate = useNavigate();
  const { id, mode } = useParams(); 
  const isViewMode = mode === 'view';
  const isEditMode = !!id && !isViewMode;

  const [formData, setFormData] = useState({
    repName: '',
    distributor: '',
    town: '',
    month: '',
    itinerary: []
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingDisabled, setEditingDisabled] = useState(false);

  const isEditingAllowed = (month) => {
    if (!month) return false;
    
    const currentDate = new Date();
    const [year, monthNum] = month.split('-');
    const monthStartDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    
    // Calculate 5 days before month starts
    const allowedEditDate = new Date(monthStartDate);
    allowedEditDate.setDate(allowedEditDate.getDate() - 5);
    
    // Allow editing if current date is on or after the allowed edit date
    // and before the month starts
    return currentDate >= allowedEditDate && currentDate < monthStartDate;
  };

  useEffect(() => {
    if (isEditMode || isViewMode) {
      fetchItinerary();
    }
  }, [id, mode]);

  useEffect(() => {
    if (!isEditMode && !isViewMode) {
   
      fetchUserDefaults();
    }
  }, []);

  const fetchUserDefaults = async () => {
    try {
      const response = await api.get('/users/profile');
      const user = response.data.user;
      setFormData(prev => ({
        ...prev,
        repName: user.emp_no || '',
        distributor: user.distributor?.name || user.distributor?.distributor_code || ''
      }));
    } catch (error) {
      console.error('Error fetching user defaults:', error);
      alert('Failed to load user defaults. Please check if you are logged in.');
    }
  };

  const fetchItinerary = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/itineraries/${id}`);
      const itinerary = response.data.data;
   
      console.log('Full API Response:', response);
      console.log('Itinerary data:', itinerary);
      console.log('Town field value:', itinerary.town);
      console.log('All itinerary fields:', Object.keys(itinerary));
      console.log('Itinerary entries:', itinerary.entries);
      console.log('First entry:', itinerary.entries?.[0]);
      console.log('Itinerary entries length:', itinerary.entries?.length);
      console.log('Itinerary entries type:', typeof itinerary.entries);
      
      // Debug: Check if the data structure is what we expect
      const formDataToSet = {
        repName: itinerary.repName,
        distributor: itinerary.distributor,
        town: itinerary.town || '',
        month: itinerary.month,
        itinerary: itinerary.entries || []
      };
      
      console.log('Form data to set:', formDataToSet);
      console.log('Itinerary entries structure:', itinerary.entries);
      
      setFormData(formDataToSet);
      
      // Check if editing is allowed for this month
      if (isEditMode) {
        setEditingDisabled(!isEditingAllowed(itinerary.month));
      }
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      alert('Failed to load itinerary');
      navigate('/itineraryList');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target; 
    console.log('Input changed:', name, value);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEntryChange = (index, field, value) => {
    const updatedItinerary = [...formData.itinerary];
    updatedItinerary[index] = { ...updatedItinerary[index], [field]: value };
    setFormData(prev => ({ ...prev, itinerary: updatedItinerary }));
  };

  const addEntry = () => {
    setFormData(prev => ({
      ...prev,
      itinerary: [...prev.itinerary, {
        date: '',
        dayNo: prev.itinerary.length + 1,
        area: '',
        town: '',
        doctorCalls: 0,
        chemistCalls: 0,
        mileage: 0,
        nightOutArea: ''
      }]
    }));
  };

  const removeEntry = (index) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewMode || editingDisabled) return;

    try {
      setSaving(true);
      const payload = { ...formData };
      console.log('Submitting payload:', payload);

      if (isEditMode) {
        await api.put(`/itineraries/${id}`, payload);
        alert('Itinerary updated successfully');
      } else {
        await api.post('/itineraries', payload);
        alert('Itinerary created successfully');
      }

      navigate('/itineraryList');
    } catch (error) {
      console.error('Error saving itinerary:', error);
      alert('Failed to save itinerary');
    } finally {
      setSaving(false);
    }
  };

  const generateMonthDays = () => {
    if (!formData.month) return;

    const [year, month] = formData.month.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const entries = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${formData.month}-${day.toString().padStart(2, '0')}`;
      entries.push({
        date,
        dayNo: day,
        area: '',
        town: '',
        doctorCalls: 0,
        chemistCalls: 0,
        mileage: 0,
        nightOutArea: ''
      });
    }

    setFormData(prev => ({ ...prev, itinerary: entries }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading itinerary...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="w-[2000px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {isViewMode ? 'View Itinerary' : isEditMode ? 'Edit Itinerary' : 'Create Itinerary'}
          </h1>
          <button
            onClick={() => navigate('/itineraryList')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to List
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {!isViewMode && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rep Name *</label>
                  <input
                    type="text"
                    name="repName"
                    value={formData.repName}
                    onChange={handleInputChange}
                    disabled={isViewMode || editingDisabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distributor *</label>
                  <input
                    type="text"
                    name="distributor"
                    value={formData.distributor}
                    onChange={handleInputChange}
                    disabled={isViewMode || editingDisabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Town</label>
                  <input
                    type="text"
                    name="town"
                    value={formData.town}
                    onChange={handleInputChange}
                    disabled={isViewMode || editingDisabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                  <input
                    type="month"
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    disabled={isViewMode || editingDisabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                  />
                </div>
              </>
            )}
          </div>

          {/* Editing Restriction Message */}
          {isEditMode && editingDisabled && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Editing Restricted</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>Editing is only allowed within 5 days before the month starts. This itinerary can no longer be edited.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generate Days Button */}
          {!isViewMode && !editingDisabled && (
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={generateMonthDays}
                disabled={!formData.month}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Generate Days for Month
              </button>
              <button
                type="button"
                onClick={addEntry}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Entry
              </button>
            </div>
          )}

          {/* Itinerary Entries */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Day No</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Area</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Town</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doctor Calls</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Chemist Calls</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mileage</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Night Out Area</th>
                  {!isViewMode && !editingDisabled && <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.itinerary.map((entry, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="date"
                        value={entry.date}
                        onChange={(e) => handleEntryChange(index, 'date', e.target.value)}
                        disabled={isViewMode || editingDisabled}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number"
                        value={entry.dayNo}
                        onChange={(e) => handleEntryChange(index, 'dayNo', parseInt(e.target.value))}
                        disabled={isViewMode || editingDisabled}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="text"
                        value={entry.area}
                        onChange={(e) => handleEntryChange(index, 'area', e.target.value)}
                        disabled={isViewMode || editingDisabled}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="text"
                        value={entry.town}
                        onChange={(e) => handleEntryChange(index, 'town', e.target.value)}
                        disabled={isViewMode || editingDisabled}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number"
                        value={entry.doctorCalls}
                        onChange={(e) => handleEntryChange(index, 'doctorCalls', parseInt(e.target.value))}
                        disabled={isViewMode || editingDisabled}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number"
                        value={entry.chemistCalls}
                        onChange={(e) => handleEntryChange(index, 'chemistCalls', parseInt(e.target.value))}
                        disabled={isViewMode || editingDisabled}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={entry.mileage}
                        onChange={(e) => handleEntryChange(index, 'mileage', parseFloat(e.target.value))}
                        disabled={isViewMode || editingDisabled}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="text"
                        value={entry.nightOutArea}
                        onChange={(e) => handleEntryChange(index, 'nightOutArea', e.target.value)}
                        disabled={isViewMode || editingDisabled}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                      />
                    </td>
                    {!isViewMode && !editingDisabled && (
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeEntry(index)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isViewMode && (
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/itineraryList')}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || editingDisabled}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : isEditMode ? 'Update Itinerary' : 'Create Itinerary'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}