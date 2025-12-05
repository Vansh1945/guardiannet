import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  ArrowRightCircle,
  ArrowLeftCircle,
  Loader2,
  Shield,
  History,
  AlertCircle,
  Filter,
  Eye,
  User,
  Phone,
  Home,
  Calendar,
  X
} from 'lucide-react';
import { useAuth } from "../../Context/AuthContext";

const SecurityDeliveryManagement = () => {
  // State declarations
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionType, setActionType] = useState('entry');
  const [filterStatus, setFilterStatus] = useState('all');
  const [uniqueIdInput, setUniqueIdInput] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [scanError, setScanError] = useState('');
  const { API } = useAuth();

  // Enhanced auth headers with error handling
  const getAuthHeaders = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      return {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Please login to continue', { position: 'top-right', autoClose: 3000 });
      window.location.href = '/login';
      return {};
    }
  };

  // Validate scan input
  const validateScanInput = () => {
    if (!uniqueIdInput.trim()) {
      setScanError('Please enter a delivery code');
      return false;
    }
    if (uniqueIdInput.trim().length < 3) {
      setScanError('Delivery code must be at least 3 characters');
      return false;
    }
    setScanError('');
    return true;
  };

  // Fetch all deliveries with enhanced error handling
  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/delivery/all`,
        getAuthHeaders()
      );
      
      if (response.data?.deliveries) {
        setDeliveries(response.data.deliveries || []);
      } else {
        throw new Error(response.data?.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Delivery fetch error:', error);
      
      let errorMessage = 'Failed to load deliveries';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      toast.error(errorMessage, { position: 'top-right', autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  // Handle delivery entry/exit
  const handleDeliveryAction = async () => {
    if (!selectedDelivery) {
      toast.error('No delivery selected', { position: 'top-right', autoClose: 3000 });
      return;
    }
    
    try {
      setActionLoading(true);
      
      const response = await axios.post(
        `${API}/delivery/scan`,
        { 
          uniqueId: selectedDelivery.uniqueId
        },
        getAuthHeaders()
      );
      
      if (response.status >= 200 && response.status < 300) {
        const successMessage = response.data?.message || `Delivery ${actionType} recorded successfully`;
        toast.success(successMessage, { position: 'top-right', autoClose: 3000 });
        
        // Update the delivery's status in the local state
        setDeliveries(prevDeliveries => prevDeliveries.map(delivery => {
          if (delivery._id === selectedDelivery._id) {
            return {
              ...delivery,
              status: response.data.delivery?.status || 'approved',
              entryTime: response.data.delivery?.entryTime || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
          return delivery;
        }));
        
        // Reset modal state
        setShowActionModal(false);
        setSelectedDelivery(null);
      } else {
        throw new Error(response.data?.message || `Action ${actionType} failed`);
      }
    } catch (error) {
      console.error('Action error:', error);
      
      let errorMessage = `Failed to record ${actionType}`;
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid request. Please check the delivery status.';
        } else if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.request) {
        errorMessage = 'No response received from server';
      }
      
      toast.error(errorMessage, { position: 'top-right', autoClose: 5000 });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle manual ID scan
  const handleManualScan = async () => {
    if (!validateScanInput()) return;
    
    try {
      setScanLoading(true);
      const response = await axios.post(
        `${API}/delivery/scan`,
        { 
          uniqueId: uniqueIdInput.trim()
        },
        getAuthHeaders()
      );
      
      if (response.status >= 200 && response.status < 300) {
        toast.success(response.data?.message || 'Delivery recorded successfully', { 
          position: 'top-right', 
          autoClose: 3000 
        });
        setUniqueIdInput('');
        setScanError('');
      } else {
        throw new Error(response.data?.message || 'Scan failed');
      }
    } catch (error) {
      console.error('Scan error:', error);
      
      let errorMessage = 'Invalid delivery code';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setScanError(errorMessage);
      toast.error(errorMessage, { 
        position: 'top-right', 
        autoClose: 5000 
      });
    } finally {
      setScanLoading(false);
    }
  };

  // Format date with timezone consideration
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.error('Date formatting error:', e);
      return dateString;
    }
  };

  // Status icon component
  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'completed':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  // Filter deliveries
  const filteredDeliveries = deliveries.filter(delivery => {
    // Filter by status
    if (filterStatus !== 'all') {
      if (filterStatus !== delivery.status?.toLowerCase()) return false;
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      return (
        (delivery.uniqueId?.toLowerCase().includes(searchLower)) ||
        (delivery.deliveryPersonName?.toLowerCase().includes(searchLower)) ||
        (delivery.deliveryCompany?.toLowerCase().includes(searchLower)) ||
        (delivery.apartment?.toLowerCase().includes(searchLower)) ||
        (delivery.phone?.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  // Get stats
  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => d.status === 'pending').length,
    approved: deliveries.filter(d => d.status === 'approved').length,
    completed: deliveries.filter(d => d.status === 'completed').length
  };

  // Initial data fetch
  useEffect(() => {
    fetchDeliveries();
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-10xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary bg-opacity-10">
              <Shield className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">Security Delivery Management</h1>
              <p className="text-gray-600 text-sm md:text-base mt-1">Track and manage delivery entries, exits, and approvals</p>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header with Actions */}
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Quick Scan Input */}
                  <div className="flex-1 max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quick Delivery Scan
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={uniqueIdInput}
                        onChange={(e) => {
                          setUniqueIdInput(e.target.value);
                          if (scanError) setScanError('');
                        }}
                        placeholder="Enter or scan delivery code..."
                        className={`w-full pl-4 pr-12 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-colors text-sm ${
                          scanError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-transparent'
                        }`}
                        onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                      />
                      <button
                        onClick={handleManualScan}
                        disabled={scanLoading || !uniqueIdInput.trim()}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-secondary text-white rounded-lg disabled:opacity-50"
                      >
                        {scanLoading ? (
                          <Loader2 className="animate-spin h-4 w-4" />
                        ) : (
                          <ArrowRightCircle size={16} />
                        )}
                      </button>
                    </div>
                    {scanError && (
                      <p className="mt-2 text-xs text-red-600">{scanError}</p>
                    )}
                  </div>

                  {/* Filter Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                    >
                      <Filter size={16} />
                      Filters
                    </button>
                  </div>
                </div>

                {/* Filter Options */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
                        <div className="flex flex-wrap gap-2">
                          {['all', 'pending', 'approved', 'completed'].map((status) => (
                            <button
                              key={status}
                              onClick={() => setFilterStatus(status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                filterStatus === status
                                  ? status === 'all'
                                    ? 'bg-secondary text-white'
                                    : status === 'approved'
                                      ? 'bg-green-600 text-white'
                                      : status === 'completed'
                                        ? 'bg-gray-600 text-white'
                                        : 'bg-yellow-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {status === 'all' ? 'All Deliveries' : status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search Deliveries</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="text-gray-400 h-5 w-5" />
                          </div>
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by code, name, company, or apartment..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Stats Cards */}
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Deliveries */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Package className="text-gray-600" size={20} />
                  </div>
                </div>
              </div>
              
              {/* Pending */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <Clock className="text-yellow-600" size={20} />
                  </div>
                </div>
              </div>
              
              {/* Approved */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Approved</p>
                    <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-100">
                    <CheckCircle className="text-green-600" size={20} />
                  </div>
                </div>
              </div>
              
              {/* Completed */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-700">{stats.completed}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-100">
                    <XCircle className="text-gray-600" size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deliveries Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Details
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Person
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timing
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && deliveries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 md:px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="animate-spin h-10 w-10 text-secondary mb-3" />
                        <p className="text-gray-500">Loading deliveries...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredDeliveries.length ? (
                  filteredDeliveries.map((delivery) => (
                    <tr key={delivery._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-secondary/10 rounded-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <div className="ml-3 md:ml-4">
                            <div className="text-sm font-medium text-gray-900">{delivery.deliveryCompany || 'Unknown Company'}</div>
                            <div className="text-xs text-gray-500">Code: {delivery.uniqueId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{delivery.deliveryPersonName || 'Unknown'}</div>
                          <div className="text-gray-500 text-xs mt-1">
                            Apt: {delivery.apartment || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                              delivery.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : delivery.status === 'completed'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {delivery.status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                          {getStatusIcon(delivery.status)}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {delivery.expectedTime && (
                            <div className="text-gray-500 text-xs">
                              Expected: {formatDate(delivery.expectedTime)}
                            </div>
                          )}
                          {delivery.entryTime && (
                            <div className="text-gray-500 text-xs mt-1">
                              Entered: {formatDate(delivery.entryTime)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                          {delivery.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedDelivery(delivery);
                                setActionType('entry');
                                setShowActionModal(true);
                              }}
                              className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                              disabled={actionLoading}
                            >
                              <ArrowRightCircle size={14} />
                              Approve Entry
                            </button>
                          )}
                          {delivery.status === 'approved' && (
                            <button
                              onClick={() => {
                                setSelectedDelivery(delivery);
                                setActionType('exit');
                                setShowActionModal(true);
                              }}
                              className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                              disabled={actionLoading}
                            >
                              <ArrowLeftCircle size={14} />
                              Mark Complete
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedDelivery(delivery);
                              setShowDetailsModal(true);
                            }}
                            className="px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                          >
                            <Eye size={14} />
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 md:px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center py-8">
                        <Package className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No deliveries found</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {searchTerm.trim() || filterStatus !== 'all' 
                            ? 'Try adjusting your search or filter criteria' 
                            : 'No deliveries have been registered yet'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          {filteredDeliveries.length > 0 && (
            <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
                <div>
                  Showing <span className="font-medium">{filteredDeliveries.length}</span> of{' '}
                  <span className="font-medium">{deliveries.length}</span> deliveries
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span>Pending: {stats.pending}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Approved: {stats.approved}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    <span>Completed: {stats.completed}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Modal (Entry/Exit) */}
        {showActionModal && selectedDelivery && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-primary">
                    {actionType === 'entry' ? 'Approve Delivery Entry' : 'Mark Delivery Complete'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowActionModal(false);
                      setSelectedDelivery(null);
                    }}
                    disabled={actionLoading}
                    className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{selectedDelivery.deliveryCompany || 'Unknown Company'}</h3>
                      <p className="text-sm text-gray-600">
                        Code: {selectedDelivery.uniqueId}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Delivery Person</p>
                      <p className="font-medium text-sm flex items-center gap-1">
                        <User size={14} />
                        {selectedDelivery.deliveryPersonName || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Apartment</p>
                      <p className="font-medium text-sm flex items-center gap-1">
                        <Home size={14} />
                        {selectedDelivery.apartment || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Phone</p>
                      <p className="font-medium text-sm flex items-center gap-1">
                        <Phone size={14} />
                        {selectedDelivery.phone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Current Status</p>
                      <p className="font-medium text-sm capitalize">
                        {selectedDelivery.status}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Expected Time</p>
                    <p className="font-medium text-sm flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(selectedDelivery.expectedTime)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowActionModal(false);
                      setSelectedDelivery(null);
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeliveryAction}
                    disabled={actionLoading}
                    className={`px-4 py-2.5 rounded-lg text-white transition-colors flex items-center gap-2 text-sm ${
                      actionType === 'entry'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } disabled:opacity-50`}
                  >
                    {actionLoading ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <>
                        {actionType === 'entry' ? (
                          <ArrowRightCircle size={16} />
                        ) : (
                          <ArrowLeftCircle size={16} />
                        )}
                        <span>{actionType === 'entry' ? 'Confirm Entry' : 'Confirm Complete'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedDelivery && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-primary">Delivery Details</h2>
                      <p className="text-gray-600 text-sm">Code: {selectedDelivery.uniqueId}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Company</p>
                    <p className="font-medium">{selectedDelivery.deliveryCompany || 'Unknown Company'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <p className="font-medium">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedDelivery.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : selectedDelivery.status === 'completed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedDelivery.status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Apartment</p>
                    <p className="font-medium">{selectedDelivery.apartment || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Delivery Person</h3>
                      <p className="text-gray-900 flex items-center gap-2">
                        <User size={16} />
                        {selectedDelivery.deliveryPersonName || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h3>
                      <p className="text-gray-900 flex items-center gap-2">
                        <Phone size={16} />
                        {selectedDelivery.phone || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Expected Time</h3>
                      <p className="text-gray-900 flex items-center gap-2">
                        <Calendar size={16} />
                        {formatDate(selectedDelivery.expectedTime)}
                      </p>
                    </div>
                    {selectedDelivery.entryTime && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Entry Time</h3>
                        <p className="text-gray-900 flex items-center gap-2">
                          <ArrowRightCircle size={16} />
                          {formatDate(selectedDelivery.entryTime)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <History size={18} />
                    Delivery Timeline
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-2 border-secondary pl-4 py-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Clock className="text-gray-500" size={16} />
                          <span className="font-medium text-sm">Request Created</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(selectedDelivery.createdAt)}
                        </span>
                      </div>
                    </div>

                    {selectedDelivery.entryTime && (
                      <div className="border-l-2 border-secondary pl-4 py-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ArrowRightCircle className="text-green-500" size={16} />
                            <span className="font-medium text-sm">Delivery Entered</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(selectedDelivery.entryTime)}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedDelivery.status === 'completed' && (
                      <div className="border-l-2 border-secondary pl-4 py-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ArrowLeftCircle className="text-red-500" size={16} />
                            <span className="font-medium text-sm">Delivery Completed</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(selectedDelivery.updatedAt)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityDeliveryManagement;