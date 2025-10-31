import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Bell,
  CalendarRange,
  User,
  Truck,
  AlertTriangle,
  LogOut,
  Car,
  Menu
} from "lucide-react";

const ResidentLayout = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    // { name: "Dashboard", icon: Home, path: "/resident/resident-dashboard" },
    { name: "Profile", icon: User, path: "/resident/resident-profile" },
    { name: "Staff", icon: Bell, path: "/resident/resident-staff" },
    { name: "Vehicles", icon: Car, path: "/resident/resident-vehicle" },
    { name: "Visitors", icon: User, path: "/resident/resident-visitor" },
    { name: "Deliveries", icon: Truck, path: "/resident/resident-delivery" },
    { name: "Events", icon: CalendarRange, path: "/resident/resident-events" },
    { name: "Logs", icon: Bell, path: "/resident/resident-logs" },
    { name: "Emergency", icon: AlertTriangle, path: "/resident/resident-emergency" },
  ];

  const handleLogout = () => {
    // Add your logout logic here
    navigate("/login");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content with sidebar */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`bg-primary-dark text-white ${isOpen ? "w-64" : "w-20"} transition-all duration-300 flex-shrink-0 fixed top-0 left-0 h-full z-40 pt-16`}
          aria-label="Sidebar"
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              {isOpen && <h2 className="text-xl font-bold">Resident Portal</h2>}
              <button
                onClick={toggleSidebar}
                className="text-white focus:outline-none hover:bg-primary-light/20 p-2 rounded-lg"
                aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                <Menu size={24} className="shrink-0" />
              </button>
            </div>

            {/* Navigation */}
            <nav>
              <ul className="space-y-2 flex-1 overflow-y-auto">
                {navItems.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center p-3 rounded-lg transition-colors 
                        ${isActive
                          ? "bg-secondary text-white"
                          : "hover:bg-primary-light/20 text-white/90"}
                        ${isOpen ? "gap-4" : "justify-center"}`
                      }
                    >
                      <item.icon size={20} className="shrink-0" />
                      {isOpen && <span className="truncate">{item.name}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Logout */}
            <div className="mt-auto pt-4">
              <button
                onClick={handleLogout}
                className={`flex items-center w-full p-3 hover:bg-primary-light/20 rounded-lg transition-colors ${isOpen ? "gap-4" : "justify-center"}`}
              >
                <LogOut size={20} className="shrink-0" />
                {isOpen && <span>Logout</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          className={`flex-1 bg-background ${isOpen ? "ml-64" : "ml-20"} transition-all duration-300 pt-16 min-h-[calc(100vh-64px)]`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ResidentLayout;