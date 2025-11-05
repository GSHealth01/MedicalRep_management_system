import { useEffect, useState } from "react";
import DistributorForm from "../components/DistributorForm";
import { api } from "../services/api";

export default function ManageDistributors() {
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Load existing distributors (optionally you can filter by sector via ?sector=)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/admin/distributors", {
          params: { limit: 100 },
        });
        const payload = res?.data?.data ?? res?.data ?? {};
        const items = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload)
          ? payload
          : [];
        console.log('Distributors response:', res.data); // Debug log
        console.log('Items:', items); // Debug log

        // Ensure all nested objects are properly handled
        const safeItems = items.map(item => ({
          ...item,
          agency: typeof item.agency === 'object' ? item.agency?.name || 'Unknown' : item.agency || 'Unknown',
          area: typeof item.area === 'object' ? item.area?.name || 'Unknown' : item.area || 'Unknown',
          coverage_town: item.coverage_town || item.town || 'Unknown',
        }));

        if (mounted) setDistributors(safeItems);
      } catch (e) {
        if (mounted)
          setErr(e?.response?.data?.message || "Failed to load distributors");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAddDistributor = async (payload, rawForm) => {
    try {
      console.log('Sending payload:', payload); // Debug log
      const res = await api.post("/admin/distributors", payload);
      console.log('Response:', res.data); // Debug log

      // The controller returns the distributor object with agency and area included
      const created = res?.data?.data || res?.data || {};
      const newRow = {
        id: created.id,
        name: created.name,
        area: created.area?.name || payload.area, // Use area name from response
        town: created.coverage_town,
        route: created.route,
        agency: created.agency?.name || 'Unknown', // Use agency name from response
        sector: created.agency?.name || 'Unknown', // For backward compatibility
      };
      setDistributors((list) => [newRow, ...list]);
      alert(`Distributor ${payload.name} added ✅`);
    } catch (e) {
      console.error('Error adding distributor:', e); // Debug log
      alert(e?.response?.data?.message || "Failed to add distributor");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Manage Distributors
      </h1>

      {/* Distributor Form */}
      <DistributorForm onSubmit={handleAddDistributor} />

      {/* Distributor Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Distributor List</h2>

        {err && <div className="text-red-600 mb-3">{err}</div>}
        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-2 px-4 text-center">Distributor Name</th>
                <th className="py-2 px-4 text-center">Agency</th>
                <th className="py-2 px-4 text-center">Area</th>
                <th className="py-2 px-4 text-center">Town</th>
                <th className="py-2 px-4 text-center">Route</th>
                <th className="py-2 px-4 text-center">Date Added</th>
              </tr>
            </thead>
            <tbody>
              {distributors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">
                    No distributors added yet
                  </td>
                </tr>
              ) : (
                distributors.map((dist) => {
                  console.log('Rendering distributor:', dist); // Debug log
                  return (
                    <tr
                      key={dist.id || dist._id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-2 px-4 text-center">
                        {String(dist.name || dist.distributorName || 'Unknown')}
                      </td>
                      <td className="py-2 px-4 text-center">
                        {String(dist.agency || 'Unknown')}
                      </td>
                      <td className="py-2 px-4 text-center">
                        {String(dist.area || 'Unknown')}
                      </td>
                      <td className="py-2 px-4 text-center">
                        {String(dist.coverage_town || 'Unknown')}
                      </td>
                      <td className="py-2 px-4 text-center">
                        {String(dist.route || '-')}
                      </td>
                      <td className="py-2 px-4 text-center">-</td>
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
