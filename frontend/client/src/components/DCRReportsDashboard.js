import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

// Function to transform products from API to expected format
const transformProductsToCategories = (products) => {
  const categories = {};

  products.forEach(product => {
    if (product.variants && product.variants.length > 0) {
      // Use product name as category
      categories[product.name] = product.variants.map(variant => ({
        name: `${product.name} ${variant.strength || ''} ${variant.pack_size || ''}`.trim(),
        samplingPrice: variant.sampling_price || 0,
        stockingPrice: variant.stocking_price || 0,
        detailedPrice: variant.detailed_price || 0
      }));
    }
  });

  return categories;
};

const calculateDoctorTotal = (doctorRow, productCategories) => {
  let total = 0;
  if (!doctorRow || !doctorRow.productData) return total;

  Object.keys(productCategories).forEach(category => {
    if (productCategories[category] && doctorRow.productData[category]) {
      const productsWithPrices = productCategories[category];
      const productStates = doctorRow.productData[category];

      productsWithPrices.forEach((priceInfo, index) => {
        if (index < productStates.length) {
          const stateInfo = productStates[index];
          if (stateInfo.sampling && stateInfo.samplingQty) {
            total += (priceInfo.samplingPrice || 0) * (parseInt(stateInfo.samplingQty) || 0);
          }
          if (stateInfo.stocking && stateInfo.stockingQty) {
            total += (priceInfo.stockingPrice || 0) * (parseInt(stateInfo.stockingQty) || 0);
          }
          if (stateInfo.detailed) {
            total += (priceInfo.detailedPrice || 0);
          }
        }
      });
    }
  });
  return total;
};

const generateSummaryData = (tableData, productCategories) => {
  const summary = [];
  tableData.forEach(doc => {
    const docSummary = {
      doctor: doc.doctor,
      items: [],
      total: calculateDoctorTotal(doc, productCategories),
      managersSelected: (doc.jointVisit && doc.jointVisitManagers)
        ? Object.entries(doc.jointVisitManagers)
            .filter(([key, value]) => value === true)
            .map(([key, value]) => key)
        : []
    };

    if (doc.productData) {
        Object.keys(doc.productData).forEach(category => {
            if (productCategories[category] && doc.productData[category]) {
                doc.productData[category].forEach((productState, index) => {
                    if (index < productCategories[category].length) {
                        const priceInfo = productCategories[category][index];

                        if (productState.sampling && productState.samplingQty) {
                          const qty = parseInt(productState.samplingQty) || 0;
                          const price = priceInfo.samplingPrice || 0;
                          docSummary.items.push({
                            name: `${category} - ${productState.name}`, type: "Sampling", qty: qty, unitPrice: price, lineTotal: qty * price
                          });
                        }
                        if (productState.detailed) {
                          const price = priceInfo.detailedPrice || 0;
                          docSummary.items.push({
                            name: `${category} - ${productState.name}`, type: "Detailed", qty: 1, unitPrice: price, lineTotal: price
                          });
                        }
                        if (productState.stocking && productState.stockingQty) {
                          const qty = parseInt(productState.stockingQty) || 0;
                          const price = priceInfo.stockingPrice || 0;
                          docSummary.items.push({
                            name: `${category} - ${productState.name}`, type: "Stocking", qty: qty, unitPrice: price, lineTotal: qty * price
                          });
                        }
                    }
                });
            }
        });
    }
    // Only add to summary if there are items OR selected managers
    if (docSummary.items.length > 0 || docSummary.managersSelected.length > 0) {
      summary.push(docSummary);
    }
  });
  return summary;
};

const calculateExpensesTotal = (dcr) => {
  let total = 0;
  if (dcr.dailyExpenses) {
    if (dcr.dailyExpenses.bata) total += 50;
    if (dcr.dailyExpenses.nightOut) total += 50;
    if (dcr.dailyExpenses.fuel) total += 50;
  }
  if (dcr.otherBills && dcr.otherBills.details) {
    total += parseFloat(dcr.otherBills.details.parking?.amount || 0);
    total += parseFloat(dcr.otherBills.details.highway?.amount || 0);
    total += parseFloat(dcr.otherBills.details.other?.amount || 0);
  }
  if (dcr.mileage) {
    total += parseFloat(dcr.mileage.cost || 0);
  }
  return total;
};

/**
 * Summary Table Component (Shows prices, totals, and managers for selected items)
 */
