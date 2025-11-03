import { useEffect, useState } from "react";
import DoctorForm from "../components/DoctorForm";
import { api } from "../services/api";

export default function ManageDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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
        dateAdded: payload.dateAdded,
        sector: created.sector || { _id: payload.sector }, // BE may return populated
      };
      setDoctors((list) => [newRow, ...list]);
      alert(`Doctor ${payload.name} added ✅`);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to add doctor");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Doctors</h1>

      {/* Doctor Form */}
      <DoctorForm onSubmit={handleAddDoctor} />

      {/* Doctor Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Doctor List</h2>

        {err && <div className="text-red-600 mb-3">{err}</div>}
        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-2 px-4 text-center">Name</th>
                <th className="py-2 px-4 text-center">Range (Sector)</th>
                <th className="py-2 px-4 text-center">Contact</th>
                <th className="py-2 px-4 text-center">Email</th>
                <th className="py-2 px-4 text-center">Speciality</th>
                <th className="py-2 px-4 text-center">Categorization</th>
                <th className="py-2 px-4 text-center">Date Added</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-gray-500">
                    No doctors added yet
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => {
                  const sectorName =
                    typeof doc.sector === "object"
                      ? (doc.sector?.name || doc.sector?.code || doc.sector?._id || "")
                      : doc.sector || "";
                  const displayDate = doc.date
                    ? new Date(doc.date).toISOString().slice(0, 10)
                    : "";

                  return (
                    <tr key={doc._id || doc.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 text-center">{doc.name || doc.doctorName}</td>
                      <td className="py-2 px-4 text-center">{sectorName}</td>
                      <td className="py-2 px-4 text-center">{doc.contactNumber}</td>
                      <td className="py-2 px-4 text-center">{doc.email || "-"}</td>
                      <td className="py-2 px-4 text-center">{doc.specialty || doc.speciality || "-"}</td>
                      <td className="py-2 px-4 text-center">{doc.categorization || "-"}</td>
                      <td className="py-2 px-4 text-center">{displayDate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
