// src/Pages/ManageProducts.jsx
import { useState } from "react";
import ProductForm from "../components/ProductForm";

export default function ManageProducts() {
  const [products, setProducts] = useState([]);

  const handleAddProduct = (product) => {
    setProducts([...products, product]);
    alert(`Product ${product.productName} added ✅`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Products</h1>

      {/* Product Form */}
      <ProductForm onSubmit={handleAddProduct} />

      {/* Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Product List</h2>
        <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-2 px-4 text-center">Product Name</th>
              <th className="py-2 px-4 text-center">Therapeutic Category</th>
              <th className="py-2 px-4 text-center">Generic Name</th>
              <th className="py-2 px-4 text-center">Root</th>
              <th className="py-2 px-4 text-center">Injection Type</th>
              <th className="py-2 px-4 text-center">Pack Size</th>
              <th className="py-2 px-4 text-center">Strength</th>
              <th className="py-2 px-4 text-center">Date</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-500">
                  No products added yet
                </td>
              </tr>
            ) : (
              products.map((prod, index) => (
                <tr key={index} className="border-b hover:bg-gray-50 text-center">
                  <td className="py-2 px-4">{prod.productName}</td>
                  <td className="py-2 px-4">{prod.therapeuticCategory}</td>
                  <td className="py-2 px-4">{prod.genericName}</td>
                  <td className="py-2 px-4">{prod.route}</td>
                  <td className="py-2 px-4">
                    {prod.route === "Injection" ? prod.injectionType || "-" : "-"}
                  </td>
                  <td className="py-2 px-4">{prod.packSize}</td>
                  <td className="py-2 px-4">{prod.strength}</td>
                  <td className="py-2 px-4">{prod.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
