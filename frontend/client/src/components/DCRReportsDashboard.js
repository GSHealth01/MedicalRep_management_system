import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/gsh.logo.png';
import { FaBars, FaTimes, FaSignOutAlt, FaUsers } from 'react-icons/fa';
import './RepDashboard.css';

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
          // Only stocking/wholeale has quantity and price
          if (stateInfo.stocking && stateInfo.stockingQty) {
            total += (priceInfo.stockingPrice || 0) * (parseInt(stateInfo.stockingQty) || 0);
          }
        }
      });
    }
  });
  return total;
};

const calculateChemistTotal = (chemistRow, products) => {
  let total = 0;
  if (!chemistRow || !chemistRow.productData) return total;

  Object.keys(chemistRow.productData).forEach(category => {
    const categoryProducts = chemistRow.productData[category];
    categoryProducts.forEach((productState, index) => {
      // Find the product price from the products list
      const product = products.find(p => p.name === category);
      if (product && product.variants && product.variants[index]) {
        const variant = product.variants[index];
        if (productState.wholesaleQty) {
          total += (variant.stocking_price || 0) * (parseInt(productState.wholesaleQty) || 0);
        }
      }
    });
  });
  return total;
};

const generateChemistSummaryData = (tableData, products) => {
  const summary = [];
  tableData.forEach(chemist => {
    // Skip entries that don't have a chemist
    if (!chemist.chemist) return;
    
    const chemistSummary = {
      chemist: chemist.chemist,
      items: [],
      total: calculateChemistTotal(chemist, products),
      managersSelected: (chemist.jointVisit && chemist.jointVisitManagers)
        ? Object.entries(chemist.jointVisitManagers)
            .filter(([key, value]) => value === true)
            .map(([key, value]) => key)
        : []
    };

    if (chemist.productData) {
      Object.keys(chemist.productData).forEach(category => {
        if (chemist.productData[category]) {
          chemist.productData[category].forEach((productState, index) => {
            const product = products.find(p => p.name === category);
            if (product && product.variants && product.variants[index]) {
              const variant = product.variants[index];
              if (productState.wholesaleQty) {
                const qty = parseInt(productState.wholesaleQty) || 0;
                const price = variant.stocking_price || 0;
                chemistSummary.items.push({
                  name: `${category} - ${productState.name}`, type: "Stocking", qty: qty, unitPrice: price, lineTotal: qty * price
                });
              }
            }
          });
        }
      });
    }
    // Only add to summary if there are items OR selected managers
    if (chemistSummary.items.length > 0 || chemistSummary.managersSelected.length > 0) {
      summary.push(chemistSummary);
    }
  });
  return summary;
};

