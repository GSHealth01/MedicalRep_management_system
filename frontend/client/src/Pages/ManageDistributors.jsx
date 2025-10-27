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
        if (mounted) setDistributors(items);
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
      const res = await api.post("/admin/distributors", payload);
      // The controller returns { id, name } or full doc depending on your setup.
      // To keep UI immediate, add a local item combining what we have:
      const created = res?.data?.data || {};
      const newRow = {
        _id: created.id || created._id || Math.random().toString(36).slice(2),
        name: payload.name,
        area: payload.area,
        town: payload.town,
        route: rawForm.route, // local UI-only field
        dateAdded: payload.dateAdded,
        sector: created.sector || { _id: payload.sector }, // populate might return sector object
      };
      setDistributors((list) => [newRow, ...list]);
      alert(`Distributor ${payload.name} added ✅`);
    } catch (e) {
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
                <th className="py-2 px-4 text-center">Sector</th>
                <th className="py-2 px-4 text-center">Area</th>
                <th className="py-2 px-4 text-center">Town</th>
                <th className="py-2 px-4 text-center">Route</th>
                <th className="py-2 px-4 text-center">Date</th>
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
                  const sectorName =
                    typeof dist.sector === "object"
                      ? dist.sector?.name ||
                        dist.sector?.code ||
                        dist.sector?._id ||
                        ""
                      : dist.sector || "";

                  // Normalize date display
                  const dt = dist.dateAdded || dist.date;
                  const displayDate = dt
                    ? new Date(dt).toISOString().slice(0, 10)
                    : "";

                  return (
                    <tr
                      key={dist._id || dist.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-2 px-4 text-center">
                        {dist.name || dist.distributorName}
                      </td>
                      <td className="py-2 px-4 text-center">{sectorName}</td>
                      <td className="py-2 px-4 text-center">{dist.area}</td>
                      <td className="py-2 px-4 text-center">{dist.town}</td>
                      <td className="py-2 px-4 text-center">
                        {dist.route || "-"}
                      </td>
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
