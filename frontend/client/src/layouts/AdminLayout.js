import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: "Admin Portal", path: "/admin/portal" },
    { name: "Sectors", path: "/admin/sectors" },
    { name: "Distributors", path: "/admin/distributors" },
    { name: "Employees", path: "/admin/employees" },
    { name: "Products", path: "/admin/products" },
    { name: "Doctors", path: "/admin/doctors" },
    { name: "Chemists", path: "/admin/chemists" },
    { name: "Teams", path: "/admin/teams" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-900 to-blue-700 text-white flex flex-col shadow-lg">
        <div className="p-5 text-xl font-bold border-b border-blue-600">
          MRIS Admin
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-md transition ${
                  isActive ? "bg-blue-600 font-semibold" : "hover:bg-blue-500"
                }`
              }
              end
            >
              {link.name}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-600">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-center"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-700">Admin Portal</h1>
          <span className="text-gray-500 text-sm">
            {user ? (
              <>
                Welcome,&nbsp;
                <strong>{user.email}</strong>
                {user.role ? ` · ${String(user.role).toUpperCase()}` : ""}
              </>
            ) : (
              "Welcome"
            )}
          </span>
        </header>
        <div className="p-6">
          {/* Render child pages */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
