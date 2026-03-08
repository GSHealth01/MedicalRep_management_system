// src/pages/AdminPortal.jsx
import { Link } from "react-router-dom";

const adminCards = [
  {
    title: "Agencies",
    description: "Manage agencies such as Arrowil-A and Arrowil-B with their sectors.",
    button: "Manage Agencies",
    path: "/admin/sectors",
    icon: "🏢",
  },
  {
    title: "Employees",
    description: "Add, edit, and manage employees and assign roles.",
    button: "Manage Employees",
    path: "/admin/employees",
    icon: "👤",
  },
 
  {
    title: "Products",
    description: "Add or edit medical products with codes and pricing.",
    button: "Manage Products",
    path: "/admin/products",
    icon: "📦",
  },
  {
    title: "Distributors",
    description: "Add distributors with area and town details.",
    button: "Manage Distributors",
    path: "/admin/distributors",
    icon: "🏬",
  },
  {
    title: "Doctors",
    description: "Register doctor profiles and details.",
    button: "Manage Doctors",
    path: "/admin/doctors",
    icon: "🩺",
  },
  {
    title: "Chemists",
    description: "Register chemist profiles with owner and purchasing officer details.",
    button: "Manage Chemists",
    path: "/admin/chemists",
    icon: "💊",
  },
  {
    title: "Teams",
    description: "Create teams, assign leaders, and manage members.",
    button: "Manage Teams",
    path: "/admin/teams",
    icon: "👥",
  },
  {
    title: "Allocated Prices",
    description: "Manage product pricing for different ranges and agencies.",
    button: "Manage Prices",
    path: "/admin/allocated-prices",
    icon: "💰",
  },
];

export default function AdminPortal() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-gray-800">Admin Portal</h1>
      <p className="text-gray-600 mb-6">
        Access and manage all administrative functions from here.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminCards.map((card) => (
          <div
            key={card.title}
            className="border rounded-xl p-6 shadow-md hover:shadow-lg transition bg-white"
          >
            <div className="text-5xl mb-3">{card.icon}</div>
            <h2 className="text-lg font-semibold text-gray-800">
              {card.title}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{card.description}</p>
            <Link
              to={card.path}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              {card.button}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
