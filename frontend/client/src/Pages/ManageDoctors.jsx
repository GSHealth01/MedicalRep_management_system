import { useEffect, useState, useMemo } from "react";
import DoctorForm from "../components/DoctorForm";
import { api } from "../services/api";
import { useNotification } from "../components/NotificationPopup";
import { useConfirm } from "../components/ConfirmDialog";

// Edit Doctor Modal Component
function EditDoctorModal({ doctor, onClose, onSave }) {
   const [formData, setFormData] = useState({
     name: doctor?.name || '',
     contactNumber: doctor?.contactNumber || '',
     email: doctor?.email || '',
     specialty: doctor?.specialty || doctor?.speciality || '',
     categorization: doctor?.categorization || '',
     sector: doctor?.sector?.range || '',
     agency: doctor?.sector?.agency || '',
     birthday: doctor?.birthday
       ? new Date(doctor.birthday).toISOString().slice(0, 10)
       : '',
     town: doctor?.town || '',
     dateAdded: doctor?.dateAdded
       ? new Date(doctor.dateAdded).toISOString().slice(0, 10)
       : doctor?.date
       ? new Date(doctor.date).toISOString().slice(0, 10)
       : ''
   });

   // Add agencies state
   const [agencies, setAgencies] = useState([]);
   const [loadingAgencies, setLoadingAgencies] = useState(true);
   const [agencyError, setAgencyError] = useState("");

   // Load sectors as agencies from API
   useEffect(() => {
     let mounted = true;
     (async () => {
       setLoadingAgencies(true);
       setAgencyError("");
       try {
         const res = await api.get("/admin/sectors");
         const payload = res?.data?.data?.items || [];
         // Map sectors to agency format
         const agencyList = payload.map(sector => ({
           id: sector.id,
           name: sector.agency
         }));
         if (mounted) setAgencies(agencyList);
       } catch (err) {
         if (mounted) setAgencyError(err?.response?.data?.message || "Failed to load sectors");
       } finally {
         if (mounted) setLoadingAgencies(false);
       }
     })();
     return () => { mounted = false; };
   }, []);

   // Hardcoded ranges
   const ranges = useMemo(() => [
     { id: 'A', name: 'A' },
     { id: 'B', name: 'B' }
   ], []);

   const [filteredAgencies, setFilteredAgencies] = useState([]);

   // when range changes, filter agencies based on the selected range
   useEffect(() => {
     if (!formData.sector) {
       setFilteredAgencies([]);
       return;
     }
     // Filter agencies based on the selected range
     const filtered = agencies.filter(agency => {
       // Check if agency name starts with the selected range (A or B)
       return agency.name && agency.name.startsWith(formData.sector);
     });
     setFilteredAgencies(filtered);
   }, [formData.sector, agencies]);

   const [loading, setLoading] = useState(false);

   const handleChange = (e) => {
     const { name, value } = e.target;
     // clear dependent agency when sector changes
     if (name === "sector") {
       setFormData((s) => ({ ...s, sector: value, agency: "" }));
       return;
     }
     setFormData(prev => ({ ...prev, [name]: value }));
   };

   const handleSubmit = async (e) => {
     e.preventDefault();
     setLoading(true);
     try {
       await onSave(formData);
       onClose();
     } catch (error) {
       // Error handled in parent
     } finally {
       setLoading(false);
     }
   };

   return (
     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
       <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
         <h2 className="text-xl font-bold mb-4">Edit Doctor</h2>
         <form onSubmit={handleSubmit} className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
             <input
               type="text"
               name="name"
               value={formData.name}
               onChange={handleChange}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
               required
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
             <input
               type="text"
               name="contactNumber"
               value={formData.contactNumber}
               onChange={handleChange}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
             <input
               type="email"
               name="email"
               value={formData.email}
               onChange={handleChange}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
             <input
               type="text"
               name="specialty"
               value={formData.specialty}
               onChange={handleChange}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Categorization</label>
             <input
               type="text"
               name="categorization"
               value={formData.categorization}
               onChange={handleChange}
               placeholder="Enter categorization"
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
             <input
               type="date"
               name="birthday"
               value={formData.birthday}
               onChange={handleChange}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Town</label>
             <input
               type="text"
               name="town"
               value={formData.town}
               onChange={handleChange}
               placeholder="Enter town"
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Sector (Range)</label>
             <select
               name="sector"
               value={formData.sector}
               onChange={handleChange}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
             >
               <option value="">Select Sector</option>
               {ranges.map((r) => (
                 <option key={r.id} value={r.id}>
                   {r.name}
                 </option>
               ))}
             </select>
           </div>

           {/* Agency (Sub-sector) */}
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Agency (Sub-sector)</label>
             <select
               name="agency"
               value={formData.agency}
               onChange={handleChange}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
               disabled={!formData.sector || loadingAgencies}
             >
               <option value="">
                 {!formData.sector
                   ? "Select sector first"
                   : loadingAgencies
                   ? "Loading agencies..."
                   : agencyError
                   ? "Error loading agencies"
                   : "Select agency"}
               </option>
               {filteredAgencies.map((a) => (
                 <option key={a.id} value={a.name}>
                   {a.name}
                 </option>
               ))}
             </select>
             {agencyError && (
               <p className="text-sm text-red-600 mt-1">{agencyError}</p>
             )}
             {filteredAgencies.length === 0 && !loadingAgencies && !agencyError && formData.sector && (
               <p className="text-sm text-gray-500 mt-1">No agencies found for this sector</p>
             )}
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Date Added</label>
             <input
               type="date"
               name="dateAdded"
               value={formData.dateAdded}
               onChange={handleChange}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
             />
           </div>
           <div className="flex justify-end space-x-3 pt-4">
             <button
               type="button"
               onClick={onClose}
               className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
             >
               Cancel
             </button>
             <button
               type="submit"
               disabled={loading}
               className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
             >
               {loading ? 'Saving...' : 'Save Changes'}
             </button>
           </div>
         </form>
       </div>
     </div>
   );
 }