const generateSummaryData = (tableData, productCategories) => {
  const summary = [];
  tableData.forEach(doc => {
    // Skip entries that don't have a doctor (i.e., chemist entries)
    if (!doc.doctor) return;
    
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
    if (dcr.dailyExpenses.nightOutReturn) total += 50;
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
                    <td className="px-4 py-2 text-right">{item.type === 'Detailed' ? '-' : `Rs. ${item.unitPrice.toFixed(2)}`}</td>
                    <td className="px-4 py-2 text-right">{item.type === 'Detailed' ? '-' : item.qty}</td>
                    <td className="px-4 py-2 text-right font-medium">{item.type === 'Sampling' || item.type === 'Detailed' ? '-' : `Rs. ${item.lineTotal.toFixed(2)}`}</td>
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

/**
 * Chemist Summary Table Component
 */
const ChemistSummaryTable = ({ tableData, products }) => {
  const summaryData = generateChemistSummaryData(tableData, products);

  if (summaryData.length === 0) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center text-gray-500">
        No chemist calls recorded.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {summaryData.map((summary, idx) => (
        <div key={idx} className="p-4 border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
          <h4 className="font-bold text-md text-green-700 mb-1">{summary.chemist}</h4>
          {/* Display selected managers */}
          {summary.managersSelected.length > 0 && (
            <p className="text-xs text-gray-600 mb-3">
              <span className="font-semibold">Joint Visit with:</span> {summary.managersSelected.join(', ')}
            </p>
          )}

          {summary.items.length > 0 ? (
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
                {summary.items.map((item, itemIdx) => (
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
                    Total for {summary.chemist}:
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-lg text-green-600">
                    Rs. {summary.total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-sm text-gray-500 italic">No products selected for this chemist.</p>
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();

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
      const employeeId = searchParams.get('employeeId');
      const response = await api.get('/dcrs', { params: { ...(employeeId ? { employeeId } : {}), _t: Date.now() } });
      setDcrs(response.data.dcrs);
    } catch (error) {
      console.error('Error fetching DCRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const employeeId = searchParams.get('employeeId');

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleViewDCR = async (dcrId) => {
    try {
      const response = await api.get(`/dcrs/${dcrId}`);
      setSelectedDCR(response.data.dcr);
    } catch (error) {
      console.error('Error fetching DCR details:', error);
      alert('DCR not found or has been deleted.');
    }
  };

  const handleAddDCR = () => {
    navigate('/DCR_report');
  };

  const handleEditDCR = (dcrId) => {
    navigate('/DCR_report', { state: { editId: dcrId } });
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
      <div className="dashboard-wrapper">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
          <button
            className="toggle-btn"
            onClick={() => setSidebarOpen(o => !o)}
          >
            {sidebarOpen ? <FaTimes/> : <FaBars/>}
          </button>
          <img src={logo} alt="GSH Logo" className="logo" />
          <nav className="sidebar-nav">
            <ul>
              <li onClick={() => {
                const d = user?.designation;
                if (d === 'OM') navigate('/om-dashboard');
                else if (['SM','MGR','PM','TM','PPES','PPEJ','FC'].includes(d)) navigate('/team-dashboard');
                else navigate('/rep-dashboard');
              }}>Overview</li>
              {user?.designation === 'OM' && (
                <li
                  onClick={() => navigate('/om-dashboard', { state: { tab: 'Employee Overview' } })}
                >
                  Employee Overview
                </li>
              )}
              {['SM','MGR','PM','TM','PPES','PPEJ','FC'].includes(user?.designation) && (
                <li
                  onClick={() => navigate('/team-dashboard', { state: { tab: 'Employee Overview' } })}
                >
                  Team Overview
                </li>
              )}
              <li onClick={() => navigate('/itineraries')}>Itinerary</li>
              <li className="active">Reports</li>
            </ul>
          </nav>
          <div className="sidebar-footer">
            <button
              className="logout-btn-sidebar"
              onClick={handleLogout}
              title="Logout"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <div className="main-content">
          <div className="w-full p-6">
            <div className="flex items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">DCR Report Details</h1>
              <button
                onClick={() => setSelectedDCR(null)}
                className="ml-auto px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Back to Reports
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
            <div><strong>Primary Working Area:</strong> {selectedDCR.area}</div>
            <div><strong>Town:</strong> {selectedDCR.town}</div>
            <div><strong>Actual Working Area:</strong> {selectedDCR.actualWorkingArea || '-'}</div>
          </div>

          {/* Call Report - Doctors */}
          {selectedDCR.callReport && selectedDCR.callReport.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">Doctor Call Reports</h3>
              <LiveSummaryTable tableData={selectedDCR.callReport} productCategories={productCategories} />
            </div>
          )}

          {/* Call Report - Chemists */}
          {selectedDCR.callReport && selectedDCR.callReport.some(entry => entry.chemist) && (
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">Chemist Call Reports</h3>
              <ChemistSummaryTable tableData={selectedDCR.callReport.filter(entry => entry.chemist)} products={Object.keys(productCategories).map(catName => ({
                name: catName,
                variants: productCategories[catName].map(v => ({
                  stocking_price: v.stockingPrice || 0
                }))
              }))} />
            </div>
          )}

          {/* Expenses */}
          {selectedDCR.dailyExpenses && (
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">Daily Expenses</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>Bata: {selectedDCR.dailyExpenses.bata ? 'Yes' : 'No'}</div>
                <div>Night Out: {selectedDCR.dailyExpenses.nightOut ? 'Yes' : 'No'}</div>
                <div>Night Out Return: {selectedDCR.dailyExpenses.nightOutReturn ? 'Yes' : 'No'}</div>
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
                  <td className="px-3 py-2 border-b border-gray-200 text-sm w-1/3">Scheduled mileage</td>
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
          {(() => {
            const productsList = Object.keys(productCategories).map(catName => ({
              name: catName,
              variants: productCategories[catName].map(v => ({
                stocking_price: v.stockingPrice || 0
              }))
            }));
            const chemistData = selectedDCR.callReport?.filter(entry => entry.chemist) || [];
            const chemistTotal = chemistData.length > 0 
              ? generateChemistSummaryData(chemistData, productsList).reduce((acc, chem) => acc + chem.total, 0)
              : 0;
            return (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-blue-600 text-white rounded-lg flex justify-between items-center text-sm sm:text-base">
                  <span className="font-bold">Total stocking orders :</span>
                  <span className="font-bold">Rs. {generateSummaryData(selectedDCR.callReport || [], productCategories).reduce((acc, doc) => acc + doc.total, 0).toFixed(2)}</span>
                </div>
                <div className="p-4 bg-green-600 text-white rounded-lg flex justify-between items-center text-sm sm:text-base">
                  <span className="font-bold">Total chemist orders:</span>
                  <span className="font-bold">Rs. {chemistTotal.toFixed(2)}</span>
                </div>
                <div className="p-4 bg-red-600 text-white rounded-lg flex justify-between items-center text-sm sm:text-base">
                  <span className="font-bold">Expenses Total:</span>
                  <span className="font-bold">Rs. {calculateExpensesTotal(selectedDCR).toFixed(2)}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  </div>
);
}

  return (
    <div className="dashboard-wrapper">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <button
          className="toggle-btn"
          onClick={() => setSidebarOpen(o => !o)}
        >
          {sidebarOpen ? <FaTimes/> : <FaBars/>}
        </button>
        <img src={logo} alt="GSH Logo" className="logo" />
        <nav className="sidebar-nav">
          <ul>
            <li onClick={() => {
              const d = user?.designation;
              if (d === 'OM') navigate('/om-dashboard');
              else if (['SM','MGR','PM','TM','PPES','PPEJ','FC'].includes(d)) navigate('/team-dashboard');
              else navigate('/rep-dashboard');
            }}>Overview</li>
            {user?.designation === 'OM' && (
              <li
                onClick={() => navigate('/om-dashboard', { state: { tab: 'Employee Overview' } })}
              >
                Employee Overview
              </li>
            )}
            {['SM','MGR','PM','TM','PPES','PPEJ','FC'].includes(user?.designation) && (
              <li
                onClick={() => navigate('/team-dashboard', { state: { tab: 'Employee Overview' } })}
              >
                Team Overview
              </li>
            )}
            <li onClick={() => navigate('/itineraries')}>Itinerary</li>
            <li className="active">Reports</li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button
            className="logout-btn-sidebar"
            onClick={handleLogout}
            title="Logout"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="min-h-screen bg-gray-100 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header with Add Button */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Daily Call Reports Management</h1>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (employeeId) {
                      navigate(`/employee-rep-dashboard/${employeeId}`);
                    } else {
                      const d = user?.designation;
                      if (d === 'OM') navigate('/om-dashboard');
                      else if (['SM','MGR','PM','TM','PPES','PPEJ','FC'].includes(d)) navigate('/team-dashboard');
                      else navigate('/rep-dashboard');
                    }
                  }}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Back to Dashboard
                </button>
                {!employeeId && (
                  <button
                    onClick={handleAddDCR}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add DCR Form
                  </button>
                )}
              </div>
            </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rep Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Emp No
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
                {Object.keys(dcrs).length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium">No DCR reports found</p>
                        <p className="text-sm text-gray-400 mt-1">Create your first DCR report to get started</p>
                        {!employeeId && (
                          <button
                            onClick={handleAddDCR}
                            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Your First DCR Report
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  Object.entries(dcrs).map(([monthYear, monthDcrs]) => (
                    <React.Fragment key={monthYear}>
                      {/* Month header row */}
                      <tr className="bg-gray-100">
                        <td colSpan="5" className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                          {monthYear}
                        </td>
                      </tr>
                      {/* DCR rows */}
                      {monthDcrs.map((dcr) => (
                        <tr key={dcr.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(dcr.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {dcr.repName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {dcr.empNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {dcr.distributor || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleViewDCR(dcr.id)}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2 transition-colors duration-200"
                                title="View DCR Report"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </button>
                              {!employeeId && (
                                <button
                                  onClick={() => handleEditDCR(dcr.id)}
                                  className="text-orange-600 hover:text-orange-900 px-3 py-1 rounded text-sm font-medium border border-orange-600 hover:bg-orange-50"
                                  title="Edit DCR Report"
                                >
                                  Edit
                                </button>
                              )}
                              {!employeeId && (
                                <button
                                  onClick={() => handleDeleteDCR(dcr.id)}
                                  className="text-red-600 hover:text-red-900 px-3 py-1 rounded text-sm font-medium border border-red-600 hover:bg-red-50"
                                  title="Delete DCR Report"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}