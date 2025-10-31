import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { Mail, Lock, Key, ArrowLeft } from "react-feather";
import OTPInput from "react-otp-input";
import { Clock } from "lucide-react";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0);
  const [success, setSuccess] = useState(false);
  const emailInputRef = useRef(null);

  // OTP validity period (5 minutes in seconds)
  const OTP_VALIDITY = 300;
  // Resend cooldown (30 seconds)
  const RESEND_COOLDOWN = 30;

  useEffect(() => {
    if (step === 2) {
      // Handle resend timer countdown
      if (resendTimer > 0) {
        const interval = setInterval(() => {
          setResendTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
      }

      // Handle OTP expiry countdown if OTP is entered
      if (otpExpiry > 0 && otp.length > 0) {
        const expiryInterval = setInterval(() => {
          setOtpExpiry((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(expiryInterval);
      }
    }
  }, [step, resendTimer, otpExpiry, otp]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const showToast = (message, type = "default") => {
    const options = {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    switch (type) {
      case "success":
        toast.success(message, options);
        break;
      case "error":
        toast.error(message, options);
        break;
      case "loading":
        return toast.loading(message, options);
      default:
        return toast(message, options);
    }
  };

  const requestOTP = async () => {
    if (!email) return showToast("Please enter your email", "error");
    if (!isValidEmail(email)) return showToast("Please enter a valid email address", "error");

    const toastId = showToast("Sending OTP...", "loading");
    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", { email });

      toast.update(toastId, {
        render: "OTP sent successfully! Valid for 5 minutes.",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      setStep(2);
      setResendTimer(RESEND_COOLDOWN);
      setOtpExpiry(OTP_VALIDITY);
    } catch (error) {
      console.error("OTP request error:", error);
      const errorMessage = error.response?.data?.message || "Failed to send OTP. Please try again.";

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const resendOTP = async () => {
    if (resendTimer > 0) return;

    const toastId = showToast("Resending OTP...", "loading");
    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", { email });

      toast.update(toastId, {
        render: "New OTP sent successfully! Valid for 5 minutes.",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      setResendTimer(RESEND_COOLDOWN);
      setOtpExpiry(OTP_VALIDITY);
      setOtp(""); // Clear previous OTP
    } catch (error) {
      console.error("Resend OTP error:", error);
      const errorMessage = error.response?.data?.message || "Failed to resend OTP. Please try again.";

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const changePassword = async () => {
    if (!newPassword || !confirmPassword) return showToast("Please enter and confirm your new password", "error");
    if (newPassword !== confirmPassword) return showToast("Passwords do not match", "error");
    if (newPassword.length < 8) return showToast("Password must be at least 8 characters", "error");
    if (otp.length !== 6) return showToast("Please enter a 6-digit OTP", "error");
    if (otpExpiry <= 0) return showToast("OTP has expired. Please request a new one", "error");

    const toastId = showToast("Updating password...", "loading");
    try {
      const response = await axios.post("http://localhost:5000/api/auth/reset-password", {
        email,
        otp,
        newPassword,
      });

      if (response.status === 200) {
        toast.update(toastId, {
          render: "Password changed successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    } catch (error) {
      console.error("Password change error:", error);
      let errorMessage = "Failed to change password. Please try again.";

      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data.message || "Invalid request. Please check your inputs.";
        } else if (error.response.status === 401) {
          errorMessage = "OTP expired or invalid. Please request a new OTP.";
        } else if (error.response.status === 404) {
          errorMessage = "User not found. Please check your email.";
        }
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      }

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen  bg-background flex items-center justify-center p-6">
        <div className="bg-white  rounded-xl shadow-lg p-8 w-full max-w-md text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-light/5 to-secondary/5"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-primary mb-3">Password Updated!</h2>

            <p className="text-gray-600 mb-6">
              Your password has been successfully changed. Redirecting to login...
            </p>

            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-secondary to-secondary-dark h-2 rounded-full animate-[progress_2s_linear]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen m-20  flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-md relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light/5 to-secondary/5"></div>
        <div className="relative z-10">
          {/* Header with steps */}
          <div className="py-8 px-8 text-center border-b border-gray-100">
            <h2 className="text-2xl font-bold text-primary mb-2">Reset Your Password</h2>
            <p className="text-gray-500 mb-6">Follow these steps to secure your account</p>

            <div className="flex justify-between items-center mb-8 px-4">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex flex-col items-center relative">
                  {stepNumber > 1 && (
                    <div className="absolute h-1 w-12 -left-12 top-4 bg-gray-200">
                      <div className={`h-1 ${step >= stepNumber ? "bg-gradient-to-r from-secondary to-secondary-dark" : "bg-gray-200"}`}></div>
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-300 ${step >= stepNumber
                      ? "bg-gradient-to-r from-secondary to-secondary-dark text-white shadow-md"
                      : "bg-gray-100 text-gray-400"
                    }`}>
                    {stepNumber}
                  </div>
                  <div className={`text-xs mt-2 font-medium ${step >= stepNumber ? "text-secondary" : "text-gray-400"
                    }`}>
                    {stepNumber === 1 ? "Email" : stepNumber === 2 ? "OTP" : "Password"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form content */}
          <div className="px-8 pb-8 pt-4">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-secondary">
                      <Mail className="h-5 w-5" />
                    </div>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white transition-all duration-200"
                      ref={emailInputRef}
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  onClick={requestOTP}
                  disabled={!email}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 ${!email
                      ? "bg-gray-400"
                      : "bg-gradient-to-r from-secondary to-secondary-dark hover:from-secondary-dark hover:to-secondary shadow-md"
                    }`}
                >
                  Send Verification Code
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center text-secondary hover:text-secondary-dark transition-colors duration-200 mb-2"
                >
                  <ArrowLeft className="w-5 h-5 mr-1" />
                  Back
                </button>

                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Key className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2">Enter Verification Code</h3>
                  <p className="text-gray-600">
                    Sent to <span className="font-semibold text-secondary">{email}</span>
                  </p>

                  {/* Combined timer display in a single row */}
                  <div className="flex justify-center gap-4 mt-4">
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className={`text-xs font-medium ${otpExpiry < 60 ? "text-red-500" : "text-gray-600"
                        }`}>
                        OTP expires: {formatTime(otpExpiry)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mb-6">
                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    numInputs={6}
                    renderInput={(props) => (
                      <input
                        {...props}
                        className="w-12 h-12 mx-1 text-center text-xl border-2 border-gray-300 rounded focus:ring-2 focus:ring-secondary focus:border-secondary transition-all duration-200"
                      />
                    )}
                    shouldAutoFocus
                  />
                </div>

                <button
                  onClick={() => setStep(3)}
                  disabled={otp.length !== 6 || otpExpiry <= 0}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 ${otp.length !== 6 || otpExpiry <= 0
                      ? "bg-gray-400"
                      : "bg-gradient-to-r from-secondary to-secondary-dark hover:from-secondary-dark hover:to-secondary shadow-md"
                    }`}
                >
                  Continue
                </button>

                <div className="text-center pt-2">
                  <p className="text-sm text-gray-500 mb-2">Didn't receive the code?</p>
                  <button
                    onClick={resendOTP}
                    disabled={resendTimer > 0}
                    className={`text-sm font-medium ${resendTimer > 0 ? 'text-gray-400' : 'text-secondary hover:text-secondary-dark'
                      } transition-colors duration-200`}
                  >
                    {resendTimer > 0 ? `Resend available in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center text-secondary hover:text-secondary-dark transition-colors duration-200 mb-2"
                >
                  <ArrowLeft className="w-5 h-5 mr-1" />
                  Back
                </button>

                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2">Create New Password</h3>
                  <p className="text-gray-600">
                    Your new password must be different from previous ones
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-secondary">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white transition-all duration-200"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Minimum 8 characters</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-secondary">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white transition-all duration-200"
                    />
                  </div>
                </div>

                <button
                  onClick={changePassword}
                  className="w-full py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-secondary to-secondary-dark hover:from-secondary-dark hover:to-secondary shadow-md transition-all duration-300"
                >
                  Reset Password
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default ResetPassword;