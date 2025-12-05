import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  AlertTriangle, Bell, CheckCircle, Clock, UserCheck, Info,
  MessageSquare, MapPin, Shield, Flame, UserX, DoorOpen,
  AlertOctagon, Menu, X, ChevronRight
} from 'lucide-react';
import { useAuth } from "../../Context/AuthContext";

const EmergencyAlert = () => {
  const [alerts, setAlerts] = useState([]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [error, setError] = useState(null);
  const [quickLocation, setQuickLocation] = useState('');
  const [activeTab, setActiveTab] = useState('quickAlert');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [residentData, setResidentData] = useState(null);
  const { API } = useAuth();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to continue', { toastId: 'auth-error' });
      return {};
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  };

  // Fetch resident data for automatic location and phone
  const fetchResidentData = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API}/profile/get-profile`, getAuthHeaders());
      
      const resident = response.data.user || response.data.data || response.data;
      if (!resident._id || !resident.flat_no) {
        throw new Error('Resident data missing _id or flat_no');
      }
      setResidentData(resident);
      setQuickLocation(resident.flat_no);
      setLocation(resident.flat_no);
    } catch (error) {
      console.error('Error fetching resident data:', error);
      setError(error.message || 'Failed to load resident information');
    }
  };

  // Fetch user's alerts
  const fetchUserAlerts = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API}/emergency/my-alerts`, getAuthHeaders());

      const alertsData = response.data.data || [];
      setAlerts(alertsData);
      setNotificationCount(alertsData.filter(alert => alert.status === 'Pending').length);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError(error.response?.data?.message || 'Failed to fetch alerts');
    }
  };

  // Create alert
  const createAlert = async (type, alertLocation, alertDescription, alertCustomTitle = undefined) => {
    try {
      setError(null);
      const payload = {
        type,
        location: alertLocation,
        description: alertDescription,
        customTitle: alertCustomTitle,
      };
      const response = await axios.post(`${API}/emergency/create-emergency`, payload, getAuthHeaders());

      toast.success(`${type} alert sent to security and admin!`, {
        position: "top-right",
        autoClose: 3000,
      });

      setAlerts(prevAlerts => [response.data.data, ...prevAlerts]);
      setNotificationCount(prev => prev + 1);

      // Reset form
      if (type === selectedType) {
        setDescription('');
        setLocation(residentData?.flat_no || '');
        setCustomTitle('');
        setSelectedType('');
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error(error.response?.data?.message || 'Failed to create alert', {
        position: "top-right",
        autoClose: 3000,
      });
      setError(error.response?.data?.message || 'Failed to create alert');
    }
  };

  // Handle detailed alert submission
  const handleAlert = async (type) => {
    if (!description.trim() || !location.trim()) {
      toast.error('Description and location are required', { toastId: 'validation-error' });
      return;
    }
    if (type === 'Other' && !customTitle.trim()) {
      toast.error('Custom title is required for "Other" type', { toastId: 'custom-title-error' });
      return;
    }
    await createAlert(type, location, description, type === 'Other' ? customTitle : undefined);
  };

  // Handle quick alert with automatic location
  const handleQuickAlert = async (type, defaultDescription) => {
    const alertLocation = quickLocation || residentData?.flat_no || '';
    if (!alertLocation) {
      toast.error('Location is required. Please set your location or ensure resident data is loaded.', { toastId: 'location-error' });
      return;
    }
    await createAlert(type, alertLocation, defaultDescription);
  };

  // Polling for alert updates
  useEffect(() => {
    fetchResidentData();
    fetchUserAlerts();
    const interval = setInterval(fetchUserAlerts, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Format date
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="text-orange-500" size={16} />;
      case 'Processing':
        return <Info className="text-secondary animate-pulse" size={16} />;
      case 'Resolved':
        return <CheckCircle className="text-green-600" size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  // Alert type icon
  const getAlertTypeIcon = (type) => {
    switch (type) {
      case 'Fire':
        return <Flame className="text-red-600" size={24} />;
      case 'Security Threat':
        return <Shield className="text-yellow-600" size={24} />;
      case 'Suspicious Person':
        return <UserX className="text-purple-600" size={24} />;
      case 'Unauthorized Entry':
        return <DoorOpen className="text-blue-600" size={24} />;
      default:
        return <AlertTriangle className="text-gray-600" size={24} />;
    }
  };

  // Emergency type colors
  const getAlertTypeColor = (type) => {
    switch (type) {
      case 'Fire':
        return 'bg-red-100 text-red-800';
      case 'Security Threat':
        return 'bg-yellow-100 text-yellow-800';
      case 'Suspicious Person':
        return 'bg-purple-100 text-purple-800';
      case 'Unauthorized Entry':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-primary flex items-center">
          <AlertOctagon className="mr-2 text-secondary" size={24} />
          EmergencyHub
        </h2>
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-2 rounded-full bg-secondary/10 hover:bg-secondary/20 transition"
          aria-label={showMobileMenu ? "Close menu" : "Open menu"}
        >
          {showMobileMenu ? <X size={20} className="text-secondary" /> : <Menu size={20} className="text-secondary" />}
        </button>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 lg:gap-8">
        {/* Sidebar Navigation */}
        <div className={`${showMobileMenu ? 'block' : 'hidden'} md:block md:w-full md:max-w-xs lg:w-1/4`}>
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-6">
              <h1 className="text-primary text-xl sm:text-2xl font-bold mb-4 hidden md:flex items-center">
                <AlertOctagon className="mr-2 text-secondary" size={24} />
                EmergencyHub
              </h1>
              <nav className="space-y-1 sm:space-y-2">
                {[
                  { id: 'quickAlert', label: 'Quick Alerts', icon: AlertTriangle },
                  { id: 'detailedAlert', label: 'Detailed Report', icon: Bell },
                  { id: 'history', label: 'History', icon: MessageSquare }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setActiveTab(id);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center p-3 rounded-lg sm:rounded-xl text-left transition-all duration-200 ${
                      activeTab === id
                        ? 'bg-primary-light/10 text-primary-dark font-semibold shadow-sm'
                        : 'text-text hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="mr-3 text-secondary" size={18} />
                    <span className="font-medium text-sm sm:text-base">{label}</span>
                    {id === 'history' && notificationCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                        {notificationCount}
                      </span>
                    )}
                    <ChevronRight size={16} className="ml-auto opacity-70" />
                  </button>
                ))}
              </nav>
            </div>
            <div className="border-t border-gray-200 p-3 sm:p-4 bg-gray-50">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mr-3 text-white font-bold text-sm sm:text-base">
                  {residentData?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-primary truncate max-w-[120px] sm:max-w-none">
                    {residentData?.name || 'User'}
                  </p>
                  <p className="text-xs text-text/70">Resident - {residentData?.flat_no || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 md:w-3/4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md p-4 sm:p-6 lg:p-8 border border-gray-200">
            {/* Quick Alerts Tab */}
            {activeTab === 'quickAlert' && (
              <div>
                <div className="mb-4 sm:mb-6 lg:mb-8">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary mb-1 sm:mb-2">Quick Emergency Response</h2>
                  <p className="text-text/70 text-sm sm:text-base">Trigger instant alerts with a single click</p>
                </div>

                {/* Location Setter */}
                <div className="bg-primary/5 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8 border border-primary/10">
                  <h3 className="text-base sm:text-lg font-semibold text-primary mb-2 sm:mb-3 flex items-center">
                    <MapPin className="mr-2 text-secondary" size={18} /> Current Location
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <input
                      type="text"
                      placeholder="Enter or confirm your location..."
                      className="flex-grow p-3 rounded-lg bg-white border border-primary/20 text-text placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition text-sm sm:text-base"
                      value={quickLocation}
                      onChange={(e) => setQuickLocation(e.target.value)}
                    />
                    <button
                      className="bg-secondary hover:bg-secondary-dark text-white font-medium py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 shadow hover:shadow-md flex items-center justify-center whitespace-nowrap text-sm sm:text-base"
                      onClick={() => setQuickLocation(residentData?.flat_no || '')}
                    >
                      Reset to Flat
                    </button>
                  </div>
                </div>

                {/* Emergency Buttons Grid */}
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {[
                    { type: 'Fire', desc: 'Fire emergency! Evacuate immediately.', bg: 'bg-red-500', hover: 'hover:bg-red-600' },
                    { type: 'Security Threat', desc: 'Security threat detected. Stay alert.', bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600' },
                    { type: 'Suspicious Person', desc: 'Suspicious person spotted. Be cautious.', bg: 'bg-purple-500', hover: 'hover:bg-purple-600' },
                    { type: 'Unauthorized Entry', desc: 'Unauthorized entry detected.', bg: 'bg-blue-500', hover: 'hover:bg-blue-600' },
                  ].map(({ type, desc, bg, hover }) => (
                    <button
                      key={type}
                      onClick={() => handleQuickAlert(type, desc)}
                      disabled={!quickLocation}
                      className={`${bg} ${hover} text-white font-medium py-4 sm:py-6 px-3 rounded-lg sm:rounded-xl shadow hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:shadow group`}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-white/20 flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 group-hover:bg-white/30 transition-all">
                        {getAlertTypeIcon(type)}
                      </div>
                      <span className="text-sm sm:text-base lg:text-lg font-bold mb-1">{type.toUpperCase()}</span>
                      <span className="text-xs text-white/80 text-center hidden sm:block">{desc}</span>
                      <span className="text-xs text-white/80 text-center sm:hidden">{type}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Alert Tab */}
            {activeTab === 'detailedAlert' && (
              <div>
                <div className="mb-4 sm:mb-6 lg:mb-8">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary mb-1 sm:mb-2">Detailed Emergency Report</h2>
                  <p className="text-text/70 text-sm sm:text-base">Submit a comprehensive emergency report</p>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                    <div className="flex items-center">
                      <AlertTriangle className="mr-2" size={18} />
                      <span className="text-sm sm:text-base"><strong>Error:</strong> {error}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                  <div className="bg-primary/5 p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-primary/10">
                    <label className="block text-primary text-sm sm:text-base font-medium mb-2">Emergency Type*</label>
                    <select
                      className="w-full p-3 rounded-lg bg-white border border-primary/20 text-text focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition text-sm sm:text-base"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      required
                    >
                      <option value="">Select type</option>
                      {['Fire', 'Security Threat', 'Suspicious Person', 'Unauthorized Entry', 'Other'].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-primary/5 p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-primary/10">
                    <label className="block text-primary text-sm sm:text-base font-medium mb-2">Location*</label>
                    <input
                      type="text"
                      placeholder="e.g. Block A, 3rd Floor"
                      className="w-full p-3 rounded-lg bg-white border border-primary/20 text-text placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition text-sm sm:text-base"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>

                  {selectedType === 'Other' && (
                    <div className="bg-primary/5 p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-primary/10">
                      <label className="block text-primary text-sm sm:text-base font-medium mb-2">Custom Title*</label>
                      <input
                        type="text"
                        placeholder="Specify emergency type"
                        className="w-full p-3 rounded-lg bg-white border border-primary/20 text-text placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition text-sm sm:text-base"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="bg-primary/5 p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-primary/10">
                    <label className="block text-primary text-sm sm:text-base font-medium mb-2">Description*</label>
                    <textarea
                      rows={3}
                      className="w-full p-3 rounded-lg bg-white border border-primary/20 text-text placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition resize-y text-sm sm:text-base"
                      placeholder="Describe your emergency in detail..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="pt-2 sm:pt-4">
                    <button
                      onClick={() => handleAlert(selectedType)}
                      disabled={!selectedType || !location.trim() || !description.trim()}
                      className="w-full bg-secondary hover:bg-secondary-dark text-white py-3 sm:py-4 font-semibold px-6 rounded-lg shadow hover:shadow-lg transition-all duration-300 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:shadow text-sm sm:text-base"
                    >
                      <Bell className="mr-2" size={18} />
                      Submit Emergency Report
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <div className="mb-4 sm:mb-6 lg:mb-8">
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary mb-1 sm:mb-2">Alert History</h2>
                    <p className="text-text/70 text-sm sm:text-base">Track your previous emergency reports</p>
                  </div>
                </div>

                {error ? (
                  <div className="bg-white border border-red-200 rounded-xl p-4 sm:p-6 lg:p-8 text-center">
                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <AlertOctagon size={24} className="text-red-600 sm:size-8" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-primary mb-2">Error Loading Alerts</h3>
                    <p className="text-text/70 mb-4 sm:mb-6 text-sm sm:text-base">{error}</p>
                    <button
                      onClick={fetchUserAlerts}
                      className="bg-secondary hover:bg-secondary-dark text-white px-4 sm:px-6 py-2 rounded-lg transition-all duration-300 shadow hover:shadow-md text-sm sm:text-base"
                    >
                      Try Again
                    </button>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 lg:py-12 bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <AlertOctagon size={24} className="text-gray-600 sm:size-8" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-primary mb-2">No Alerts Found</h3>
                    <p className="text-text/70 text-sm sm:text-base">You haven't submitted any emergency alerts yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {alerts.map((alert) => (
                      <div
                        key={alert._id}
                        className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center ${getAlertTypeColor(alert.type)}`}>
                              {getAlertTypeIcon(alert.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-bold text-primary truncate">
                                {alert.type === 'Other' ? alert.customTitle || 'Other' : alert.type}
                              </h3>
                              <p className="text-sm text-text/70 flex items-center mt-1 truncate">
                                <MapPin size={14} className="mr-1 flex-shrink-0" /> 
                                <span className="truncate">{alert.location}</span>
                              </p>
                            </div>
                          </div>
                          <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center mt-2 sm:mt-0 ${alert.status === 'Pending' ? 'bg-orange-100 text-orange-800' : alert.status === 'Processing' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {getStatusIcon(alert.status)}
                            <span className="ml-1">{alert.status}</span>
                          </div>
                        </div>
                        <p className="text-text/80 text-sm sm:text-base mb-3 sm:mb-4 pl-0 sm:pl-14 lg:pl-16 break-words">
                          {alert.description || 'No description provided'}
                        </p>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-text/60 border-t border-gray-200 pt-2 sm:pt-3 mt-2 sm:mt-3 gap-1 sm:gap-2">
                          <div className="flex items-center">
                            <Clock size={12} className="mr-1 flex-shrink-0" />
                            <span className="truncate">Reported: {formatDateTime(alert.createdAt)}</span>
                          </div>
                          {alert.verifier && (
                            <div className="flex items-center">
                              <UserCheck size={12} className="mr-1 flex-shrink-0" />
                              <span className="truncate">Handled by: {alert.verifier.name || 'Unknown'}</span>
                            </div>
                          )}
                        </div>
                        {alert.actionTaken && (
                          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 rounded-lg text-sm text-text/80 border border-gray-100">
                            <div className="font-semibold text-primary mb-1">Action Taken:</div>
                            {alert.actionTaken}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAlert;