import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Shield, UserCheck, Bell, Settings, Lock, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-in-out-quad'
    });
  }, []);

  const steps = [
    {
      number: "01",
      icon: <UserCheck className="h-8 w-8 text-secondary" />,
      title: "Register Your Account",
      description: "Create your secure account with verified credentials to access all security features."
    },
    {
      number: "02",
      icon: <Shield className="h-8 w-8 text-secondary" />,
      title: "Setup Security Profile",
      description: "Configure your security preferences and access levels for complete protection."
    },
    {
      number: "03",
      icon: <Bell className="h-8 w-8 text-secondary" />,
      title: "Receive Alerts",
      description: "Get instant notifications for any security events in your community."
    },
    {
      number: "04",
      icon: <Eye className="h-8 w-8 text-secondary" />,
      title: "Monitor Activity",
      description: "View real-time security monitoring through our dashboard."
    },
    {
      number: "05",
      icon: <Settings className="h-8 w-8 text-secondary" />,
      title: "Customize Settings",
      description: "Adjust notification preferences and security parameters as needed."
    },
    {
      number: "06",
      icon: <Lock className="h-8 w-8 text-secondary" />,
      title: "Enjoy Complete Security",
      description: "Rest easy knowing your property is protected 24/7."
    }
  ];

  return (
    <div className="bg-background py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary">
            How Guardian<span className="text-secondary">Net</span> Works
          </h2>
          <div className="w-24 h-1 bg-secondary mx-auto mt-4 mb-6"></div>
          <p className="text-lg text-text max-w-3xl mx-auto">
            Our seamless security process ensures your property is protected every step of the way
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-secondary"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary-light text-white text-xl font-bold mr-4">
                  {step.number}
                </div>
                <div className="text-secondary">
                  {step.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-3">{step.title}</h3>
              <p className="text-text">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center" data-aos="fade-up">
          <h3 className="text-2xl font-semibold text-primary mb-4">
            Ready to secure your property?
          </h3>
          <Link
            to="/resident-register"  // Replace with your actual route
            className="inline-block px-8 py-3 bg-secondary hover:bg-secondary-dark text-white font-medium rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
          >
            Get Started Today
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;