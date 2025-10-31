import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  QrCode,
  ShieldCheck,
  User,
  AlertTriangle,
  Menu,
  LogOut,
  Badge,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Car,
  Truck,
  UserCircle
} from "lucide-react";

const SecurityLayout = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [logsOpen, setLogsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsOpen(prev => !prev);
  };

  const toggleLogsDropdown = () => {
    setLogsOpen(prev => !prev);
  };

  const navItems = [
    // { name: "Dashboard", icon: ShieldCheck, path: "/security/security-dashboard" },
    { name: "Profile", icon: UserCircle, path: "/security/profile" },
    { name: "Scan Visitor", icon: QrCode, path: "/security/scan-visitor" },
    { name: "Vehicle Record", icon: Car, path: "/security/vehicle-record" },
    { name: "Verify Staff", icon: Badge, path: "/security/staff-worker" },
    { name: "Emergency Alerts", icon: AlertTriangle, path: "/security/emergency" },
    { name: "Delivery", icon: Truck, path: "/security/delivery" }
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    // Add logout logic here
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Sidebar */}
        <aside 
          className={`bg-primary-dark text-white ${isOpen ? "w-64" : "w-20"} transition-all duration-300 flex-shrink-0 fixed top-16 left-0 h-[calc(100vh-64px)] z-40`}
          aria-label="Security panel sidebar"
        >
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              {isOpen && <h2 className="text-xl font-bold">Security Panel</h2>}
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
              <ul className="space-y-2 flex-1 overflow-y-auto scrollbar-hide">
                {navItems.map((item) => (
                  <li key={item.name}>
                    <a 
                      href={item.path}
                      className={`flex items-center p-3 rounded-lg transition-colors 
                        ${isActive(item.path) 
                          ? "bg-secondary text-white" 
                          : "hover:bg-primary-light/20 text-white/90"}
                        ${isOpen ? "gap-4" : "justify-center"}`}
                    >
                      <item.icon size={20} className="shrink-0" />
                      {isOpen && <span className="truncate">{item.name}</span>}
                    </a>
                  </li>
                ))}

              
              </ul>
            </nav>
            
            {/* Logout */}
            <div className="mt-auto pt-4">
              <button
                onClick={handleLogout}
                className={`flex items-center p-3 hover:bg-primary-light/20 rounded-lg transition-colors w-full ${isOpen ? "gap-4" : "justify-center"}`}
                aria-label="Logout"
              >
                <LogOut size={20} className="shrink-0" />
                {isOpen && <span>Logout</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`flex-1 bg-background overflow-y-auto scrollbar-hide ${isOpen ? "ml-64" : "ml-20"} transition-all duration-300`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SecurityLayout;