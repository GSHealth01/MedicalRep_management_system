// src/layouts/AdminLayout.jsx
import { Link, Outlet, useLocation } from "react-router-dom";

export default function AdminLayout() {
  const location = useLocation();

  const navLinks = [
    { name: "Admin Portal", path: "/admin/portal" },
    { name: "Profile", path: "/admin/profile" },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-900 to-blue-700 text-white flex flex-col shadow-lg">
        <div className="p-5 text-xl font-bold border-b border-blue-600">
          MRIS Admin
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`block px-4 py-2 rounded-md transition ${
                location.pathname === link.path
                  ? "bg-blue-600 font-semibold"
                  : "hover:bg-blue-500"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-600">
          <Link
            to="/logout"
            className="block px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-center"
          >
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-700">Admin Portal</h1>
          <span className="text-gray-500 text-sm">Welcome, Admin</span>
        </header>
        <div className="p-6">{/* Render child pages */ <Outlet />}</div>
      </main>
    </div>
  );
}
