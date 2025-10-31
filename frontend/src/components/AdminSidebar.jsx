import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { 
  Home,
  UserCog,
  HardHat,
  AlertTriangle,
  Menu,
  LogOut,
  ClipboardList,
  Truck,
  CalendarRange,
  Users,
  User
} from "lucide-react";

const AdminLayout = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("Dashboard");

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    // { name: "Dashboard", icon: Home, path: "/admin/admin-dashboard" },
    { name: "User Management", icon: Users, path: "/admin/user-management" },
    { name: "Manage Residents", icon: UserCog, path: "/admin/manage-residents" },
    { name: "Manage Guards", icon: HardHat, path: "/admin/manage-guards" },
    { name: "Resident Logs", icon: ClipboardList, path: "/admin/resident-logs" },
    { name: "Emergency", icon: AlertTriangle, path: "/admin/emergency-view" },
    { name: "Events", icon: CalendarRange, path: "/admin/event-add" },
    { name: "Vehicle", icon: Truck, path: "/admin/vehicle" }
  ];

  return (
    <div className="flex flex-col h-screen">
      {/* Main content with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div 
          className={`bg-primary-dark text-white ${isOpen ? "w-64" : "w-20"} transition-all duration-300 flex-shrink-0 fixed top-0 left-0 h-full z-40 pt-16`}
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              {isOpen && <h2 className="text-xl font-bold">Admin Panel</h2>}
              <button 
                onClick={toggleSidebar} 
                className="text-white focus:outline-none hover:bg-primary-light/20 p-2 rounded-lg"
              >
                <Menu size={24} className="shrink-0" />
              </button>
            </div>
            
            {/* Navigation */}
            <div className="flex-1">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.name}>
                    <NavLink 
                      to={item.path}
                      onClick={() => setActiveItem(item.name)}
                      className={({ isActive }) => `flex items-center p-3 rounded-lg transition-colors 
                        ${isActive 
                          ? "bg-secondary text-white" 
                          : "hover:bg-primary-light/20 text-white/90"}
                        ${isOpen ? "gap-4" : "justify-center"}`}
                    >
                      <item.icon size={20} className="shrink-0" />
                      {isOpen && <span className="truncate">{item.name}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Bottom section with Profile and Logout */}
            <div className="mt-auto pt-4 space-y-2">
              {/* Profile Link */}
              <NavLink
                to="/admin/profile"
                onClick={() => setActiveItem("Profile")}
                className={({ isActive }) => `flex items-center p-3 rounded-lg transition-colors 
                  ${isActive ? "bg-secondary/70 text-white" : "hover:bg-primary-light/20 text-white/90"}
                  ${isOpen ? "gap-4" : "justify-center"}`}
              >
                <User size={20} className="shrink-0" />
                {isOpen && <span>Profile</span>}
              </NavLink>

              {/* Logout */}
              <NavLink
                to="/login"
                className={`flex items-center p-3 hover:bg-primary-light/20 rounded-lg transition-colors ${isOpen ? "gap-4" : "justify-center"}`}
              >
                <LogOut size={20} className="shrink-0" />
                {isOpen && <span>Logout</span>}
              </NavLink>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`flex-1 bg-background overflow-y-auto ${isOpen ? "ml-64" : "ml-20"} transition-all duration-300 pt-16`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;