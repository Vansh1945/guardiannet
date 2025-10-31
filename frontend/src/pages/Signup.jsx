import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Shield, User, Mail, Lock, Phone, ChevronDown } from "lucide-react";
// import SignupImage from "../assets/signup.jpeg";

const STAFF_REGISTER_URL = "http://localhost:5000/api/auth/register";

const AdminSecurityRegister = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "security",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {
      name: !user.name ? "Name is required" : "",
      email: !user.email ? "Email is required" : !/^\S+@\S+\.\S+$/.test(user.email) ? "Invalid email format" : "",
      password: !user.password ? "Password is required" : user.password.length < 6 ? "Password must be at least 6 characters" : "",
      phone: !user.phone ? "Phone is required" : "",
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    const toastId = toast.loading("Processing your registration...");

    try {
      const response = await fetch(STAFF_REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...user,
          otp: "bypass"
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.update(toastId, {
          render: "Registration Successful!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        
        setTimeout(() => {
          navigate(data.user.role === "admin" ? "/admin/dashboard" : "/security/dashboard");
        }, 2000);
      } else {
        toast.update(toastId, {
          render: data.message || "Registration failed!",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.update(toastId, {
        render: "Network error. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Registration Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 pt-24 pb-8">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
        <div className="flex flex-col md:flex-row">
          {/* Left Side - Image */}
          <div className="md:w-1/2 bg-gradient-to-b from-primary to-primary-dark hidden md:flex items-center justify-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-noise opacity-10"></div>
            <div className="text-center text-white relative z-10">
              <Shield className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Staff Registration</h1>
              <p className="text-gray-200">Register for administrative access</p>
              {/* <div className="mt-8">
                <img 
                  src={SignupImage} 
                  alt="Security System" 
                  className="rounded-lg shadow-lg border-4 border-white/20 object-cover h-64 w-full"
                />
              </div> */}
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="md:w-1/2 p-8 md:p-12">
            <div className="text-center mb-8">
              <Shield className="h-10 w-10 text-secondary mx-auto" />
              <h2 className="text-2xl font-bold text-primary mt-4">Create Staff Account</h2>
              <p className="text-gray-600 mt-2">Register for system access</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="name" className="block text-sm font-medium text-primary">
                  Full Name <span className="text-red-500">*</span>
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
                    value={user.name}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary`}
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-primary">
                  Email Address <span className="text-red-500">*</span>
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
                    value={user.email}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-primary">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    value={user.password}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary`}
                  />
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="phone" className="block text-sm font-medium text-primary">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="+1 (123) 456-7890"
                    value={user.phone}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary`}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div className="space-y-1">
                <label htmlFor="role" className="block text-sm font-medium text-primary">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="role"
                    name="role"
                    value={user.role}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                  >
                    <option value="admin">Admin</option>
                    <option value="security">Security</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-secondary to-secondary-dark hover:from-secondary-dark hover:to-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registering...
                    </span>
                  ) : 'Create Account'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Already have an account?
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <Link
                  to="/login"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all hover:shadow-sm"
                >
                  Sign in instead
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSecurityRegister;