
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

// Doctors will be fetched from API

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
          // Sampling no longer has quantity, just checkbox
          if (stateInfo.stocking && stateInfo.stockingQty) {
            total += (priceInfo.stockingPrice || 0) * (parseInt(stateInfo.stockingQty) || 0);
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
            .map(([key, value]) => key.split(' - ')[1] || key)
        : []
    };

    if (doc.productData) {
        Object.keys(doc.productData).forEach(category => {
            if (productCategories[category] && doc.productData[category]) {
                doc.productData[category].forEach((productState, index) => {
                    if (index < productCategories[category].length) {
                        const priceInfo = productCategories[category][index];

                        if (productState.sampling) {
                          const qty = parseInt(productState.samplingQty) || 1;
                          docSummary.items.push({
                            name: `${category} - ${productState.name}`, type: "Sampling", qty: qty, unitPrice: 0, lineTotal: 0
                          });
                        }
                        if (productState.detailed) {
                          const qty = 1;
                          docSummary.items.push({
                            name: `${category} - ${productState.name}`, type: "Detailed", qty: qty, unitPrice: 0, lineTotal: 0
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

const calculateChemistTotal = (chemistRow, productCategories) => {
  let total = 0;
  if (!chemistRow || !chemistRow.productData) return total;

  Object.keys(productCategories).forEach(category => {
    if (productCategories[category] && chemistRow.productData[category]) {
      const productsWithPrices = productCategories[category];
      const productStates = chemistRow.productData[category];

      productsWithPrices.forEach((priceInfo, index) => {
        if (index < productStates.length) {
          const stateInfo = productStates[index];
          // Wholesale quantity for chemists - use stocking_price as wholesale price
          if (stateInfo.wholesaleQty) {
            total += (priceInfo.stockingPrice || 0) * (parseInt(stateInfo.wholesaleQty) || 0);
          }
        }
      });
    }
  });
  return total;
};

const generateChemistSummaryData = (tableData, productCategories) => {
  const summary = [];
  tableData.forEach(chemist => {
    const chemistSummary = {
      chemist: chemist.chemist,
      items: [],
      total: calculateChemistTotal(chemist, productCategories),
      managersSelected: (chemist.jointVisit && chemist.jointVisitManagers)
        ? Object.entries(chemist.jointVisitManagers)
            .filter(([key, value]) => value === true)
            .map(([key, value]) => key.split(' - ')[1] || key)
        : []
    };

    if (chemist.productData) {
        Object.keys(chemist.productData).forEach(category => {
            if (productCategories[category] && chemist.productData[category]) {
                chemist.productData[category].forEach((productState, index) => {
                    if (index < productCategories[category].length) {
                        const priceInfo = productCategories[category][index];

                        // Wholesale quantity for chemists
                        if (productState.wholesaleQty) {
                          const qty = parseInt(productState.wholesaleQty) || 0;
                          const price = priceInfo.stockingPrice || 0; // Use stocking_price as wholesale price
                          chemistSummary.items.push({
                            name: `${category} - ${productState.name}`, type: "Stocking", qty: qty, unitPrice: price, lineTotal: qty * price
                          });
                        }
                    }
                });
            }
        });
    }
    if (chemistSummary.items.length > 0 || chemistSummary.managersSelected.length > 0) {
      summary.push(chemistSummary);
    }
  });
  return summary;
};


/**
 * Summary Table Component (Shows prices, totals, and managers for selected items)
 */
const LiveSummaryTable = ({ doctorTableData, chemistTableData, productCategories }) => {
  const doctorSummaryData = generateSummaryData(doctorTableData, productCategories);
  const chemistSummaryData = generateChemistSummaryData(chemistTableData, productCategories);
  const allSummaries = [...doctorSummaryData, ...chemistSummaryData];

  if (allSummaries.length === 0) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center text-gray-500">
        No items or joint visits selected yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allSummaries.map((summary, idx) => (
        <div key={idx} className="p-4 border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
          <h4 className={`font-bold text-md mb-1 ${summary.doctor ? 'text-blue-700' : 'text-green-700'}`}>
            {summary.doctor || summary.chemist}
          </h4>
          {/* Display selected managers for doctors */}
          {summary.managersSelected && summary.managersSelected.length > 0 && (
            <p className="text-xs text-gray-600 mb-3">
              <span className="font-semibold">Joint Visit with:</span> {summary.managersSelected.join(', ')}
            </p>
          )}

          {summary.items.length > 0 ? (
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Product</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">Quantity</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.items.map((item, itemIdx) => (
                  <tr key={itemIdx} className="border-b last:border-b-0">
                    <td className="px-4 py-2 whitespace-nowrap">{item.name}</td>
                    <td className="px-4 py-2">{item.type}</td>
                    <td className="px-4 py-2 text-right">{item.type === 'Detailed' ? '-' : item.qty}</td>
                    <td className="px-4 py-2 text-right font-medium">{item.type === 'Sampling' || item.type === 'Detailed' ? '-' : `Rs. ${item.lineTotal.toFixed(2)}`}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-300">
                <tr>
                  <td colSpan="3" className="px-4 py-2 text-right font-bold text-gray-800">
                    Total for {summary.doctor || summary.chemist}:
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-lg text-blue-600">
                    Rs. {summary.total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-sm text-gray-500 italic">No products selected.</p>
          )}
        </div>
      ))}
    </div>
  );
};


// --- Main Component ---
export default function RepdetailsReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [isEdit, setIsEdit] = useState(false);
  const editId = location.state?.editId;
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productCategories, setProductCategories] = useState({});

  // Step 1 State
  const [date, setDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [range, setRange] = useState("");
  const [agency, setAgency] = useState("");
  const [repName, setRepName] = useState("");
  const [empNo, setEmpNo] = useState("");
  const [distributor, setDistributor] = useState("");
  const [area, setArea] = useState("");
  const [town, setTown] = useState("");
  const [actualWorkingArea, setActualWorkingArea] = useState("");
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [itineraryMessage, setItineraryMessage] = useState("");
  const [areaDisabled, setAreaDisabled] = useState(false);
  const [townDisabled, setTownDisabled] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  // Chemist state
  const [selectedChemists, setSelectedChemists] = useState([]);
  const [showChemistDropdown, setShowChemistDropdown] = useState(false);
  const [chemists, setChemists] = useState([]);
  const [chemistsLoading, setChemistsLoading] = useState(true);
  const [managers, setManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(true);
  const [allDcrs, setAllDcrs] = useState([]);

  // Step 2 State
  const [selectedProductTab, setSelectedProductTab] = useState("");
  const [doctorTableData, setDoctorTableData] = useState([]);
  const [chemistTableData, setChemistTableData] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Step 3 State (Combined)
  const [otherBillsOpen, setOtherBillsOpen] = useState(false);
  const [otherBills, setOtherBills] = useState({
    parking: { checked: false, amount: "" },
    highway: { checked: false, amount: "" },
    other: { checked: false, amount: "" }
  });
  const [existingOtherBillImages, setExistingOtherBillImages] = useState([]);
  const [newOtherBillImages, setNewOtherBillImages] = useState([]);
  const otherBillImages = [...existingOtherBillImages, ...newOtherBillImages];
  const [expenses, setExpenses] = useState({ bata: false, nightOut: false, nightOutReturn: false, fuel: false });
  const [remarks, setRemarks] = useState("");
  const [existingOrderFormImages, setExistingOrderFormImages] = useState([]);
  const [newOrderFormImages, setNewOrderFormImages] = useState([]);
  const orderFormImages = [...existingOrderFormImages, ...newOrderFormImages];

  // Step 3 Mileage State
  const [mileage, setMileage] = useState({
    scheduleMileage: '',
    openingMileage: '',
    closingMileage: '',
    privateMileage: '',
    fuelPumped: '',
    cost: ''
  });

  // Step 3 File States
  const [odometerReadingFile, setOdometerReadingFile] = useState(null);
  const [fuelBillFile, setFuelBillFile] = useState(null);

  // Handle edit mode
  useEffect(() => {
    if (editId) {
      setIsEdit(true);
      const fetchDCR = async () => {
        try {
          const response = await api.get(`/dcrs/${editId}`);
          const dcr = response.data.dcr;
          setDate(dcr.date);
          setRange(dcr.range);
          setAgency(dcr.agency);
          setRepName(dcr.repName);
          setEmpNo(dcr.empNo);
          setDistributor(dcr.distributor);
          setArea(dcr.area);
          setTown(dcr.town);
          setActualWorkingArea(dcr.actualWorkingArea || "");
          // Handle doctor data
          const doctorCalls = dcr.callReport?.filter(d => d.doctor) || [];
          setSelectedDoctors(doctorCalls.map(d => d.doctor));
          setDoctorTableData(doctorCalls);
          // Handle chemist data (new field)
          const chemistCalls = dcr.callReport?.filter(d => d.chemist) || [];
          setSelectedChemists(chemistCalls.map(c => c.chemist));
          setChemistTableData(chemistCalls);
          setExpenses(dcr.dailyExpenses || {});
          setOtherBills(dcr.otherBills?.details || { parking: { checked: false, amount: "" }, highway: { checked: false, amount: "" }, other: { checked: false, amount: "" } });
          setExistingOtherBillImages(dcr.otherBills?.images || []);
          setNewOtherBillImages([]);
          setMileage(dcr.mileage || {});
          setRemarks(dcr.remarks || "");
          setExistingOrderFormImages(dcr.orderFormImages || []);
          setNewOrderFormImages([]);
          setOdometerReadingFile(dcr.odometerReading || null);
          setFuelBillFile(dcr.fuelBill || null);
          // Set step to 2 for editing
          setStep(2);
        } catch (error) {
          console.error('Error fetching DCR for edit:', error);
        }
      };
      fetchDCR();
    }
  }, [editId]);

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        const profile = response.data.user;
        setUserProfile(profile);

        console.log('DCR: Fetched user profile:', profile);

        // Auto-populate form fields with user profile data
        if (profile) {
          setRepName(profile.name || "");
          setEmpNo(profile.emp_no || "");
          setAgency(profile.agency?.name || "");
          setRange(profile.range?.name || "");

          // Handle both single distributor (for backward compatibility) and multiple distributors
          if (profile.distributor) {
            // Single distributor (backward compatibility)
            setDistributor(profile.distributor.name || "");
            setArea(profile.distributor.area?.name || "");
            setTown(profile.distributor.coverage_town || "");
          } else if (profile.distributors && profile.distributors.length > 0) {
            // Multiple distributors - use the first one for DCR form
            const primaryDistributor = profile.distributors[0];
            setDistributor(primaryDistributor.name || primaryDistributor.distributor_code || "");
            setArea(primaryDistributor.area?.name || "");
            setTown(primaryDistributor.coverage_town || "");
            console.log('DCR: Using primary distributor:', primaryDistributor); // Debug log
          } else {
            // No distributors found
            setDistributor("");
            setArea("");
            setTown("");
            console.log('DCR: No distributors found for user'); // Debug log
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Still stop loading even if there's an error
      } finally {
        setLoading(false);
      }
    };

    if (user && user.email) {
      fetchUserProfile();
    } else if (!user) {
      // If no user, stop loading
      setLoading(false);
    }
  }, [user]);

  // Fetch all DCRs on component mount for date validation
  useEffect(() => {
    const fetchAllDcrs = async () => {
      try {
        const response = await api.get('/dcrs');
        const flattened = Object.values(response.data.dcrs).flat();
        setAllDcrs(flattened);
      } catch (error) {
        console.error('Error fetching DCRs for validation:', error);
      }
    };

    if (user && user.email) {
      fetchAllDcrs();
    }
  }, [user]);

  // Fetch products and set categories
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const response = await api.get('/products', { params: { limit: 500, range: userProfile?.range?.name } });
        const productsData = response.data.data?.items || [];
        setProducts(productsData);

        // Transform products to categories format
        const categories = transformProductsToCategories(productsData);
        setProductCategories(categories);

        // Set first category as selected tab if available
        if (Object.keys(categories).length > 0) {
          setSelectedProductTab(Object.keys(categories)[0]);
        }

        console.log('DCR: Fetched products:', productsData.length, 'categories:', Object.keys(categories));
      } catch (error) {
        console.error('Error fetching products:', error);
        setProductCategories({});
      } finally {
        setProductsLoading(false);
      }
    };

    if (user && user.email && userProfile) {
      fetchProducts();
    }
  }, [user, userProfile]);

  // Fetch doctors on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get('/doctors', { params: { range: userProfile?.range?.name } });
        const doctorsData = response.data.doctors;
        // Format doctor names: "Name - Specialty" if specialty exists
        const formattedDoctors = doctorsData.map(doctor =>
          doctor.specialty ? `${doctor.name} - ${doctor.specialty}` : doctor.name
        );
        setDoctors(formattedDoctors);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        // Fallback to empty array
        setDoctors([]);
      } finally {
        setDoctorsLoading(false);
      }
    };

    if (userProfile) {
      fetchDoctors();
    }
  }, [userProfile]);

  // Fetch chemists on component mount
  useEffect(() => {
    const fetchChemists = async () => {
      try {
        const response = await api.get('/chemists');
        const chemistsData = response.data.chemists || [];
        // Format chemist names: "Name - Distributor" if distributor exists
        const formattedChemists = chemistsData.map(chemist =>
          chemist.distributor ? `${chemist.name} - ${chemist.distributor.name}` : chemist.name
        );
        setChemists(formattedChemists);
      } catch (error) {
        console.error('Error fetching chemists:', error);
        // Fallback to empty array
        setChemists([]);
      } finally {
        setChemistsLoading(false);
      }
    };

    if (userProfile) {
      fetchChemists();
    }
  }, [userProfile]);

  // Fetch managers on component mount
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setManagersLoading(true);
        const response = await api.get('/users', { params: { range: userProfile?.range?.name } });
        const usersData = response.data.users || [];
        // Map abbreviations to full designations
        const designationMap = {
          'SE': 'Senior Executive',
          'TM': 'Territory Manager',
          'PM': 'Product Manager',
          'JE': 'Junior Executive',
          'FC': 'Field Coordinator',
          'OM': 'Operations Manager',
          'MR': 'Medical Representative',
          'ADMIN': 'Administrator'
        };
        // Filter out medical reps (MR) and system admins (ADMIN), format as "Name - Full Designation"
        const filteredManagers = usersData
          .filter(user => user.designation !== 'MR' && user.designation !== 'ADMIN')
          .map(user => `${user.name} - ${designationMap[user.designation] || user.designation}`);
        setManagers(filteredManagers);
      } catch (error) {
        console.error('Error fetching managers:', error);
        setManagers([]);
      } finally {
        setManagersLoading(false);
      }
    };

    if (userProfile) {
      fetchManagers();
    }
  }, [userProfile]);

  // Fetch itinerary for selected date and check for existing DCR
  useEffect(() => {
    const fetchItineraryForDate = async () => {
      if (!date) {
        setItineraryMessage("");
        setAreaDisabled(false);
        setTownDisabled(false);
        setDateError("");
        return;
      }

      // Check for existing DCR
      const existingDcr = allDcrs.find(dcr => dcr.date === date);
      if (existingDcr && (!isEdit || existingDcr.id !== editId)) {
        setDateError("A report has already been submitted for this date.");
      } else {
        setDateError("");
      }

      try {
        const response = await api.get('/itineraries/by-date', { params: { date } });
        const data = response.data.data;

        if (data.found === false) {
          setItineraryMessage("No itinerary scheduled for this date. Please check your itinerary.");
          setArea("");
          setTown("");
          setAreaDisabled(false);
          setTownDisabled(false);
        } else {
          setArea(data.area || "");
          setTown(data.town || "");
          setAreaDisabled(true);
          setTownDisabled(true);
          // Set scheduled mileage from itinerary and make it read-only
          setMileage(prev => ({
            ...prev,
            scheduleMileage: data.mileage ? String(data.mileage) : ""
          }));
          setItineraryMessage("");
        }
      } catch (error) {
        console.error('Error fetching itinerary for date:', error);
        setItineraryMessage("Error loading itinerary data.");
        setAreaDisabled(false);
        setTownDisabled(false);
      }
    };

    fetchItineraryForDate();
  }, [date, allDcrs, isEdit, editId]);

  // --- Step 1 Functions ---
  const toggleDoctor = (doc) => {
    setSelectedDoctors(prev =>
      prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]
    );
  };

  const toggleChemist = (chemist) => {
    setSelectedChemists(prev =>
      prev.includes(chemist) ? prev.filter(c => c !== chemist) : [...prev, chemist]
    );
  };

  useEffect(() => {
    const onClick = (e) => {
      if (showDoctorDropdown && !e.target.closest("#doctor-dropdown"))
        setShowDoctorDropdown(false);
      if (showChemistDropdown && !e.target.closest("#chemist-dropdown"))
        setShowChemistDropdown(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showDoctorDropdown, showChemistDropdown]);

  const step1Valid =
    date && (selectedDoctors.length > 0 || selectedChemists.length > 0) && !dateError;
    
  // --- Step 2 Functions ---
  useEffect(() => {
    if (step === 2 && managers.length > 0) {
      const doctorsInTable = doctorTableData.map(d => d.doctor);
      const doctorsMatch = selectedDoctors.length === doctorsInTable.length && selectedDoctors.every(doc => doctorsInTable.includes(doc));

      if (!doctorsMatch) {
        const newDoctorTableData = selectedDoctors.map((doctor) => ({
          doctor,
          jointVisit: false,
          jointVisitManagers: managers.reduce((acc, manager) => {
            acc[manager] = false;
            return acc;
          }, {}),
          productData: Object.keys(productCategories).reduce((acc, category) => {
            acc[category] = productCategories[category].map(product => ({
              name: product.name, // Only copy name
              sampling: false,
              detailed: false,
              stocking: false, stockingQty: ""
            }));
            return acc;
          }, {}),
        }));
        setDoctorTableData(newDoctorTableData);
      }

      // Also sync chemist table data
      const chemistsInTable = chemistTableData.map(c => c.chemist);
      const chemistsMatch = selectedChemists.length === chemistsInTable.length && selectedChemists.every(chem => chemistsInTable.includes(chem));

      if (!chemistsMatch) {
        const newChemistTableData = selectedChemists.map((chemist) => ({
          chemist,
          jointVisit: false,
          jointVisitManagers: managers.reduce((acc, manager) => {
            acc[manager] = false;
            return acc;
          }, {}),
          productData: Object.keys(productCategories).reduce((acc, category) => {
            acc[category] = productCategories[category].map(product => ({
              name: product.name,
              wholesaleQty: ""
            }));
            return acc;
          }, {}),
        }));
        setChemistTableData(newChemistTableData);
      }
    }
  }, [step, selectedDoctors, selectedChemists, doctorTableData, chemistTableData, productCategories, managers]);

  const updateDoctorCell = (docIdx, productIdx, field, value) => {
    setDoctorTableData(old => 
      old.map((doc, i) => {
        if (i !== docIdx) return doc;
        const newProductData = { ...doc.productData };
        if (!newProductData[selectedProductTab]) {
            newProductData[selectedProductTab] = productCategories[selectedProductTab].map(p => ({
                name: p.name, sampling: false, detailed: false, stocking: false, stockingQty: ""
            }));
        }
        const newProductTabArray = [...newProductData[selectedProductTab]];
        if (productIdx < newProductTabArray.length) {
            newProductTabArray[productIdx] = {
              ...newProductTabArray[productIdx],
              [field]: value
            };
            newProductData[selectedProductTab] = newProductTabArray;
        } else {
            console.error("Invalid product index:", productIdx, "for tab:", selectedProductTab);
        }
        return { ...doc, productData: newProductData };
      })
    );
  };

  const updateChemistCell = (chemistIdx, productIdx, field, value) => {
    setChemistTableData(old => 
      old.map((chemist, i) => {
        if (i !== chemistIdx) return chemist;
        const newProductData = { ...chemist.productData };
        if (!newProductData[selectedProductTab]) {
            newProductData[selectedProductTab] = productCategories[selectedProductTab].map(p => ({
                name: p.name, wholesaleQty: ""
            }));
        }
        const newProductTabArray = [...newProductData[selectedProductTab]];
        if (productIdx < newProductTabArray.length) {
            newProductTabArray[productIdx] = {
              ...newProductTabArray[productIdx],
              [field]: value
            };
            newProductData[selectedProductTab] = newProductTabArray;
        } else {
            console.error("Invalid product index:", productIdx, "for tab:", selectedProductTab);
        }
        return { ...chemist, productData: newProductData };
      })
    );
  };

  const toggleJointVisit = (idx) => {
    setDoctorTableData(prev =>
      prev.map((doc, i) =>
        i === idx
          ? { ...doc,
              jointVisit: !doc.jointVisit,
              jointVisitManagers: doc.jointVisit
                ? managers.reduce((acc, manager) => {
                    acc[manager] = false;
                    return acc;
                  }, {})
                : doc.jointVisitManagers
            }
          : doc
      )
    );
  };

  const toggleChemistJointVisit = (idx) => {
    setChemistTableData(prev =>
      prev.map((chemist, i) =>
        i === idx
          ? { ...chemist,
              jointVisit: !chemist.jointVisit,
              jointVisitManagers: chemist.jointVisit
                ? managers.reduce((acc, manager) => {
                    acc[manager] = false;
                    return acc;
                  }, {})
                : chemist.jointVisitManagers
            }
          : chemist
      )
    );
  };

  const toggleManagerCheckbox = (docIdx, managerKey) => {
    setDoctorTableData(prev =>
      prev.map((doc, i) => {
        if (i !== docIdx) return doc;
        return {
          ...doc,
          jointVisitManagers: {
            ...doc.jointVisitManagers,
            [managerKey]: !doc.jointVisitManagers[managerKey]
          }
        };
      })
    );
  };

  const toggleChemistManagerCheckbox = (chemistIdx, managerKey) => {
    setChemistTableData(prev =>
      prev.map((chemist, i) => {
        if (i !== chemistIdx) return chemist;
        return {
          ...chemist,
          jointVisitManagers: {
            ...chemist.jointVisitManagers,
            [managerKey]: !chemist.jointVisitManagers[managerKey]
          }
        };
      })
    );
  };

  /**
   * Calculates the grand total for Step 2 display.
   */
  const calculateLiveGrandTotal = () => {
    const doctorSummary = generateSummaryData(doctorTableData, productCategories);
    const chemistSummary = generateChemistSummaryData(chemistTableData, productCategories);
    return doctorSummary.reduce((acc, doc) => acc + doc.total, 0) + 
           chemistSummary.reduce((acc, chem) => acc + chem.total, 0);
  };

  const calculateDoctorTotal = () => {
    const doctorSummary = generateSummaryData(doctorTableData, productCategories);
    return doctorSummary.reduce((acc, doc) => acc + doc.total, 0);
  };

  const calculateChemistTotal = () => {
    const chemistSummary = generateChemistSummaryData(chemistTableData, productCategories);
    return chemistSummary.reduce((acc, chem) => acc + chem.total, 0);
  };

  const calculateExpensesTotal = () => {
    let total = 0;
    if (expenses.bata) total += 50;
    if (expenses.nightOut) total += 50;
    if (expenses.nightOutReturn) total += 50;
    if (expenses.fuel) total += 50;
    total += parseFloat(otherBills.parking.amount || 0);
    total += parseFloat(otherBills.highway.amount || 0);
    total += parseFloat(otherBills.other.amount || 0);
    total += parseFloat(mileage.cost || 0);
    return total;
  };


  // --- Step 3 Functions ---
  const toggleOtherBillItem = (key) => {
    setOtherBills(prev => ({
      ...prev,
      [key]: {
        checked: !prev[key].checked,
        amount: prev[key].checked ? "" : prev[key].amount
      }
    }));
  };
  const setOtherBillAmount = (key, value) => {
    setOtherBills(prev => ({ ...prev, [key]: { ...prev[key], amount: value } }));
  };
  const onOtherBillFilesChange = (e) => {
    setNewOtherBillImages(prev => [...prev, ...Array.from(e.target.files)]);
  };

  const handleExpenseChange = (key) => {
    setExpenses(prev => {
      const newVal = !prev[key];
      if (key === "bata" && newVal) return { ...prev, bata: true, nightOut: false, nightOutReturn: false };
      if (key === "nightOut" && newVal) return { ...prev, bata: false, nightOut: true, nightOutReturn: false };
      if (key === "nightOutReturn" && newVal) return { ...prev, bata: false, nightOut: false, nightOutReturn: true };
      return { ...prev, [key]: newVal };
    });
  };

  const deleteOtherBillImage = (index) => {
    if (index < existingOtherBillImages.length) {
      setExistingOtherBillImages(prev => prev.filter((_, i) => i !== index));
    } else {
      const newIndex = index - existingOtherBillImages.length;
      setNewOtherBillImages(prev => prev.filter((_, i) => i !== newIndex));
    }
  };

  const deleteOrderFormImage = (index) => {
    if (index < existingOrderFormImages.length) {
      setExistingOrderFormImages(prev => prev.filter((_, i) => i !== index));
    } else {
      const newIndex = index - existingOrderFormImages.length;
      setNewOrderFormImages(prev => prev.filter((_, i) => i !== newIndex));
    }
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();

      // Add basic fields
      formData.append('date', date);
      formData.append('range', range);
      formData.append('agency', agency);
      formData.append('repName', repName);
      formData.append('empNo', empNo);
      formData.append('distributor', distributor);
      formData.append('area', area);
      formData.append('town', town);
      formData.append('actualWorkingArea', actualWorkingArea);

      // Combine doctor and chemist call report data
      const combinedCallReport = [...doctorTableData, ...chemistTableData];
      
      // Add complex data as JSON strings
      formData.append('callReport', JSON.stringify(combinedCallReport));
      formData.append('dailyExpenses', JSON.stringify(expenses));
      formData.append('otherBills', JSON.stringify(otherBills));
      formData.append('mileage', JSON.stringify(mileage));
      formData.append('remarks', remarks);

      // Add existing images as JSON
      formData.append('existingOtherBillImages', JSON.stringify(existingOtherBillImages));
      formData.append('existingOrderFormImages', JSON.stringify(existingOrderFormImages));

      // Add file uploads
      if (odometerReadingFile && typeof odometerReadingFile === 'object') formData.append('odometerReading', odometerReadingFile);
      if (fuelBillFile && typeof fuelBillFile === 'object') formData.append('fuelBill', fuelBillFile);

      // Add new image files only
      newOtherBillImages.forEach((file, index) => {
        formData.append('otherBillImages', file);
      });

      newOrderFormImages.forEach((file, index) => {
        formData.append('orderFormImages', file);
      });

      const url = isEdit ? `/dcrs/${editId}` : '/dcrs';
      const method = isEdit ? api.put : api.post;

      const response = await method(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert(isEdit ? "DCR updated successfully!" : "DCR submitted successfully!");
      navigate('/dcr-reports'); // Redirect to dashboard
    } catch (error) {
      console.error('Error submitting DCR:', error);
      alert("Failed to submit DCR. Please try again.");
    }
  }


  const FROZEN = { no: 40, doctor: 180, joint: 400 };
  const LEFTS = { no: 0, doctor: FROZEN.no, joint: FROZEN.no + FROZEN.doctor };
  const stickyBase = {
    position: 'sticky',
    background: '#ffffff', 
    zIndex: 30,
    
  };

  const renderStep1 = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading profile data...</span>
        </div>
      );
    }

    return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Daily Call Report</h2>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto rounded-full" />
        {userProfile && (
          <p className="text-sm text-gray-600 mt-2">
            Logged in as: <span className="font-semibold">{userProfile.name}</span> ({userProfile.emp_no})
          </p>
        )}
      </div>
      {/* Date */}
      <div className="mb-6">
        <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={isEdit} className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg ${isEdit ? 'bg-gray-100' : 'bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} />
        {dateError && (
          <p className="mt-2 text-sm text-red-600">{dateError}</p>
        )}
        {itineraryMessage && (
          <p className="mt-2 text-sm text-orange-600">{itineraryMessage}</p>
        )}
      </div>
      {/* Range */}
      <div className="mb-6">
        <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Range</label>
        <input type="text" value={range} onChange={(e) => setRange(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" readOnly />
      </div>
      {/* Agency */}
      <div className="mb-6">
        <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Agency</label>
        <input type="text" value={agency} onChange={(e) => setAgency(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" readOnly />
      </div>
      {/* Rep Name */}
      <div className="mb-6">
        <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Rep Name</label>
        <input type="text" value={repName} onChange={(e) => setRepName(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" readOnly />
      </div>
      {/* Emp No */}
      <div className="mb-6">
        <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Emp No</label>
        <input type="text" value={empNo} onChange={(e) => setEmpNo(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" readOnly />
      </div>
      {/* Distributor */}
      <div className="mb-6">
        <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Distributor</label>
        <input type="text" value={distributor} onChange={(e) => setDistributor(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" readOnly />
      </div>
      {/* Primary Working Area + Town + Actual Working Area */}
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex-1">
          <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Primary Working Area</label>
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            disabled={areaDisabled}
            readOnly
            className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg ${areaDisabled ? 'bg-gray-100' : 'bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          />
        </div>
        <div className="flex-1">
          <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Town</label>
          <input
            type="text"
            value={town}
            onChange={(e) => setTown(e.target.value)}
            disabled={townDisabled}
            readOnly
            className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg ${townDisabled ? 'bg-gray-100' : 'bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          />
        </div>
        <div className="flex-1">
          <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Actual Working Area</label>
          <input
            type="text"
            value={actualWorkingArea}
            onChange={(e) => setActualWorkingArea(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      {/* Doctor dropdown */}
      <div className="mb-8">
        <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Doctor</label>
        <div id="doctor-dropdown" className="relative" onClick={() => !doctorsLoading && setShowDoctorDropdown(v => !v)}>
          <div className={`flex justify-between items-center px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 ${!doctorsLoading ? 'cursor-pointer hover:border-blue-500 hover:bg-blue-50' : 'cursor-not-allowed'}`}>
            <span className="text-gray-700">
              {doctorsLoading ? 'Loading doctors...' : 'Select Doctor(s)'}
            </span>
            <div className="flex items-center">
              {selectedDoctors.length > 0 && (
                <span className="text-sm text-blue-600 mr-3 font-semibold bg-blue-100 px-2 py-1 rounded-full">
                  {selectedDoctors.length} selected
                </span>
              )}
              {!doctorsLoading && <span className="text-gray-500 text-lg">▾</span>}
            </div>
          </div>
          {showDoctorDropdown && !doctorsLoading && (
            <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 rounded-lg max-h-60 overflow-y-auto z-10 shadow-xl mt-1">
              {doctors.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No doctors available. Please contact admin to add doctors.
                </div>
              ) : (
                doctors.map((doc) => (
                  <label key={doc} className={`flex items-center px-4 py-3 cursor-pointer text-sm ${selectedDoctors.includes(doc) ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={selectedDoctors.includes(doc)} onChange={(e) => { e.stopPropagation(); toggleDoctor(doc); }} className="mr-3 scale-125 cursor-pointer" />
                    {doc}
                  </label>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chemist dropdown */}
      <div className="mb-8">
        <label className="block mb-3 font-semibold text-gray-700 text-sm uppercase tracking-wide">Chemist</label>
        <div id="chemist-dropdown" className="relative" onClick={() => !chemistsLoading && setShowChemistDropdown(v => !v)}>
          <div className={`flex justify-between items-center px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 ${!chemistsLoading ? 'cursor-pointer hover:border-green-500 hover:bg-green-50' : 'cursor-not-allowed'}`}>
            <span className="text-gray-700">
              {chemistsLoading ? 'Loading chemists...' : 'Select Chemist(s)'}
            </span>
            <div className="flex items-center">
              {selectedChemists.length > 0 && (
                <span className="text-sm text-green-600 mr-3 font-semibold bg-green-100 px-2 py-1 rounded-full">
                  {selectedChemists.length} selected
                </span>
              )}
              {!chemistsLoading && <span className="text-gray-500 text-lg">▾</span>}
            </div>
          </div>
          {showChemistDropdown && !chemistsLoading && (
            <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 rounded-lg max-h-60 overflow-y-auto z-10 shadow-xl mt-1">
              {chemists.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No chemists available. Please contact admin to add chemists.
                </div>
              ) : (
                chemists.map((chemist) => (
                  <label key={chemist} className={`flex items-center px-4 py-3 cursor-pointer text-sm ${selectedChemists.includes(chemist) ? 'bg-green-50 text-green-700 font-medium border-l-4 border-green-500' : 'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={selectedChemists.includes(chemist)} onChange={(e) => { e.stopPropagation(); toggleChemist(chemist); }} className="mr-3 scale-125 cursor-pointer" />
                    {chemist}
                  </label>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      {/* Next Button */}
      <div className="text-center mt-10">
        <button
          disabled={!step1Valid}
          onClick={() => setStep(2)}
          className={`px-8 py-4 text-lg font-bold rounded-xl transition-all ${step1Valid ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          Next
        </button>
      </div>
    </div>
    );
  };

 const renderStep2 = () => (
    <div className="w-full mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-gray-200">
        Step 2: Product Selection
      </h2>

      {/* Product Category Tabs */}
      <div className="flex items-center border-b-2 border-gray-200 mb-4 overflow-x-auto whitespace-nowrap">
        {Object.keys(productCategories).map(category => (
          <button
            key={category}
            onClick={() => setSelectedProductTab(category)}
            className={`px-6 py-3 font-semibold text-sm transition-all flex-shrink-0 ${
              selectedProductTab === category
                ? 'border-b-4 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Doctor Product Selection Table */}
      {doctorTableData.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-blue-700 mb-3">Doctors</h3>
          <div className="overflow-x-auto mt-4 border border-blue-200 rounded-lg shadow-sm">
            <table className="w-full min-w-[1100px] border-collapse table-fixed">
              <colgroup>
                 <col style={{ width: `${FROZEN.no}px` }} />
                 <col style={{ width: `${FROZEN.doctor}px` }} />
                 <col style={{ width: `${FROZEN.joint}px` }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ ...stickyBase, left: LEFTS.no, width: FROZEN.no }} className="border border-gray-200 px-3 py-2 bg-blue-100 text-gray-700 font-semibold text-center text-xs">No.</th>
                  <th style={{ ...stickyBase, left: LEFTS.doctor, width: FROZEN.doctor }} className="border border-gray-200 px-3 py-2 bg-blue-100 text-gray-700 font-semibold text-center text-xs">Doctors</th>
                  <th style={{ ...stickyBase, left: LEFTS.joint, width: FROZEN.joint }} className="border border-gray-200 px-3 py-2 bg-blue-100 text-gray-700 font-semibold text-center text-xs">Joint Visit</th>
                  {productCategories[selectedProductTab]?.map((product, i) => (
                    <th key={i} className="border border-gray-200 px-3 py-2 bg-blue-100 text-gray-700 font-semibold text-center min-w-[180px] text-xs">{product.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doctorTableData.map((doc, docIdx) => {
                  const rowBg = docIdx % 2 === 0 ? '#f0f9ff' : '#ffffff';
                  const stickyCellStyle = { ...stickyBase, background: rowBg };
                  return (
                    <tr key={docIdx} style={{ background: rowBg }}>
                      <td style={{ ...stickyCellStyle, left: LEFTS.no, width: FROZEN.no }} className="border border-gray-200 px-3 py-2 text-center text-sm">{docIdx + 1}</td>
                      <td style={{ ...stickyCellStyle, left: LEFTS.doctor, width: FROZEN.doctor }} className="border border-gray-200 px-3 py-2 font-medium whitespace-nowrap text-sm">{doc.doctor}</td>
                      <td style={{ ...stickyCellStyle, left: LEFTS.joint, width: FROZEN.joint }} className="border border-gray-200 px-3 py-2">
                        <div className="flex flex-col items-start gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={doc.jointVisit} onChange={() => toggleJointVisit(docIdx)} className="scale-110 cursor-pointer" />
                            <span className="text-xs text-gray-600">Joint Visit</span>
                          </label>
                          {doc.jointVisit && (
                            <div className="pl-5 flex flex-col gap-1">
                              {managers.map(manager => (
                                <label key={manager} className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" checked={doc.jointVisitManagers[manager]} onChange={() => toggleManagerCheckbox(docIdx, manager)} className="scale-110 cursor-pointer" />
                                  <span className="text-xs text-gray-700">{manager}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      {doc.productData && doc.productData[selectedProductTab] ? (
                        doc.productData[selectedProductTab].map((cell, productIdx) => (
                          <td key={productIdx} className="border border-gray-200 px-3 py-2 align-top min-w-[180px]">
                            <div className="flex flex-col gap-3">
                              <label className={`flex items-center gap-2 text-sm`}>
                                <input type="checkbox" checked={cell.sampling || false} onChange={(e) => updateDoctorCell(docIdx, productIdx, "sampling", e.target.checked)} className="scale-110 cursor-pointer" />
                                <span className="flex-1 text-left text-xs">Sampling</span>
                                <input type="number" min="0" value={cell.samplingQty || ""} onChange={(e) => updateDoctorCell(docIdx, productIdx, "samplingQty", e.target.value)} placeholder="QTY" className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center text-xs" />
                              </label>
                              <label className={`flex items-center gap-2 text-sm`}>
                                <input type="checkbox" checked={cell.detailed || false} onChange={(e) => updateDoctorCell(docIdx, productIdx, "detailed", e.target.checked)} className="scale-110 cursor-pointer" />
                                <span className="flex-1 text-left text-xs">Detailed</span>
                              </label>
                              <label className={`flex items-center gap-2 text-sm`}>
                                <input type="checkbox" checked={cell.stocking || false} onChange={(e) => updateDoctorCell(docIdx, productIdx, "stocking", e.target.checked)} className="scale-110 cursor-pointer" />
                                <span className="flex-1 text-left text-xs">Stocking</span>
                                <input type="number" min="0" value={cell.stockingQty || ""} onChange={(e) => updateDoctorCell(docIdx, productIdx, "stockingQty", e.target.value)} placeholder="QTY" disabled={!cell.stocking} className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center text-xs" />
                              </label>
                            </div>
                          </td>
                        ))
                      ) : (
                        Array(productCategories[selectedProductTab]?.length || 0).fill(null).map((_, idx) => (
                            <td key={idx} className="border border-gray-200 px-3 py-2 align-top min-w-[180px]"></td>
                        ))
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chemist Product Selection Table */}
      {chemistTableData.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-green-700 mb-3">Chemists</h3>
          <div className="overflow-x-auto mt-4 border border-green-200 rounded-lg shadow-sm">
            <table className="w-full min-w-[1100px] border-collapse table-fixed">
              <colgroup>
                 <col style={{ width: `${FROZEN.no}px` }} />
                 <col style={{ width: '300px' }} />
                 <col style={{ width: `${FROZEN.joint}px` }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ ...stickyBase, left: LEFTS.no, width: FROZEN.no }} className="border border-gray-200 px-3 py-2 bg-green-100 text-gray-700 font-semibold text-center text-xs">No.</th>
                  <th style={{ ...stickyBase, left: LEFTS.doctor, width: '300px' }} className="border border-gray-200 px-3 py-2 bg-green-100 text-gray-700 font-semibold text-center text-xs">Chemist</th>
                  <th style={{ ...stickyBase, left: LEFTS.joint, width: FROZEN.joint }} className="border border-gray-200 px-3 py-2 bg-green-100 text-gray-700 font-semibold text-center text-xs">Joint Visit</th>
                  {productCategories[selectedProductTab]?.map((product, i) => (
                    <th key={i} className="border border-gray-200 px-3 py-2 bg-green-100 text-gray-700 font-semibold text-center min-w-[180px] text-xs">{product.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chemistTableData.map((chemist, chemistIdx) => {
                  const rowBg = chemistIdx % 2 === 0 ? '#f0fdf4' : '#ffffff';
                  const stickyCellStyle = { ...stickyBase, background: rowBg };
                  return (
                    <tr key={chemistIdx} style={{ background: rowBg }}>
                      <td style={{ ...stickyCellStyle, left: LEFTS.no, width: FROZEN.no }} className="border border-gray-200 px-3 py-2 text-center text-sm">{chemistIdx + 1}</td>
                      <td style={{ ...stickyCellStyle, left: LEFTS.doctor, width: '300px' }} className="border border-gray-200 px-3 py-2 font-medium whitespace-nowrap text-sm">{chemist.chemist}</td>
                      <td style={{ ...stickyCellStyle, left: LEFTS.joint, width: FROZEN.joint }} className="border border-gray-200 px-3 py-2">
                        <div className="flex flex-col items-start gap-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={chemist.jointVisit || false} onChange={() => toggleChemistJointVisit(chemistIdx)} className="scale-110 cursor-pointer" />
                            <span className="text-xs text-gray-600">Joint Visit</span>
                          </label>
                          {chemist.jointVisit && (
                            <div className="pl-5 flex flex-col gap-1">
                              {managers.map(manager => (
                                <label key={manager} className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" checked={chemist.jointVisitManagers?.[manager] || false} onChange={() => toggleChemistManagerCheckbox(chemistIdx, manager)} className="scale-110 cursor-pointer" />
                                  <span className="text-xs text-gray-700">{manager}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      {chemist.productData && chemist.productData[selectedProductTab] ? (
                        chemist.productData[selectedProductTab].map((cell, productIdx) => (
                          <td key={productIdx} className="border border-gray-200 px-3 py-2 align-top min-w-[180px]">
                            <div className="flex flex-col gap-3">
                              <label className={`flex items-center gap-2 text-sm`}>
                                <span className="flex-1 text-left text-xs">Qty</span>
                                <input type="number" min="0" value={cell.wholesaleQty || ""} onChange={(e) => updateChemistCell(chemistIdx, productIdx, "wholesaleQty", e.target.value)} placeholder="QTY" className="w-20 px-2 py-1 border border-gray-300 rounded-md text-center text-xs" />
                              </label>
                            </div>
                          </td>
                        ))
                      ) : (
                        Array(productCategories[selectedProductTab]?.length || 0).fill(null).map((_, idx) => (
                            <td key={idx} className="border border-gray-200 px-3 py-2 align-top min-w-[180px]"></td>
                        ))
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Summary Section */}
      <h3 className="text-xl font-bold text-gray-800 mt-10 mb-4">
        Selected Items Summary
      </h3>
      <div className="p-4 border border-gray-200 rounded-lg">
        <LiveSummaryTable doctorTableData={doctorTableData} chemistTableData={chemistTableData} productCategories={productCategories} />
      </div>

       {/* Total Boxes */}
       <div className="mt-6 flex gap-4">
         <div className="flex-1 p-4 bg-blue-600 text-white rounded-lg flex justify-between items-center">
           <span className="text-lg font-bold">Total stocking orders (Doctors):</span>
           <span className="text-xl font-bold">Rs. {calculateDoctorTotal().toFixed(2)}</span>
         </div>
         <div className="flex-1 p-4 bg-green-600 text-white rounded-lg flex justify-between items-center">
           <span className="text-lg font-bold">Total chemist orders:</span>
           <span className="text-xl font-bold">Rs. {calculateChemistTotal().toFixed(2)}</span>
         </div>
       </div>

      {/* Buttons */}
      <div className="mt-8 flex gap-4 justify-center">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-3 text-base font-semibold rounded-md bg-gray-500 hover:bg-gray-600 text-white"
        >
          Back
        </button>
        <button
          onClick={() => setStep(3)} 
          className="px-6 py-3 text-base font-semibold rounded-md bg-blue-500 hover:bg-blue-600 text-white"
        >
          Next
        </button>
      </div>
    </div>
  );

  // Combined Step 3 (Layout adjusted: Expenses, Mileage, Remarks in a single column)
  const renderStep3 = () => (
    <div className="w-full max-w-2xl mx-auto"> {/* Centered content */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-gray-200">
        Step 3: Expenses, Mileage & Remarks
      </h2>

      {/* Expenses Section */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <caption className="caption-top text-left text-lg text-gray-800 mb-2 font-bold">
            Daily Expenses
          </caption>
          <tbody>
            {["bata", "nightOut", "nightOutReturn", "fuel"].map(key => (
              <tr key={key}>
                <td className="px-2 py-2 border-b border-gray-200 text-sm">
                  {key === "bata" ? "Daily Bata" : key === "nightOut" ? "Night Out" : key === "nightOutReturn" ? "Night Out Return" : "Fuel"}
                </td>
                <td className="px-2 py-2 border-b border-gray-200">
                  <input type="checkbox" checked={expenses[key]} onChange={() => handleExpenseChange(key)} className="scale-125 cursor-pointer" />
                </td>
              </tr>
            ))}
            {/* Other Bills dropdown */}
            <tr>
              <td colSpan={2} className="px-2 py-2">
                <div onClick={() => setOtherBillsOpen(o => !o)} className="border border-gray-300 rounded-md px-3 py-2 cursor-pointer hover:border-blue-500 text-sm">
                  Other Bills ▾
                </div>
                {otherBillsOpen && (
                  <div className="px-3 py-2 border border-gray-300 border-t-0 text-sm">
                    {["parking", "highway", "other"].map(key => (
                      <div key={key} className="flex items-center mb-2">
                        <input type="checkbox" checked={otherBills[key].checked} onChange={() => toggleOtherBillItem(key)} className="scale-125 mr-3 cursor-pointer" />
                        <span className="flex-1 capitalize">{key}</span>
                        {otherBills[key].checked && (
                          <input type="number" placeholder="Amount" value={otherBills[key].amount} onChange={e => setOtherBillAmount(key, e.target.value)} className="w-20 px-2 py-1 border border-gray-300 rounded-md" />
                        )}
                      </div>
                    ))}
                    <div className="mt-4">
                      <label className="block mb-1 text-xs">Upload Receipts:</label>
                      <input type="file" multiple accept="image/*" onChange={onOtherBillFilesChange} className="text-xs" />
                      {otherBillImages.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold mb-1">Existing Images:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {otherBillImages.map((img, i) => (
                              <div key={i} className="relative">
                                <img
                                  src={typeof img === 'string' ? `http://localhost:5001/uploads/dcr/${img}` : URL.createObjectURL(img)}
                                  alt={`Receipt ${i + 1}`}
                                  className="w-full h-16 object-cover rounded border"
                                />
                                <button
                                  type="button"
                                  onClick={() => deleteOtherBillImage(i)}
                                  className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mileage Section - Below Expenses */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <caption className="caption-top text-left text-lg text-gray-800 mb-2 font-bold">
            Mileage
          </caption>
          <tbody>
            {[
              { label: "Scheduled mileage", input: <input type="text" value={mileage.scheduleMileage} readOnly placeholder="From Itinerary" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-gray-100" /> },
              { label: "Opening mileage", input: <input type="text" value={mileage.openingMileage} onChange={(e) => setMileage(prev => ({ ...prev, openingMileage: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /> },
              { label: "Closing mileage", input: <input type="text" value={mileage.closingMileage} onChange={(e) => setMileage(prev => ({ ...prev, closingMileage: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /> },
              { label: "Private mileage", input: <input type="text" value={mileage.privateMileage} onChange={(e) => setMileage(prev => ({ ...prev, privateMileage: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /> },
              { label: "Odometer Reading", input: (
                <div>
                  {odometerReadingFile && (
                    <div className="mb-2">
                      <img
                        src={typeof odometerReadingFile === 'string' ? `http://localhost:5001/uploads/dcr/${odometerReadingFile}` : URL.createObjectURL(odometerReadingFile)}
                        alt="Odometer Reading"
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => setOdometerReadingFile(null)}
                        className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => setOdometerReadingFile(e.target.files[0])} className="w-full text-sm" />
                </div>
              ) },
              { label: "Fuel Pumped", input: <input type="text" value={mileage.fuelPumped} onChange={(e) => setMileage(prev => ({ ...prev, fuelPumped: e.target.value }))} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /> },
              { label: "Cost", input: <input type="text" value={mileage.cost} onChange={(e) => setMileage(prev => ({ ...prev, cost: e.target.value }))} placeholder="Rs." className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" /> },
              { label: "Fuel Bill", input: (
                <div>
                  {fuelBillFile && (
                    <div className="mb-2">
                      <img
                        src={typeof fuelBillFile === 'string' ? `http://localhost:5001/uploads/dcr/${fuelBillFile}` : URL.createObjectURL(fuelBillFile)}
                        alt="Fuel Bill"
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => setFuelBillFile(null)}
                        className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => setFuelBillFile(e.target.files[0])} className="w-full text-sm" />
                </div>
              ) }
            ].map((row, i) => (
              <tr key={i}>
                <td className="px-3 py-2 border-b border-gray-200 text-sm w-1/3">{row.label}</td> {/* Adjusted width */}
                <td className="px-3 py-2 border-b border-gray-200">{row.input}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

       {/* Remarks Section - Below Mileage */}
       <div className="mb-8">
          <label className="font-bold text-gray-800 text-lg mb-3 block">Remark</label>
          <textarea
            placeholder="Enter your remarks..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 min-h-32 resize-vertical text-sm"
          />
          <label className="font-bold text-gray-800 text-lg mb-3 block">Order Form</label>
          <div className="flex items-center gap-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setNewOrderFormImages(prev => [...prev, ...Array.from(e.target.files)])}
              className="text-sm cursor-pointer border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-l-md file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100"
            />
          </div>
          {orderFormImages.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold mb-1">Existing Images:</p>
              <div className="grid grid-cols-3 gap-2">
                {orderFormImages.map((img, i) => (
                  <div key={i} className="relative">
                    <img
                      src={typeof img === 'string' ? `http://localhost:5001/uploads/dcr/${img}` : URL.createObjectURL(img)}
                      alt={`Order Form ${i + 1}`}
                      className="w-full h-16 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => deleteOrderFormImage(i)}
                      className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expenses Total */}
        <div className="mt-6 p-4 bg-red-600 text-white rounded-lg flex justify-between items-center">
          <span className="text-xl font-bold">Expenses Total:</span>
          <span className="text-2xl font-bold">Rs. {calculateExpensesTotal().toFixed(2)}</span>
        </div>

      {/* Buttons */}
      <div className="mt-8 flex gap-4 justify-center">
        <button
          onClick={() => setStep(2)} 
          className="px-6 py-3 text-base font-semibold rounded-md bg-gray-500 hover:bg-gray-600 text-white"
        >
          Back
        </button>
        <button
          onClick={handleSubmit} 
          className="px-6 py-3 text-base font-semibold rounded-md bg-red-500 hover:bg-red-600 text-white"
        >
          Submit
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-red-100 to-red-50 py-8 px-4 relative">
      {step >= 2 && (
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dc2626' fill-opacity='0.08'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
      )}

      <div className="w-full max-w-7xl mx-auto bg-white rounded-xl p-8 shadow-2xl border border-gray-100 relative z-10">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}
              {/* Joint Visit */}