import { motion } from "framer-motion";
import Footer from "../components/Footer";
import { Shield, Users, Lock, Eye, Bell, Home, Clock, CheckCircle } from "lucide-react";

const AboutUs = () => {
  // Enhanced animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-6 pt-24">
        <div className="max-w-6xl w-full mx-auto py-12">
          {/* Hero Section */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">GuardianNet</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your trusted digital security companion for modern residential communities
            </p>
          </motion.div>

          {/* Main Content Card */}
          <motion.div 
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <div className="p-10 flex flex-col">
              {/* Mission & Vision Cards */}
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
                variants={containerVariants}
              >
                <motion.div 
                  className="bg-gradient-to-br from-primary/5 to-primary/10 p-8 rounded-xl border border-primary/20 hover:shadow-lg transition-all"
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg mr-4">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Our Mission</h2>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Revolutionize society security with smart digital tools, offering comprehensive visitor management, 
                    vehicle tracking, and real-time security updates for complete peace of mind.
                  </p>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-secondary/5 to-secondary/10 p-8 rounded-xl border border-secondary/20 hover:shadow-lg transition-all"
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-secondary/10 rounded-lg mr-4">
                      <Eye className="h-6 w-6 text-secondary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Our Vision</h2>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Create secure, controlled living environments where residents feel empowered through 
                    intuitive digital security solutions and community-focused protection.
                  </p>
                </motion.div>
              </motion.div>

              {/* Core Values */}
              <motion.div 
                className="mb-12"
                variants={itemVariants}
              >
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                  Our <span className="text-primary">Core Values</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Innovation",
                      desc: "Pioneering cutting-edge security technology",
                      icon: <Shield className="h-8 w-8 text-primary" />
                    },
                    {
                      title: "Reliability",
                      desc: "24/7 protection you can trust completely",
                      icon: <Lock className="h-8 w-8 text-primary" />
                    },
                    {
                      title: "Community",
                      desc: "Solutions designed for residential safety",
                      icon: <Users className="h-8 w-8 text-primary" />
                    }
                  ].map((value, index) => (
                    <motion.div 
                      key={index}
                      className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all"
                      variants={itemVariants}
                      whileHover={{ 
                        y: -8,
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
                      }}
                    >
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg mr-4">
                          {value.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">{value.title}</h3>
                      </div>
                      <p className="text-gray-600">{value.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Technology Highlights */}
              {/* <motion.div 
                className="bg-gray-50 rounded-xl p-8"
                variants={itemVariants}
              >
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                  Advanced <span className="text-secondary">Technology</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { name: "AI Surveillance", desc: "Smart threat detection" },
                    { name: "Biometric Access", desc: "Secure authentication" },
                    { name: "IoT Sensors", desc: "Real-time monitoring" },
                    { name: "Mobile Control", desc: "Remote management" }
                  ].map((tech, index) => (
                    <motion.div 
                      key={index}
                      className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      variants={itemVariants}
                    >
                      <div className="h-2 bg-gradient-to-r from-primary to-secondary rounded-full mb-4"></div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{tech.name}</h3>
                      <p className="text-gray-600 text-sm">{tech.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div> */}
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div 
            className="mt-16 bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: "99.9%", label: "Uptime" },
                { value: "24/7", label: "Monitoring" },
                { value: "500+", label: "Communities" },
                { value: "10s", label: "Response Time" }
              ].map((stat, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <p className="text-4xl font-bold mb-2">{stat.value}</p>
                  <p className="text-white/90 uppercase text-sm tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AboutUs;