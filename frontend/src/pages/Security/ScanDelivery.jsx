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
  AlertCircle
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
      toast.error('Please login to continue');
      window.location.href = '/login';
      return {};
    }
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
      setLoading(true);
      
      // Correct endpoint is /scan (POST) with uniqueId in the body
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
              entryTime: response.data.delivery?.entryTime || new Date().toISOString()
            };
          }
          return delivery;
        }));
        
        // Reset modal state
        setShowActionModal(false);
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
      setLoading(false);
    }
  };

  // Handle manual ID scan
  const handleManualScan = async () => {
    if (!uniqueIdInput) {
      toast.error('Please enter a delivery code', { position: 'top-right', autoClose: 3000 });
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.post(
        `${API}/delivery/scan`,
        { 
          uniqueId: uniqueIdInput
        },
        getAuthHeaders()
      );
      
      if (response.status >= 200 && response.status < 300) {
        toast.success(response.data?.message || 'Delivery recorded successfully', { 
          position: 'top-right', 
          autoClose: 3000 
        });
        setUniqueIdInput('');
        fetchDeliveries(); // Refresh the list
      } else {
        throw new Error(response.data?.message || 'Scan failed');
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast.error(error.response?.data?.message || 'Invalid delivery code', { 
        position: 'top-right', 
        autoClose: 5000 
      });
    } finally {
      setLoading(false);
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
    if (filterStatus !== 'all' && filterStatus !== delivery.status) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (delivery.uniqueId?.toLowerCase().includes(searchLower)) ||
        (delivery.deliveryPersonName?.toLowerCase().includes(searchLower)) ||
        (delivery.deliveryCompany?.toLowerCase().includes(searchLower)) ||
        (delivery.apartment?.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  // Initial data fetch
  useEffect(() => {
    fetchDeliveries();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Shield className="text-blue-600" size={28} />
                Delivery Management
              </h1>
              <p className="text-gray-600 mt-1">Manage all delivery entries and exits</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchDeliveries}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  'Refresh'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Scan Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Delivery Scan</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter Delivery Code</label>
              <div className="relative">
                <input
                  type="text"
                  value={uniqueIdInput}
                  onChange={(e) => setUniqueIdInput(e.target.value)}
                  placeholder="Scan or enter delivery code..."
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                />
                <button
                  onClick={handleManualScan}
                  disabled={loading || !uniqueIdInput}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <ArrowRightCircle size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'approved', 'completed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1 rounded-lg text-sm capitalize ${
                      filterStatus === status
                        ? status === 'all' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : status === 'approved'
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : status === 'completed'
                              ? 'bg-gray-100 text-gray-800 border border-gray-300'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Deliveries</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400 h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, company, apartment, or code..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Deliveries Table Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Delivery', 'Details', 'Status', 'Timing', 'Actions'].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && deliveries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                      </div>
                    </td>
                  </tr>
                ) : filteredDeliveries.length ? (
                  filteredDeliveries.map((delivery) => (
                    <tr key={delivery._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{delivery.deliveryCompany}</div>
                            <div className="text-sm text-gray-500">Code: {delivery.uniqueId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{delivery.deliveryPersonName}</div>
                        <div className="text-sm text-gray-500">Apt: {delivery.apartment}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1 ${
                            delivery.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : delivery.status === 'completed'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {delivery.status?.toUpperCase()}
                          {getStatusIcon(delivery.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {delivery.expectedTime && (
                            <div className="text-gray-500">Expected: {formatDate(delivery.expectedTime)}</div>
                          )}
                          {delivery.entryTime && (
                            <div className="text-gray-500">Entered: {formatDate(delivery.entryTime)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-3">
                          {delivery.status === 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedDelivery(delivery);
                                setActionType('entry');
                                setShowActionModal(true);
                              }}
                              className="text-green-600 hover:text-green-900 transition-colors"
                            >
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
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              Mark Complete
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedDelivery(delivery);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No deliveries found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Modal (Entry/Exit) */}
        {showActionModal && selectedDelivery && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    {actionType === 'entry' ? 'Approve Delivery Entry' : 'Mark Delivery Complete'}
                  </h2>
                  <button
                    onClick={() => setShowActionModal(false)}
                    disabled={loading}
                    className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`p-3 rounded-lg ${
                        actionType === 'entry' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{selectedDelivery.deliveryCompany}</h3>
                      <p className="text-sm text-gray-600">
                        Code: {selectedDelivery.uniqueId}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Delivery Person</p>
                      <p className="font-medium text-sm">
                        {selectedDelivery.deliveryPersonName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Apartment</p>
                      <p className="font-medium text-sm">
                        {selectedDelivery.apartment}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-sm">
                        {selectedDelivery.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium text-sm">
                        {selectedDelivery.status?.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Expected Time</p>
                    <p className="font-medium text-sm">
                      {formatDate(selectedDelivery.expectedTime)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowActionModal(false)}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeliveryAction}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2 text-sm ${
                      actionType === 'entry'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } disabled:opacity-50`}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <>
                        {actionType === 'entry' ? (
                          <ArrowRightCircle size={18} />
                        ) : (
                          <ArrowLeftCircle size={18} />
                        )}
                        <span>{actionType === 'entry' ? 'Confirm Entry' : 'Confirm Exit'}</span>
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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Package className="text-blue-600" />
                    Delivery Details - {selectedDelivery.uniqueId}
                  </h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Company', value: selectedDelivery.deliveryCompany },
                      { label: 'Person', value: selectedDelivery.deliveryPersonName },
                      { label: 'Status', value: selectedDelivery.status, status: true }
                    ].map((item) => (
                      <div key={item.label} className="flex flex-col">
                        <p className="text-sm text-gray-500">{item.label}</p>
                        <p className="font-medium text-sm">
                          {item.status ? (
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                item.value === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : item.value === 'completed'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {item.value?.toUpperCase() || 'UNKNOWN'}
                            </span>
                          ) : (
                            item.value
                          )}
                        </p>
                      </div>
                    ))}
                    {[
                      { label: 'Apartment', value: selectedDelivery.apartment },
                      { label: 'Phone', value: selectedDelivery.phone },
                      { label: 'Expected Time', value: formatDate(selectedDelivery.expectedTime) }
                    ].map((item) => (
                      <div key={item.label} className="flex flex-col">
                        <p className="text-sm text-gray-500">{item.label}</p>
                        <p className="font-medium text-sm">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-800 mb-3">Delivery History</h3>
                  <div className="space-y-4">
                    <div className="border-l-2 border-blue-200 pl-4 py-2">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium flex items-center gap-2 text-sm">
                            <span className="text-gray-600">
                              <Clock className="inline mr-1" size={16} />
                              Request Created
                            </span>
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(selectedDelivery.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedDelivery.entryTime && (
                      <div className="border-l-2 border-blue-200 pl-4 py-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium flex items-center gap-2 text-sm">
                              <span className="text-green-600">
                                <ArrowRightCircle className="inline mr-1" size={16} />
                                Delivery Entered
                              </span>
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(selectedDelivery.entryTime)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedDelivery.status === 'completed' && (
                      <div className="border-l-2 border-blue-200 pl-4 py-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium flex items-center gap-2 text-sm">
                              <span className="text-red-600">
                                <ArrowLeftCircle className="inline mr-1" size={16} />
                                Delivery Completed
                              </span>
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(selectedDelivery.updatedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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