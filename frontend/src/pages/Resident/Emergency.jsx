import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  AlertTriangle, Bell, CheckCircle, Clock, UserCheck, Info,
  MessageSquare, MapPin, Shield, Flame, UserX, DoorOpen,
  AlertOctagon, Menu, X, RefreshCcw, ChevronRight
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
      const promise = axios.get('${API}/profile/get-profile', getAuthHeaders());
      const response = await toast.promise(
        promise,
        
        { toastId: 'fetch-profile' }
      );

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
      const promise = axios.get(`${API_BASE_URL}/my-alerts`, getAuthHeaders());
      const response = await toast.promise(
        promise,
        {
          pending: 'Loading alerts...',
          success: 'Alerts loaded',
          error: {
            render({ data }) {
              return data.response?.data?.message || 'Failed to fetch alerts';
            }
          }
        },
        { toastId: 'fetch-alerts' }
      );

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
      const promise = axios.post(`${API_BASE_URL}/create-emergency`, payload, getAuthHeaders());
      const response = await toast.promise(
        promise,
        {
          pending: `Sending ${type} alert...`,
          success: `${type} alert sent to security and admin!`,
          error: {
            render({ data }) {
              return data.response?.data?.message || 'Failed to create alert';
            }
          }
        },
        { toastId: `create-alert-${type}` }
      );

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
        return <RefreshCcw className="text-blue-500 animate-spin" size={16} />;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <AlertOctagon className="mr-2 text-indigo-600" size={28} />
          EmergencyHub
        </h2>
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-2 rounded-full bg-indigo-100 hover:bg-indigo-200 transition"
        >
          {showMobileMenu ? <X size={24} className="text-indigo-600" /> : <Menu size={24} className="text-indigo-600" />}
        </button>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation - Glass Morphism Design */}
        <div className={`${showMobileMenu ? 'block' : 'hidden'} md:block md:w-1/4`}>
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/30 overflow-hidden">
            <div className="p-6">
              <h1 className="text-gray-800 text-2xl font-bold mb-6 hidden md:flex items-center">
                <AlertOctagon className="mr-2 text-indigo-600" size={28} />
                EmergencyHub
              </h1>
              <nav className="space-y-2">
                {['quickAlert', 'detailedAlert', 'history'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center p-3 rounded-xl text-left transition-all duration-300 ${
                      activeTab === tab
                        ? 'bg-indigo-100/80 text-indigo-700 font-semibold shadow-sm'
                        : 'text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    {tab === 'quickAlert' && <AlertTriangle className="mr-3 text-indigo-600" size={20} />}
                    {tab === 'detailedAlert' && <Bell className="mr-3 text-indigo-600" size={20} />}
                    {tab === 'history' && <MessageSquare className="mr-3 text-indigo-600" size={20} />}
                    <span className="font-medium">
                      {tab === 'quickAlert' ? 'Quick Alerts' : tab === 'detailedAlert' ? 'Detailed Report' : 'History'}
                    </span>
                    {tab === 'history' && notificationCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {notificationCount}
                      </span>
                    )}
                    <ChevronRight size={18} className="ml-auto opacity-70" />
                  </button>
                ))}
              </nav>
            </div>
            <div className="border-t border-white/30 p-4 bg-white/50">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mr-3 text-white font-bold">
                  {residentData?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{residentData?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">Resident - {residentData?.flat_no || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:w-3/4">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-8 border border-white/30">
            {/* Quick Alerts Tab */}
            {activeTab === 'quickAlert' && (
              <div>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Quick Emergency Response</h2>
                  <p className="text-gray-600">Trigger instant alerts with a single click</p>
                </div>

                {/* Location Setter - Card Design */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <MapPin className="mr-2 text-blue-600" size={20} /> Current Location
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="text"
                      placeholder="Enter or confirm your location..."
                      className="flex-grow p-3 rounded-lg bg-white border border-blue-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      value={quickLocation}
                      onChange={(e) => setQuickLocation(e.target.value)}
                    />
                    <button
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
                      onClick={() => setQuickLocation(residentData?.flat_no || '')}
                    >
                      Reset to Flat
                    </button>
                  </div>
                </div>

                {/* Emergency Buttons Grid - Modern Card Design */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { type: 'Fire', desc: 'Fire emergency! Evacuate immediately.', color: 'from-red-500 to-red-600', hover: 'from-red-600 to-red-700' },
                    { type: 'Security Threat', desc: 'Security threat detected. Stay alert.', color: 'from-yellow-500 to-yellow-600', hover: 'from-yellow-600 to-yellow-700' },
                    { type: 'Suspicious Person', desc: 'Suspicious person spotted. Be cautious.', color: 'from-purple-500 to-purple-600', hover: 'from-purple-600 to-purple-700' },
                    { type: 'Unauthorized Entry', desc: 'Unauthorized entry detected.', color: 'from-blue-500 to-blue-600', hover: 'from-blue-600 to-blue-700' },
                  ].map(({ type, desc, color, hover }) => (
                    <button
                      key={type}
                      onClick={() => handleQuickAlert(type, desc)}
                      disabled={!quickLocation}
                      className={`bg-gradient-to-r ${color} hover:${hover} text-white font-medium py-8 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed group`}
                    >
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 group-hover:bg-white/30 transition-all">
                        {getAlertTypeIcon(type)}
                      </div>
                      <span className="text-lg font-bold">{type.toUpperCase()}</span>
                      <span className="text-xs mt-2 text-white/80 text-center">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Alert Tab */}
            {activeTab === 'detailedAlert' && (
              <div>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">Detailed Emergency Report</h2>
                  <p className="text-gray-600">Submit a comprehensive emergency report</p>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 shadow-sm">
                    <div className="flex items-center">
                      <AlertTriangle className="mr-2" size={20} />
                      <strong>Error:</strong> {error}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Emergency Type*</label>
                    <select
                      className="w-full p-3 rounded-lg bg-white border border-blue-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Location*</label>
                    <input
                      type="text"
                      placeholder="e.g. Block A, 3rd Floor"
                      className="w-full p-3 rounded-lg bg-white border border-blue-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>

                  {selectedType === 'Other' && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                      <label className="block text-gray-700 text-sm font-medium mb-2">Custom Title *</label>
                      <input
                        type="text"
                        placeholder="Specify emergency type"
                        className="w-full p-3 rounded-lg bg-white border border-blue-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Description*</label>
                    <textarea
                      rows={5}
                      placeholder="Describe your emergency in detail..."
                      className="w-full p-3 rounded-lg bg-white border border-blue-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => handleAlert(selectedType)}
                      disabled={!selectedType || !location.trim() || !description.trim()}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 font-semibold px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">Alert History</h2>
                    <p className="text-gray-600">Track your previous emergency reports</p>
                  </div>
                  <button
                    onClick={fetchUserAlerts}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium p-3 px-6 rounded-lg flex items-center transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <RefreshCcw size={20} className="mr-2" />
                    Refresh
                  </button>
                </div>

                {error ? (
                  <div className="bg-white border border-red-200 rounded-xl p-8 text-center shadow-sm">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <AlertOctagon size={32} className="text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Alerts</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                      onClick={fetchUserAlerts}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md"
                    >
                      Try Again
                    </button>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <AlertOctagon size={32} className="text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Alerts Found</h3>
                    <p className="text-gray-600">You haven't submitted any emergency alerts yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div
                        key={alert._id}
                        className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getAlertTypeColor(alert.type)}`}>
                              {getAlertTypeIcon(alert.type)}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-800">
                                {alert.type === 'Other' ? alert.customTitle || 'Other' : alert.type}
                              </h3>
                              <p className="text-sm text-gray-600 flex items-center">
                                <MapPin size={16} className="mr-1" /> {alert.location}
                              </p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${alert.status === 'Pending' ? 'bg-orange-100 text-orange-800' : alert.status === 'Processing' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {getStatusIcon(alert.status)}
                            <span className="ml-1">{alert.status}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-4 pl-16">{alert.description || 'No description provided'}</p>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-gray-500 border-t border-gray-200 pt-3 mt-3 gap-2">
                          <div className="flex items-center">
                            <Clock size={14} className="mr-1" />
                            Reported: {formatDateTime(alert.createdAt)}
                          </div>
                          {alert.verifier && (
                            <div className="flex items-center">
                              <UserCheck size={14} className="mr-1" />
                              Handled by: {alert.verifier.name || 'Unknown'}
                            </div>
                          )}
                        </div>
                        {alert.actionTaken && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100">
                            <div className="font-semibold text-gray-700 mb-1">Action Taken:</div>
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