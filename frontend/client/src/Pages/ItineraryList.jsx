import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useConfirm } from '../components/ConfirmDialog';

export default function ItineraryList() {
  const navigate = useNavigate();
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showConfirm, ConfirmDialogComponent } = useConfirm();

  useEffect(() => {
    fetchItineraries();
  }, []);

  const fetchItineraries = async () => {
    try {
      console.log('Fetching itineraries...');
      const response = await api.get('/itineraries');
      console.log('Fetch response:', response);
      setItineraries(response.data.data || []);
    } catch (error) {
      console.error('Error fetching itineraries:', error);
      // For now, show empty list if API fails
      setItineraries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (itinerary) => {
    // Navigate to view itinerary with ID
    navigate(`/itineraryForm/${itinerary.id}/view`);
  };

  const handleEdit = (itinerary) => {
    // Navigate to edit itinerary with ID
    navigate(`/itineraryForm/${itinerary.id}/edit`);
  };

  const handleDownload = async (itinerary) => {
    try {
      // Use the authenticated API service to download the file
      const response = await api.get(`/itineraries/${itinerary.id}/excel`, {
        responseType: 'blob' // Important: tell axios to handle binary data
      });
      
      // Create a download link for the Excel file
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `itinerary-${itinerary.month}-${itinerary.user?.emp_no || 'export'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again or contact support.');
    }
  };

  const handleDelete = async (itinerary) => {
    const confirmed = await showConfirm({
      title: "Delete Itinerary",
      message: `Are you sure you want to delete the itinerary for ${itinerary.month}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger"
    });
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/itineraries/${itinerary.id}`);
      showSuccessToast('Itinerary deleted successfully');
      fetchItineraries(); // Refresh the list
    } catch (error) {
      console.error('Delete failed:', error);
      showErrorToast('Failed to delete itinerary');
    }
  };

  // Simple toast notification functions
  const showSuccessToast = (message) => {
    showToast(message, 'success');
  };

  const showErrorToast = (message) => {
    showToast(message, 'error');
  };

  const showToast = (message, type) => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add styles
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.color = 'white';
    toast.style.fontWeight = '500';
    toast.style.fontSize = '14px';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    
    // Set background color based on type
    if (type === 'success') {
      toast.style.backgroundColor = '#10b981';
    } else {
      toast.style.backgroundColor = '#ef4444';
    }
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading itineraries...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Itinerary Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/rep-dashboard')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate('/itineraryForm')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Itinerary
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distributor
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {itineraries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium">No itineraries found</p>
                        <p className="text-sm text-gray-400 mt-1">Create your first itinerary to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  itineraries.map((itinerary, index) => (
                    <tr key={itinerary.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(itinerary.createdAt || new Date().toISOString())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          itinerary.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {itinerary.status === 'completed' ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {itinerary.month ? new Date(itinerary.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {itinerary.distributor || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleView(itinerary)}
                            className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded text-sm font-medium border border-blue-600 hover:bg-blue-50"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(itinerary)}
                            className="text-orange-600 hover:text-orange-900 px-3 py-1 rounded text-sm font-medium border border-orange-600 hover:bg-orange-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDownload(itinerary)}
                            className="text-green-600 hover:text-green-900 px-3 py-1 rounded text-sm font-medium border border-green-600 hover:bg-green-50"
                            title="Download Itinerary"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => handleDelete(itinerary)}
                            className="text-red-600 hover:text-red-900 px-3 py-1 rounded text-sm font-medium border border-red-600 hover:bg-red-50"
                            title="Delete Itinerary"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ConfirmDialogComponent />
    </div>
  );
}