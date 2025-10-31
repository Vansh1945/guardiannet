import { Link } from "react-router-dom";
import { Shield, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-primary to-primary-dark text-white pt-12 pb-6 px-4 sm:px-6 border-t border-primary-light/30 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-secondary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-background to-gray-300 bg-clip-text text-transparent">
                Guardian<span className="font-extrabold">Net</span>
              </span>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed">
              Advanced security solutions for modern communities. Protecting what matters most with cutting-edge technology and 24/7 monitoring.
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200 uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-secondary mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-300 text-sm">123 Security Ave, Safetown, ST 12345</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-secondary mr-3 flex-shrink-0" />
                <a href="mailto:contact@guardiannet.com" className="text-gray-300 hover:text-white text-sm transition-colors">
                  contact@guardiannet.com
                </a>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-secondary mr-3 flex-shrink-0" />
                <a href="tel:+11234567890" className="text-gray-300 hover:text-white text-sm transition-colors">
                  +1 (123) 456-7890
                </a>
              </li>
            </ul>
            <div className="pt-2">
              <Link 
                to="/contact" 
                className="inline-block px-4 py-2 text-sm font-medium bg-secondary hover:bg-secondary-dark rounded-md text-white transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200 uppercase tracking-wider">Security Updates</h3>
            <p className="text-gray-300 text-sm">
              Subscribe to receive security tips and system updates.
            </p>
            <form className="space-y-3">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full px-4 py-2 bg-primary-light/50 border border-primary-light rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
                required
              />
              <button 
                type="submit" 
                className="w-full px-4 py-2 bg-secondary hover:bg-secondary-dark rounded-md text-white font-medium transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-primary-light/50 mt-10 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} GuardianNet Security Systems. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;