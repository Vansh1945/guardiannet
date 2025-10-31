import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Home, Shield, Settings } from "lucide-react";

const UserRoles = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true
    });
  }, []);

  const userRoles = [
    {
      title: "Resident Panel",
      description: [
        "Register visitors & generate QR codes",
        "Approve/deny visitor entry",
        "Manage staff (maids, drivers)",
        "Approve one-time delivery entries",
        "Emergency alert button",
      ],
      bgColor: "bg-blue-50",
      borderColor: "border-secondary",
      icon: <Home className="h-8 w-8 text-secondary" />,
      accentColor: "bg-secondary"
    },
    {
      title: "Security Guard Panel",
      description: [
        "Scan visitor QR codes",
        "Capture visitor image for unregistered visitors",
        "Verify registered vehicles",
        "Record Staff entries",
        "Manage emergency alerts",
      ],
      bgColor: "bg-green-50",
      borderColor: "border-green-400",
      icon: <Shield className="h-8 w-8 text-green-500" />,
      accentColor: "bg-green-400"
    },
    {
      title: "Admin Panel",
      description: [
        "Approve new residents & guards",
        "Manage entire system (staff, vehicles, alerts)",
        "Broadcast security alerts",
        "Add society Events" 
      ],
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-400",
      icon: <Settings className="h-8 w-8 text-yellow-500" />,
      accentColor: "bg-yellow-400"
    },
  ];

  return (
    <div className="bg-background py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary">
            Role-Based <span className="text-secondary">Dashboards</span>
          </h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-secondary to-secondary-dark mx-auto mt-4 mb-6 rounded-full"></div>
          <p className="text-lg text-text max-w-3xl mx-auto">
            Tailored interfaces designed for each user's specific security needs
          </p>
        </div>

        {/* Role Panels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {userRoles.map((role, index) => (
            <div
              key={index}
              className={`${role.bgColor} p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 relative overflow-hidden group`}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              {/* Top accent bar */}
              <div className={`absolute top-0 left-0 w-full h-1 ${role.accentColor}`}></div>
              
              {/* Icon container */}
              <div className={`flex items-center justify-center h-16 w-16 mb-6 rounded-xl bg-white shadow-md mx-auto ${role.borderColor} border-2`}>
                {role.icon}
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-semibold text-primary mb-4 text-center">{role.title}</h3>
              
              {/* Features list */}
              <ul className="space-y-3 text-text">
                {role.description.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full ${role.accentColor} text-white text-sm mt-0.5`}>
                      ✓
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserRoles;