import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Shield, Key } from "lucide-react";
import { useAuth } from "../Context/AuthContext";

const Navbar = () => {
  const { isLoggedIn, logoutUser, user } = useAuth(); // Changed from LogoutUser to logoutUser
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser(); // Changed from LogoutUser to logoutUser
      setIsProfileDropdownOpen(false);
      setIsMobileMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  return (
    <nav className="bg-gradient-to-r from-primary to-primary-dark text-white fixed w-full top-0 left-0 shadow-lg z-50 border-b border-primary-light/20 h-16">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center h-full">
        {/* Logo/Brand */}
        <Link to="/" className="flex items-center space-x-2 group">
          <Shield className="h-8 w-8 text-secondary group-hover:text-white transition-colors" />
          <span className="text-2xl font-bold bg-gradient-to-r from-background to-gray-300 bg-clip-text text-transparent">
            Guardian<span className="font-extrabold">Net</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8">
          <NavLink
            to="/"
            className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-all ${isActive ? 'bg-primary-light/50 text-white' : 'text-gray-200 hover:text-white hover:bg-primary-light/30'}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-all ${isActive ? 'bg-primary-light/50 text-white' : 'text-gray-200 hover:text-white hover:bg-primary-light/30'}`}
          >
            About
          </NavLink>

          {isLoggedIn ? (
            <div className="flex items-center space-x-4 ml-4">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none group"
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-primary-light/70 flex items-center justify-center border border-secondary/30 group-hover:border-secondary/50 transition-all">
                      <User className="h-5 w-5 text-secondary" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-primary-dark"></span>
                  </div>
                  <span className="text-sm font-medium text-gray-200">{user?.name}</span>
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-primary-dark/95 backdrop-blur-sm rounded-lg shadow-xl py-1 z-50 border border-primary-light/50">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center px-4 py-3 text-sm text-red-300 hover:bg-primary-light/50 hover:text-red-200 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" /> Logout
                    </button>
                    <Link
                      to="/reset-password"
                      className="flex items-center px-4 py-3 text-sm text-gray-300 hover:bg-primary-light/50 transition-colors border-t border-primary-light/50"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <Key className="h-4 w-4 mr-3" /> Reset Password
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4 ml-4">
              <NavLink
                to="/login"
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-200 hover:text-white hover:bg-primary-light/30 transition-colors"
              >
                Login
              </NavLink>
              <NavLink
                to="/resident-register"
                className="px-4 py-2 rounded-md text-sm font-medium bg-secondary hover:bg-secondary-dark text-white transition-colors"
              >
                Get Started
              </NavLink>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="lg:hidden p-2 rounded-md text-gray-200 hover:text-white hover:bg-primary-light/30 focus:outline-none transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-primary-dark/95 backdrop-blur-sm border-t border-primary-light/50">
          <div className="px-4 pt-2 pb-4 space-y-1">
            <NavLink
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-primary-light/30"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </NavLink>
            <NavLink
              to="/about"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-primary-light/30"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </NavLink>

            {isLoggedIn ? (
              <div className="border-t border-primary-light/50 pt-4 mt-2 flex flex-col space-y-3">
                <button
                  onClick={handleLogout}
                  className="w-full text-center px-4 py-2 rounded-md text-base font-medium text-red-300 hover:text-red-200 hover:bg-primary-light/30"
                >
                  Logout
                </button>
                <NavLink
                  to="/reset-password"
                  className="w-full text-center px-4 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-primary-light/30"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Reset Password
                </NavLink>
              </div>
            ) : (
              <div className="border-t border-primary-light/50 pt-4 mt-2 flex flex-col space-y-3">
                <NavLink
                  to="/login"
                  className="w-full text-center px-4 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-primary-light/30"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </NavLink>
                <NavLink
                  to="/resident-register"
                  className="w-full text-center px-4 py-2 rounded-md text-base font-medium bg-secondary hover:bg-secondary-dark text-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </NavLink>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;