import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Shield, User, Mail, Lock, Phone, Home, LogIn, Key, ArrowLeft, Clock } from "lucide-react";
// import SignupImage from "../../assets/signup.jpeg";
import OTPInput from "react-otp-input";
import Footer from "../../components/Footer";
import { useAuth } from "../../Context/AuthContext";

const ResidentSignup = () => {
  const [step, setStep] = useState(1); // 1: Basic info, 2: OTP verification
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const navigate = useNavigate();
    const { API } = useAuth();

  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    flat_no: "",
    role: "resident",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    flat_no: "",
  });

  // Timer countdown effect
  useEffect(() => {
    let interval;
    if (step === 2 && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      toast.error("OTP has expired. Please request a new one.");
    }
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const validateStep1 = () => {
    const newErrors = {
      name: !user.name ? "Name is required" : "",
      email: !user.email ? "Email is required" : !/^\S+@\S+\.\S+$/.test(user.email) ? "Invalid email format" : "",
      password: !user.password ? "Password is required" : user.password.length < 6 ? "Password must be at least 6 characters" : "",
      phone: !user.phone ? "Phone is required" : "",
      flat_no: !user.flat_no ? "Flat number is required" : "",
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Step 1: Submit basic info and request OTP
  const handleSubmitStep1 = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setIsLoading(true);
    const toastId = toast.loading("Sending OTP to your email...");

    try {
      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...user,
          flat_no: user.flat_no.toString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.update(toastId, {
          render: data.message || "OTP sent successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        setStep(2);
        setTimeLeft(300); // Reset timer
        setOtpExpiry(new Date(Date.now() + 300000)); // Set expiry 5 minutes from now
      } else {
        toast.update(toastId, {
          render: data.message || "Failed to send OTP",
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
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and complete registration
  const handleSubmitStep2 = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    if (timeLeft <= 0) {
      toast.error("OTP has expired. Please request a new one.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Verifying OTP and creating account...");

    try {
      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...user,
          flat_no: user.flat_no.toString(),
          otp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.update(toastId, {
          render: data.message || "Registration successful!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });

        if (data.token) {
          localStorage.setItem("token", data.token);
          navigate("/");
        }
      } else {
        toast.update(toastId, {
          render: data.message || "Registration failed",
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
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setIsLoading(true);
    const toastId = toast.loading("Resending OTP...");

    try {
      // First validate the email is present
      if (!user.email) {
        toast.error("Email is required to resend OTP");
        return;
      }

      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          password: user.password,
          phone: user.phone,
          flat_no: user.flat_no,
          role: user.role,
          // Don't include the OTP field for resend
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.update(toastId, {
          render: data.message || "New OTP sent successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        setTimeLeft(300); // Reset timer to 5 minutes
        setOtp(""); // Clear previous OTP
      } else {
        toast.update(toastId, {
          render: data.message || "Failed to resend OTP",
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
      console.error("Resend OTP error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 pt-24 pb-8">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <div className="flex flex-col md:flex-row">
            {/* Left Side - Image */}
            <div className="md:w-1/2 bg-gradient-to-b from-primary to-primary-dark hidden md:flex items-center justify-center p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-noise opacity-10"></div>
              <div className="text-center text-white relative z-10">
                <Shield className="h-16 w-16 mx-auto mb-4 animate-pulse" />
                <h1 className="text-3xl font-bold mb-2">
                  {step === 1 ? "Welcome Resident" : "Verify Your Email"}
                </h1>
                <p className="text-gray-200">
                  {step === 1
                    ? "Join your community's security network"
                    : "Enter the 6-digit code sent to your email"}
                </p>
                {/* <div className="mt-8 transform hover:scale-105 transition-transform duration-300">
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
              {step === 1 ? (
                <>
                  <div className="text-center mb-8">
                    <Shield className="h-10 w-10 text-secondary mx-auto animate-bounce" />
                    <h2 className="text-2xl font-bold text-primary mt-4">Resident Registration</h2>
                    <p className="text-gray-600 mt-2">Secure access to your community</p>
                  </div>

                  <form onSubmit={handleSubmitStep1} className="space-y-4">
                    <div className="space-y-1">
                      <label htmlFor="name" className="block text-sm font-medium text-primary">
                        Full Name
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
                          className={`block w-full pl-10 pr-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors`}
                        />
                      </div>
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="email" className="block text-sm font-medium text-primary">
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
                          value={user.email}
                          onChange={handleChange}
                          className={`block w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors`}
                        />
                      </div>
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="password" className="block text-sm font-medium text-primary">
                        Password
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
                          className={`block w-full pl-10 pr-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors`}
                        />
                      </div>
                      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="phone" className="block text-sm font-medium text-primary">
                        Phone Number
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
                          className={`block w-full pl-10 pr-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors`}
                        />
                      </div>
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="flat_no" className="block text-sm font-medium text-primary">
                        Flat Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Home className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="flat_no"
                          name="flat_no"
                          placeholder="A-101"
                          value={user.flat_no}
                          onChange={handleChange}
                          className={`block w-full pl-10 pr-3 py-2 border ${errors.flat_no ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors`}
                        />
                      </div>
                      {errors.flat_no && <p className="text-red-500 text-xs mt-1">{errors.flat_no}</p>}
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-secondary to-secondary-dark hover:from-secondary-dark hover:to-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'}`}
                      >
                        {isLoading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending OTP...
                          </span>
                        ) : 'Continue'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center text-gray-600 hover:text-primary mb-6 transition-colors group"
                  >
                    <ArrowLeft className="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Back
                  </button>

                  <div className="text-center mb-8">
                    <Key className="h-10 w-10 text-secondary mx-auto animate-bounce" />
                    <h2 className="text-2xl font-bold text-primary mt-4">Verify Your Email</h2>
                    <p className="text-gray-600 mt-2">
                      Enter the 6-digit code sent to <span className="font-medium text-primary">{user.email}</span>
                    </p>

                    <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>OTP expires in: </span>
                      <span className={`font-medium ml-1 ${timeLeft < 60 ? 'text-red-500' : 'text-secondary'}`}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitStep2} className="space-y-6">
                    <div className="flex justify-center">
                      <OTPInput
                        value={otp}
                        onChange={setOtp}
                        numInputs={6}
                        renderInput={(props) => (
                          <input
                            {...props}
                            disabled={timeLeft <= 0}
                            className={`w-12 h-12 mx-1 text-center text-2xl border ${timeLeft <= 0 ? 'border-gray-200 bg-gray-100' : 'border-gray-300 focus:border-secondary'
                              } rounded-none focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all appearance-none [-moz-appearance:textfield]`}
                            style={{
                              aspectRatio: "1/1", // Ensures perfect square
                              padding: "0", // Remove default padding
                            }}
                          />
                        )}
                        shouldAutoFocus={true}
                      />
                    </div>

                    <div className="space-y-4">
                      <button
                        type="submit"
                        disabled={isLoading || otp.length !== 6 || timeLeft <= 0}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-secondary to-secondary-dark hover:from-secondary-dark hover:to-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all ${isLoading || otp.length !== 6 || timeLeft <= 0 ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'}`}
                      >
                        {isLoading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Verifying...
                          </span>
                        ) : 'Complete Registration'}
                      </button>

                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={isLoading || timeLeft > 240} // Can resend after 1 minute
                        className={`w-full text-sm text-gray-600 hover:text-primary transition-colors flex items-center justify-center ${isLoading || timeLeft > 240 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isLoading ? 'Sending...' : "Didn't receive code?"}
                        {timeLeft > 240 && (
                          <span className="ml-1 text-xs text-gray-500">
                            (available in {formatTime(timeLeft - 240)})
                          </span>
                        )}
                        {!isLoading && timeLeft <= 240 && (
                          <span className="font-medium ml-1">Resend OTP</span>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Login Section */}
              {step === 1 && (
                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">
                        Already registered?
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/login")}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all hover:shadow-sm"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in to your account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ResidentSignup;