import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Home, User, Lock, CheckCircle, Clock, Eye, Bell } from "lucide-react";
import HowItWorks from "../components/HowItWorks";
import FeaturesSection from "../components/FeaturesSection";
import UserRoles from "../components/UserRoles";
import Footer from "../components/Footer";

const HeroSection = () => {
  return (
    <div className="relative w-full min-h-screen bg-background overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-secondary opacity-10 blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-primary opacity-10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <div className="absolute top-1/3 right-1/3 w-96 h-96 rounded-full bg-secondary-dark opacity-5 blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 md:px-12 py-24">
        {/* Animated Icons with Floating Effect */}
        <motion.div 
          className="mb-8 flex gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {[Shield, Home, User, Lock].map((Icon, index) => (
            <motion.div
              key={index}
              className="p-4 bg-white rounded-xl shadow-lg"
              whileHover={{ 
                y: -5,
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
              }}
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4 + index,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.3
              }}
            >
              <Icon className="h-8 w-8 text-secondary" />
            </motion.div>
          ))}
        </motion.div>

        {/* Headline with Enhanced Typography */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-6"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary">
            <span className="bg-gradient-to-r from-secondary to-secondary-dark bg-clip-text text-transparent">
              Guardian
            </span> 
            <span className="text-primary">Net</span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-secondary to-secondary-dark mx-auto mt-4 rounded-full" />
        </motion.div>

        <motion.h2
          className="text-2xl md:text-4xl font-semibold text-primary mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <span className="inline-block">
            Smart Society <span className="text-secondary">Security</span> System
          </span>
        </motion.h2>

        <motion.p
          className="text-lg md:text-xl text-text max-w-3xl mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          Advanced digital verification and QR-based security solutions for modern residential communities, 
          ensuring <span className="font-medium text-primary">safety</span> and <span className="font-medium text-secondary">convenience</span>.
        </motion.p>

        {/* Enhanced Buttons with Staggered Animation */}
        <motion.div
          className="flex flex-col md:flex-row gap-4 justify-center mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          {[
            {
              to: "/resident-register",
              text: "Register as Resident",
              bg: "bg-gradient-to-r from-secondary to-secondary-dark",
              icon: <User className="h-5 w-5 mr-2" />
            },
            {
              to: "/login",
              text: "Security Login",
              bg: "bg-white border-2 border-secondary",
              textColor: "text-primary",
              icon: <Shield className="h-5 w-5 mr-2" />
            },
           
          ].map((button, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Link 
                to={button.to}
                className={`px-8 py-3 ${button.bg} ${button.textColor || 'text-white'} font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center`}
              >
                {button.icon}
                {button.text}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced Stats with Icons */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          {[
            { value: "100%", label: "Secure", icon: <CheckCircle className="h-6 w-6" /> },
            { value: "24/7", label: "Monitoring", icon: <Clock className="h-6 w-6" /> },
            { value: "QR", label: "Verified", icon: <Eye className="h-6 w-6" /> },
            { value: "Instant", label: "Alerts", icon: <Bell className="h-6 w-6" /> }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-secondary bg-opacity-10 rounded-full text-secondary">
                  {stat.icon}
                </div>
              </div>
              <div className="text-2xl font-bold text-secondary">{stat.value}</div>
              <div className="text-sm text-text mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Additional Sections */}
      <FeaturesSection />
      <HowItWorks />
      <UserRoles />
      <Footer />
    </div>
  );
};

export default HeroSection;