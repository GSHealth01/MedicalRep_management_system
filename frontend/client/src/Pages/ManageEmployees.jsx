import EmployeeForm from "../components/EmployeeForm";
import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Load from BE
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/admin/users", { params: { limit: 200 } });
        const payload = res?.data?.data ?? res?.data ?? {};
        const items = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);
        if (mounted) setEmployees(items);
      } catch (e) {
        if (mounted) setErr(e?.response?.data?.message || "Failed to load employees");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleAddEmployee = async (payload /* normalized for BE */, rawForm) => {
    try {
      const res = await api.post("/admin/users", payload);
      const created = res?.data?.data || {};

      // Compose a row for immediate display
      const row = {
        _id: created.id || created._id || Math.random().toString(36).slice(2),
        name: payload.name,
        email: payload.email,
        empNo: payload.empNo,
        designation: payload.role,
        distributor: payload.distributor,
        // show populated names if BE returns them, otherwise show raw ids
        range: created.range || payload.sector || payload.range,
        agency: created.agency || payload.subSector || payload.agency,
        birthday: rawForm.birthday,
        joinDate: rawForm.joinDate,
        promotionDate: rawForm.promotionDate,
        date: rawForm.date,
      };

      setEmployees((list) => [row, ...list]);
      alert(`Employee ${payload.email} added ✅`);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to add employee");
    }
  };

  const fmtDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "-");
  const showRange = (r) => (typeof r === "object" ? (r?.name || r?.code || r?._id || "") : (r || ""));
  const showAgency = (a) => (typeof a === "object" ? (a?.name || a?.code || a?._id || "") : (a || ""));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Employees</h1>

      <EmployeeForm onSubmit={handleAddEmployee} />

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Employee List</h2>

        {err && <div className="text-red-600 mb-3">{err}</div>}
        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-2 px-4 text-center">Username (Email)</th>
                <th className="py-2 px-4 text-center">Emp No</th>
                <th className="py-2 px-4 text-center">Designation</th>
                <th className="py-2 px-4 text-center">Birthday</th>
                <th className="py-2 px-4 text-center">Join Date</th>
                <th className="py-2 px-4 text-center">Promotion Date</th>
                <th className="py-2 px-4 text-center">Agency</th>
                <th className="py-2 px-4 text-center">Range</th>
                <th className="py-2 px-4 text-center">Distributor</th>
                <th className="py-2 px-4 text-center">Date</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-4 text-gray-500">
                    No employees added yet
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id || emp.id} className="border-b hover:bg-gray-50 text-center">
                    <td className="py-2 px-4">{emp.email || emp.username}</td>
                    <td className="py-2 px-4">{emp.empNo || "-"}</td>
                    <td className="py-2 px-4">{emp.designation || emp.role || "-"}</td>
                    <td className="py-2 px-4">{fmtDate(emp.birthday)}</td>
                    <td className="py-2 px-4">{fmtDate(emp.joinDate)}</td>
                    <td className="py-2 px-4">
                      {(emp.designation || emp.role) !== "MR" ? fmtDate(emp.promotionDate) : "-"}
                    </td>
                    <td className="py-2 px-4">{showAgency(emp.agency)}</td>
                    <td className="py-2 px-4">{showRange(emp.range)}</td>
                    <td className="py-2 px-4">{emp.distributor || "-"}</td>
                    <td className="py-2 px-4">{fmtDate(emp.date || emp.dateAdded)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
