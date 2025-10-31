import { useFormik } from "formik";
import * as Yup from "yup";
import { Mail, PhoneCall, MessageSquare, Send, User, MessageCircle, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

const ContactUs = () => {
  const formik = useFormik({
    initialValues: { name: "", email: "", message: "" },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      message: Yup.string().required("Message is required"),
    }),
    onSubmit: (values, { resetForm }) => {
      console.log("Form Data:", values);
      alert("Your inquiry has been submitted!");
      resetForm();
    },
  });

  const contactMethods = [
    {
      icon: <PhoneCall className="w-8 h-8 text-secondary" />,
      title: "Phone Support",
      description: "+91 98765 43210",
      link: "tel:+919876543210"
    },
    {
      icon: <Mail className="w-8 h-8 text-secondary" />,
      title: "Email Us",
      description: "support@societysecurity.com",
      link: "mailto:support@societysecurity.com"
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-secondary" />,
      title: "WhatsApp",
      description: "+91 98765 43210",
      link: "https://wa.me/919876543210"
    }
  ];



  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen flex flex-col">
      <div className="py-16 px-4 sm:px-6 lg:px-8 flex-grow">
        {/* Hero Section */}
        <motion.div 
          className="max-w-4xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Contact <span className="text-secondary">GuardianNet</span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-secondary to-secondary-dark mx-auto mb-6 rounded-full"></div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're here to help with any questions about our security services
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Contact Information */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-primary">Get in Touch</h2>
              <p className="text-gray-600">
                Have questions about our security solutions? Reach out through any of these channels:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {contactMethods.map((method, index) => (
                  <motion.a
                    key={index}
                    href={method.link}
                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-secondary/20"
                    whileHover={{ y: -5 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-secondary/10 rounded-lg">
                        {method.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{method.title}</h3>
                        <p className="text-gray-600 mt-1">{method.description}</p>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>

              {/* Emergency Support */}
              <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 mt-6">
                <p className="text-gray-700">Emergency support available 24/7</p>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div 
              className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-primary mb-2">Send Us a Message</h2>
              <p className="text-gray-600 mb-6">We'll respond within 24 hours</p>

              <form onSubmit={formik.handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.name}
                      className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
                    />
                  </div>
                  {formik.touched.name && formik.errors.name && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="your@email.com"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.email}
                      className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
                    />
                  </div>
                  {formik.touched.email && formik.errors.email && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Message
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3">
                      <MessageCircle className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      placeholder="How can we help you?"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.message}
                      className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition-all"
                      rows="5"
                    />
                  </div>
                  {formik.touched.message && formik.errors.message && (
                    <p className="mt-1 text-sm text-red-600">{formik.errors.message}</p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-secondary to-secondary-dark text-white py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Send className="h-5 w-5" />
                  Send Message
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ContactUs;
