import { ShieldCheck, Users, PackageCheck, AlarmCheck, BellRing } from "lucide-react";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const FeaturesSection = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true
    });
  }, []);

  const features = [
    { 
      icon: <ShieldCheck className="h-10 w-10" />, 
      title: "Visitor & Vehicle Security", 
      description: "QR-based entry ensures only authorized personnel can access the premises.",
      bg: "bg-blue-50"
    },
    { 
      icon: <Users className="h-10 w-10" />, 
      title: "Secure Staff Management", 
      description: "Permanent IDs for workers ensure a streamlined and safe work environment.",
      bg: "bg-blue-100"
    },
    { 
      icon: <PackageCheck className="h-10 w-10" />, 
      title: "Delivery Approval System", 
      description: "One-time QR codes for delivery persons prevent unauthorized access.",
      bg: "bg-blue-50"
    },
    { 
      icon: <AlarmCheck className="h-10 w-10" />, 
      title: "Emergency Alerts", 
      description: "Instant fire, medical, and security threat notifications for residents and staff.",
      bg: "bg-blue-100"
    },
    // { 
    //   icon: <BellRing className="h-10 w-10" />, 
    //   title: "Real-Time Notifications", 
    //   description: "Get WhatsApp/SMS alerts for visitor entries, security events, and more.",
    //   bg: "bg-blue-50"
    // },
  ];

  return (
    <div className="bg-background py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary">
            Advanced Security <span className="text-secondary">Features</span>
          </h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-secondary to-secondary-dark mx-auto mt-4 mb-6 rounded-full"></div>
          <p className="text-lg text-text max-w-3xl mx-auto">
            Comprehensive protection solutions designed for modern residential communities
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`${feature.bg} p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-t-4 border-secondary relative overflow-hidden group`}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              {/* 3D Effect Element */}
              <div className="absolute -bottom-4 -right-4 h-16 w-16 bg-secondary-dark opacity-10 rounded-full group-hover:opacity-20 transition-all duration-500"></div>
              
              <div className="flex items-center justify-center h-16 w-16 mb-6 mx-auto rounded-xl bg-white shadow-md text-secondary">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3 text-center">{feature.title}</h3>
              <p className="text-text text-center">{feature.description}</p>
            </div>
          ))}
        </div>

        
      </div>
    </div>
  );
};

export default FeaturesSection;