const LiveSummaryTable = ({ tableData, productCategories }) => {
  const summaryData = generateSummaryData(tableData, productCategories);

  if (summaryData.length === 0) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center text-gray-500">
        No items or joint visits selected yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {summaryData.map((docSummary, idx) => (
        <div key={idx} className="p-4 border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
          <h4 className="font-bold text-md text-blue-700 mb-1">{docSummary.doctor}</h4>
          {/* Display selected managers */}
          {docSummary.managersSelected.length > 0 && (
            <p className="text-xs text-gray-600 mb-3">
              <span className="font-semibold">Joint Visit with:</span> {docSummary.managersSelected.join(', ')}
            </p>
          )}

          {docSummary.items.length > 0 ? (
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Product</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">Unit Price</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">Quantity</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {docSummary.items.map((item, itemIdx) => (
                  <tr key={itemIdx} className="border-b last:border-b-0">
                    <td className="px-4 py-2 whitespace-nowrap">{item.name}</td>
                    <td className="px-4 py-2">{item.type}</td>
                    <td className="px-4 py-2 text-right">Rs. {item.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right">{item.qty}</td>
                    <td className="px-4 py-2 text-right font-medium">Rs. {item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-300">
                <tr>
                  <td colSpan="4" className="px-4 py-2 text-right font-bold text-gray-800">
                    Total for {docSummary.doctor}:
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-lg text-blue-600">
                    Rs. {docSummary.total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            // If only managers selected but no items
            <p className="text-sm text-gray-500 italic">No products selected for this doctor.</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default function DCRReportsDashboard() {
  const [dcrs, setDcrs] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDCR, setSelectedDCR] = useState(null);
  const [productCategories, setProductCategories] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchDCRs();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products', { params: { limit: 500 } });
        const productsData = response.data.data?.items || [];
        const categories = transformProductsToCategories(productsData);
        setProductCategories(categories);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProductCategories({});
      }
    };
    fetchProducts();
  }, []);

  const fetchDCRs = async () => {
    try {
      const response = await api.get('/dcrs');
      setDcrs(response.data.dcrs);
    } catch (error) {
      console.error('Error fetching DCRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDCR = async (dcrId) => {
    try {
      const response = await api.get(`/dcrs/${dcrId}`);
      setSelectedDCR(response.data.dcr);
    } catch (error) {
      console.error('Error fetching DCR details:', error);
    }
  };

  const handleAddDCR = () => {
    navigate('/DCR_report');
  };

  const handleEditDCR = (dcrId) => {
    // For now, just navigate to the form. In a full implementation, you'd pass the DCR data
    navigate('/DCR_report');
  };

  const handleDeleteDCR = async (dcrId) => {
    if (window.confirm('Are you sure you want to delete this DCR report? This action cannot be undone.')) {
      try {
        await api.delete(`/dcrs/${dcrId}`);
        // Refresh the DCRs list
        fetchDCRs();
        alert('DCR report deleted successfully');
      } catch (error) {
        console.error('Error deleting DCR:', error);
        alert('Failed to delete DCR report');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading DCR reports...</span>
      </div>
    );
  }

  if (selectedDCR) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">DCR Report Details</h1>
          <button
            onClick={() => setSelectedDCR(null)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div><strong>Date:</strong> {formatDate(selectedDCR.date)}</div>
            <div><strong>Rep Name:</strong> {selectedDCR.repName}</div>
            <div><strong>Emp No:</strong> {selectedDCR.empNo}</div>
            <div><strong>Range:</strong> {selectedDCR.range}</div>
            <div><strong>Agency:</strong> {selectedDCR.agency}</div>
            <div><strong>Distributor:</strong> {selectedDCR.distributor}</div>
            <div><strong>Area:</strong> {selectedDCR.area}</div>
            <div><strong>Town:</strong> {selectedDCR.town}</div>
          </div>

          {/* Call Report */}
          {selectedDCR.callReport && selectedDCR.callReport.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">Doctor Call Reports</h3>
              <LiveSummaryTable tableData={selectedDCR.callReport} productCategories={productCategories} />
            </div>
          )}

          {/* Expenses */}
          {selectedDCR.dailyExpenses && (
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">Daily Expenses</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>Bata: {selectedDCR.dailyExpenses.bata ? 'Yes' : 'No'}</div>
                <div>Night Out: {selectedDCR.dailyExpenses.nightOut ? 'Yes' : 'No'}</div>
                <div>Fuel: {selectedDCR.dailyExpenses.fuel ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}

          {/* Other Bills */}
          {selectedDCR.otherBills && selectedDCR.otherBills.details && (
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">Other Bills</h3>
              {Object.entries(selectedDCR.otherBills.details).map(([key, value]) => (
                value.checked && (
                  <div key={key} className="flex justify-between">
                    <span>{key}: Rs. {value.amount}</span>
                  </div>
                )
              ))}
              {selectedDCR.otherBills.images && selectedDCR.otherBills.images.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold">Receipt Images:</h4>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {selectedDCR.otherBills.images.map((image, idx) => (
                      <img
                        key={idx}
                        src={`http://localhost:5001/uploads/dcr/${image}`}
                        alt={`Receipt ${idx + 1}`}
                        className="w-full h-32 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mileage */}
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4">Mileage</h3>
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="px-3 py-2 border-b border-gray-200 text-sm w-1/3">Schedule mileage</td>
                  <td className="px-3 py-2 border-b border-gray-200">{selectedDCR.mileage?.scheduleMileage || 'Not provided'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-b border-gray-200 text-sm w-1/3">Opening mileage</td>
                  <td className="px-3 py-2 border-b border-gray-200">{selectedDCR.mileage?.openingMileage || 'Not provided'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-b border-gray-200 text-sm w-1/3">Closing mileage</td>
                  <td className="px-3 py-2 border-b border-gray-200">{selectedDCR.mileage?.closingMileage || 'Not provided'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-b border-gray-200 text-sm w-1/3">Private mileage</td>
                  <td className="px-3 py-2 border-b border-gray-200">{selectedDCR.mileage?.privateMileage || 'Not provided'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-b border-gray-200 text-sm w-1/3">Odometer Reading</td>
                  <td className="px-3 py-2 border-b border-gray-200">
                    {selectedDCR.odometerReading ? (
                      <img
                        src={`http://localhost:5001/uploads/dcr/${selectedDCR.odometerReading}`}
                        alt="Odometer Reading"
                        className="w-full h-32 object-cover rounded border"
                      />
                    ) : 'Not provided'}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-b border-gray-200 text-sm w-1/3">Fuel Pumped</td>
                  <td className="px-3 py-2 border-b border-gray-200">{selectedDCR.mileage?.fuelPumped || 'Not provided'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-b border-gray-200 text-sm w-1/3">Cost</td>
                  <td className="px-3 py-2 border-b border-gray-200">{selectedDCR.mileage?.cost || 'Not provided'}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border-b border-gray-200 text-sm w-1/3">Fuel Bill</td>
                  <td className="px-3 py-2 border-b border-gray-200">
                    {selectedDCR.fuelBill ? (
                      <img
                        src={`http://localhost:5001/uploads/dcr/${selectedDCR.fuelBill}`}
                        alt="Fuel Bill"
                        className="w-full h-32 object-cover rounded border"
                      />
                    ) : 'Not provided'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Remarks */}
          {selectedDCR.remarks && (
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">Remarks</h3>
              <p>{selectedDCR.remarks}</p>
            </div>
          )}

          {/* Order Form Images */}
          {selectedDCR.orderFormImages && selectedDCR.orderFormImages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">Order Form Images</h3>
              <div className="grid grid-cols-3 gap-4">
                {selectedDCR.orderFormImages.map((image, idx) => (
                  <img
                    key={idx}
                    src={`http://localhost:5001/uploads/dcr/${image}`}
                    alt={`Order Form ${idx + 1}`}
                    className="w-full h-32 object-cover rounded border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-blue-800 text-white rounded-lg flex justify-between items-center">
              <span className="text-xl font-bold">Total (Products):</span>
              <span className="text-2xl font-bold">Rs. {generateSummaryData(selectedDCR.callReport || [], productCategories).reduce((acc, doc) => acc + doc.total, 0).toFixed(2)}</span>
            </div>
            <div className="p-4 bg-green-800 text-white rounded-lg flex justify-between items-center">
              <span className="text-xl font-bold">Total (Expenses):</span>
              <span className="text-2xl font-bold">Rs. {calculateExpensesTotal(selectedDCR).toFixed(2)}</span>
            </div>
            <div className="p-4 bg-gray-800 text-white rounded-lg flex justify-between items-center">
              <span className="text-xl font-bold">Grand Total:</span>
              <span className="text-2xl font-bold">Rs. {(generateSummaryData(selectedDCR.callReport || [], productCategories).reduce((acc, doc) => acc + doc.total, 0) + calculateExpensesTotal(selectedDCR)).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/rep-dashboard')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800">DCR Reports Dashboard</h1>
        </div>
        <button
          onClick={handleAddDCR}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add DCR Form
        </button>
      </div>

      {Object.keys(dcrs).length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No DCR reports found.</p>
          <button
            onClick={handleAddDCR}
            className="mt-4 px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Your First DCR Report
          </button>
        </div>
      ) : (
        Object.entries(dcrs).map(([monthYear, monthDcrs]) => (
          <div key={monthYear} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">{monthYear} DCR Reports</h2>
            <div className="space-y-2">
              {monthDcrs.map((dcr) => (
                <div
                  key={dcr.id}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 cursor-pointer" onClick={() => handleViewDCR(dcr.id)}>
                    <span className="font-semibold">{formatDate(dcr.date)}</span>
                    <span className="ml-4 text-gray-600">Rep: {dcr.repName}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDCR(dcr.id)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEditDCR(dcr.id)}
                      className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDCR(dcr.id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}