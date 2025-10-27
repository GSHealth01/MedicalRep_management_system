import { useEffect, useState } from "react";
import ProductForm from "../components/ProductForm";
import { api } from "../services/api";

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Load existing products from BE
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/admin/products", { params: { limit: 200 } });
        const payload = res?.data?.data ?? res?.data ?? {};
        const items = Array.isArray(payload?.items) ? payload.items : (Array.isArray(payload) ? payload : []);
        if (mounted) setProducts(items);
      } catch (e) {
        if (mounted) setErr(e?.response?.data?.message || "Failed to load products");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleAddProduct = async (payload, rawForm) => {
    try {
      const res = await api.post("/admin/products", payload);
      const created = res?.data?.data || {};
      const newRow = {
        _id: created.id || created._id || Math.random().toString(36).slice(2),
        sku: payload.sku,
        name: payload.name,
        genericName: payload.genericName,
        strength: payload.strength,
        packSize: payload.packSize,
        description: payload.description,
        dateAdded: payload.dateAdded,
        // These two are UI-only right now (not stored on BE):
        route: rawForm.route,
        injectionType: rawForm.injectionType,
      };
      setProducts((list) => [newRow, ...list]);
      alert(`Product ${payload.name} added ✅`);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to add product");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Products</h1>

      <ProductForm onSubmit={handleAddProduct} />

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Product List</h2>

        {err && <div className="text-red-600 mb-3">{err}</div>}
        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : (
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="py-2 px-4 text-center">SKU</th>
                <th className="py-2 px-4 text-center">Product Name</th>
                <th className="py-2 px-4 text-center">Therapeutic / Notes</th>
                <th className="py-2 px-4 text-center">Generic Name</th>
                <th className="py-2 px-4 text-center">Route</th>
                <th className="py-2 px-4 text-center">Injection Type</th>
                <th className="py-2 px-4 text-center">Pack Size</th>
                <th className="py-2 px-4 text-center">Strength</th>
                <th className="py-2 px-4 text-center">Date</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-gray-500">No products added yet</td>
                </tr>
              ) : (
                products.map((prod) => {
                  const date = prod.dateAdded ? new Date(prod.dateAdded).toISOString().slice(0,10) : (prod.date || "");
                  return (
                    <tr key={prod._id || prod.id} className="border-b hover:bg-gray-50 text-center">
                      <td className="py-2 px-4">{prod.sku || "-"}</td>
                      <td className="py-2 px-4">{prod.name || prod.productName}</td>
                      <td className="py-2 px-4">{prod.description || "-"}</td>
                      <td className="py-2 px-4">{prod.genericName}</td>
                      <td className="py-2 px-4">{prod.route || "-"}</td>
                      <td className="py-2 px-4">{prod.route === "Injection" ? (prod.injectionType || "-") : (prod.injectionType || "-")}</td>
                      <td className="py-2 px-4">{prod.packSize || "-"}</td>
                      <td className="py-2 px-4">{prod.strength || "-"}</td>
                      <td className="py-2 px-4">{date}</td>
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