export default function ManageDoctors() {
  const { showNotification, NotificationComponent } = useNotification();
  const { showConfirm, ConfirmDialogComponent } = useConfirm();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Load existing doctors
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/admin/doctors", { params: { limit: 100 } });
        const payload = res?.data?.data ?? res?.data ?? {};
        const items = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);
        if (mounted) setDoctors(items);
      } catch (e) {
        if (mounted) setErr(e?.response?.data?.message || "Failed to load doctors");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleAddDoctor = async (payload, rawForm) => {
    try {
      const res = await api.post("/admin/doctors", payload);
      const created = res?.data?.data || {};
      const newRow = {
        _id: created.id || created._id || Math.random().toString(36).slice(2),
        name: payload.name,
        contactNumber: payload.contactNumber,
        email: payload.email,
        specialty: payload.specialty,
        categorization: payload.categorization,
        birthday: payload.birthday,
        town: payload.town,
        dateAdded: payload.dateAdded,
        range: created.sector ? { name: created.sector.range, agency: { name: created.sector.agency } } : { id: payload.sector_id, name: 'Unknown' },
        
      };
      setDoctors((list) => [newRow, ...list]);
      showNotification(`Doctor ${payload.name} added successfully!`, 'success');
    } catch (e) {
      showNotification(e?.response?.data?.message || "Failed to add doctor", 'error');
    }
  };

  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
  };

  const handleSaveEdit = async (formData) => {
    try {
      const updateData = {};
      if (formData.name.trim()) updateData.name = formData.name.trim();
      if (formData.contactNumber.trim()) updateData.contactNumber = formData.contactNumber.trim();
      if (formData.email.trim()) updateData.email = formData.email.trim();
      if (formData.specialty.trim()) updateData.specialty = formData.specialty.trim();
      if (formData.categorization) updateData.categorization = formData.categorization;
      if (formData.birthday) updateData.birthday = formData.birthday;
      if (formData.town) updateData.town = formData.town;
      updateData.sector_id = editingDoctor.sector?.id;

      await api.put(`/admin/doctors/${editingDoctor.id || editingDoctor._id}`, updateData);

      setDoctors((list) =>
        list.map((doc) =>
          doc.id === editingDoctor.id || doc._id === editingDoctor._id
            ? {
                ...doc,
                name: formData.name,
                contactNumber: formData.contactNumber,
                email: formData.email,
                specialty: formData.specialty,
                categorization: formData.categorization,
                birthday: formData.birthday,
                town: formData.town,
                sector: editingDoctor.sector,
                date: formData.dateAdded ? new Date(formData.dateAdded).toISOString() : doc.date
              }
            : doc
        )
      );

      showNotification(`Doctor ${formData.name} updated successfully!`, 'success');
    } catch (e) {
      throw new Error(e?.response?.data?.message || "Failed to update doctor");
    }
  };

  const handleDeleteDoctor = async (doctor) => {
    const confirmed = await showConfirm({
      title: "Delete Doctor",
      message: `Are you sure you want to delete doctor "${doctor.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger"
    });

    if (!confirmed) return;

    try {
      await api.delete(`/admin/doctors/${doctor.id || doctor._id}`);
      setDoctors((list) => list.filter((doc) => {
        const docId = doc.id || doc._id;
        const deleteId = doctor.id || doctor._id;
        return docId !== deleteId;
      }));
      showNotification(`Doctor ${doctor.name} deleted successfully!`, 'success');
    } catch (e) {
      showNotification(e?.response?.data?.message || "Failed to delete doctor", 'error');
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Doctors</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {showForm ? 'Hide Form' : 'Add Doctor'}
        </button>
      </div>

      {/* Edit Doctor Modal */}
      {editingDoctor && (
        <EditDoctorModal
          doctor={editingDoctor}
          onClose={() => setEditingDoctor(null)}
          onSave={handleSaveEdit}
        />
      )}


      {/* Add Doctor Form - Display after list */}
      {showForm && <DoctorForm onSubmit={handleAddDoctor} />}

      {/* Doctor List - Display only when form is hidden */}
      {!showForm && (
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Doctor List</h2>

        {err && <div className="text-red-600 mb-3">{err}</div>}
        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="py-2 px-4 text-center">Name</th>
                <th className="py-2 px-4 text-center">Agency</th>
                <th className="py-2 px-4 text-center">Range (Sector)</th>
                <th className="py-2 px-4 text-center">Contact</th>
                <th className="py-2 px-4 text-center">Email</th>
                <th className="py-2 px-4 text-center">Speciality</th>
                <th className="py-2 px-4 text-center">Categorization</th>
                <th className="py-2 px-4 text-center">Birthday</th>
                <th className="py-2 px-4 text-center">Town</th>
                <th className="py-2 px-4 text-center">Date Added</th>
                <th className="py-2 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-4 text-gray-500">
                    No doctors added yet
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => {
                  const sectorName = doc.sector?.range || "";
                  const agencyName = doc.sector?.agency || "";
                  const displayDate = doc.dateAdded
                    ? new Date(doc.dateAdded).toISOString().slice(0, 10)
                    : doc.date
                    ? new Date(doc.date).toISOString().slice(0, 10)
                    : "";
                  const displayBirthday = doc.birthday
                    ? new Date(doc.birthday).toISOString().slice(0, 10)
                    : "";

                  return (
                    <tr key={doc._id || doc.id} className="border-b hover:bg-gray-50 text-center">
                      <td className="py-2 px-4">{doc.name || doc.doctorName}</td>
                      <td className="py-2 px-4">{agencyName}</td>
                      <td className="py-2 px-4">{sectorName}</td>
                      <td className="py-2 px-4">{doc.contactNumber}</td>
                      <td className="py-2 px-4">{doc.email || "-"}</td>
                      <td className="py-2 px-4">{doc.specialty || doc.speciality || "-"}</td>
                      <td className="py-2 px-4">{doc.categorization || "-"}</td>
                      <td className="py-2 px-4">{displayBirthday || "-"}</td>
                      <td className="py-2 px-4">{doc.town || "-"}</td>
                      <td className="py-2 px-4">{displayDate}</td>
                      <td className="py-2 px-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditDoctor(doc)}
                            className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm transition-colors"
                            title="Edit Doctor"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(doc)}
                            className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm transition-colors"
                            title="Delete Doctor"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    )}
    
    {/* Notification Component */}
    <NotificationComponent />
    
    {/* Confirmation Dialog Component */}
    <ConfirmDialogComponent />
  </div>
);
}
