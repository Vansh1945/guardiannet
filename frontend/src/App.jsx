import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/Homepage";
import FeaturesSection from "./components/FeaturesSection";
import HowItWorks from "./components/HowItWorks";
import UserRoles from "./components/UserRoles";
import ContactUs from "./pages/ContactUs";
import Login from "./pages/Login";
import AboutUs from "./pages/About";
import ResidentRoutes from "./router/ResidentRoutes";
import SecurityRoutes from "./router/SecurityRoutes";
import ChangePassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import ResidentSignup from "./pages/Resident/ResidentRegister";
import AdminRoutes from "./router/AdminRoutes";
import AdminSecurityRegister from "./pages/Signup";

function App() {
  return (
    <>
      <Navbar />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/features" element={<FeaturesSection />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/user-roles" element={<UserRoles />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ChangePassword />} />
        <Route path="/resident-register" element={<ResidentSignup />} />
        <Route path="/admin-security-register" element={<AdminSecurityRegister />} />






        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/security/*" element={<SecurityRoutes />} />
          <Route path="/resident/*" element={<ResidentRoutes />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Route>
      </Routes>

    </>
  );
}

export default App;