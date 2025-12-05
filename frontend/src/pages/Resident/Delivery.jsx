import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import {
  Truck, Package, Clock, X, Calendar, Search, Home, User,
  ArrowRightCircle, Plus, Edit, Trash2, ChevronLeft, ChevronRight, List,
  MoreVertical, Filter, Phone, Mail, CheckCircle, AlertCircle, ChevronDown
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DELIVERY_COMPANIES = [
  'Amazon', 'Flipkart', 'DHL', 'FedEx', 'Blue Dart',
  'DTDC', 'Swiggy Instamart', 'Zomato', 'Other'
];
import { useAuth } from "../../Context/AuthContext";

const PhoneInput = ({ value, onChange, error }) => {
  const [digits, setDigits] = useState(value.replace(/^\+91/, '') || '');

  useEffect(() => {
    setDigits(value.replace(/^\+91/, '') || '');
  }, [value]);

  const handleChange = (e) => {
    const input = e.target.value.replace(/\D/g, '').slice(0, 10);
    setDigits(input);
    onChange(`+91${input}`);
  };

  return (
    <div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">+91</span>
        <input
          type="text"
          value={digits}
          onChange={handleChange}
          className={`w-full pl-12 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-base ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter 10-digit number"
          required
          pattern="[0-9]{10}"
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

const DeliveryLogs = ({ logs }) => {
  return (
    <div className="mt-4 md:mt-6 bg-gray-50 p-3 md:p-4 rounded-lg border border-gray-200">
      <h3 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
        <List size={16} className="md:size-5" /> Delivery Activity Log
      </h3>
      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm md:text-base">No activity recorded yet</p>
        ) : (
          <div className="border-l-2 border-blue-200 pl-3 md:pl-4 space-y-4">
            {logs.map((log, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-2.5 top-2 h-2 w-2 rounded-full bg-blue-500"></div>
                <div className="ml-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium capitalize text-sm md:text-base">{log.action}</span>
                    <span className="text-xs md:text-sm text-gray-500 mt-1 sm:mt-0">
                      {new Date(log.time).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">{log.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DeliveryManagement = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [deliveries, setDeliveries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentDelivery, setCurrentDelivery] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [phoneError, setPhoneError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState([]);
  const [resident, setResident] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileActionMenu, setMobileActionMenu] = useState(null);
  const [showMobileTabs, setShowMobileTabs] = useState(false);
  const navigate = useNavigate();
  const { API } = useAuth();
  const [deliveryForm, setDeliveryForm] = useState({
    deliveryPersonName: '',
    phone: '+91',
    apartment: '',
    deliveryCompany: '',
    expectedTime: new Date()
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to continue', { position: 'top-right', autoClose: 5000 });
      navigate('/login');
      return null;
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchResidentData = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return null;

      const response = await axios.get(`${API}/profile/get-profile`, headers);
      const residentData = response.data.data || response.data.user || response.data;
      if (!residentData._id || !residentData.flat_no) {
        throw new Error('Resident data missing _id or flat_no');
      }
      setResident(residentData);
      setDeliveryForm(prev => ({
        ...prev,
        apartment: residentData.flat_no
      }));
      return residentData;
    } catch (error) {
      console.error('Error fetching resident data:', error);
      toast.error(error.response?.data?.message || 'Failed to load resident information', {
        position: 'top-right',
        autoClose: 5000
      });
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeliveries = async () => {
    setIsLoading(true);
    try {
      const resident = await fetchResidentData();
      if (!resident) return;

      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.get(
        `${API}/delivery/all`,
        {
          ...headers,
          params: { residentId: resident._id }
        }
      );

      const residentDeliveries = response.data.deliveries || response.data.data || [];
      const validDeliveries = residentDeliveries.filter(delivery =>
        delivery && typeof delivery.status === 'string'
      );
      setDeliveries(validDeliveries);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast.error(error.response?.data?.message || 'Failed to load deliveries', {
        position: 'top-right',
        autoClose: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeliveryLogs = async (deliveryId) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.get(
        `${API}/delivery/logs/${deliveryId}`,
        headers
      );
      setLogs(response.data.logHistory || []);
    } catch (error) {
      console.error('Error fetching delivery logs:', error);
      toast.error(error.response?.data?.message || 'Failed to load delivery logs', {
        position: 'top-right',
        autoClose: 5000
      });
      setLogs([]);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!deliveryForm.deliveryPersonName.trim()) {
      errors.name = 'Delivery person name is required';
    }
    if (!/^\+91\d{10}$/.test(deliveryForm.phone)) {
      errors.phone = 'Phone number must be 10 digits';
    }
    if (!deliveryForm.deliveryCompany) {
      errors.company = 'Delivery company is required';
    }
    if (!deliveryForm.apartment) {
      errors.apartment = 'Apartment number is required';
    }
    setPhoneError(errors.phone || '');
    return Object.keys(errors).length === 0;
  };

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    if (!resident || !resident._id) {
      toast.error('Resident data not loaded', { position: 'top-right', autoClose: 5000 });
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the form errors', { position: 'top-right', autoClose: 5000 });
      return;
    }

    const toastId = toast.loading('Creating delivery request...');
    setIsSending(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const payload = {
        ...deliveryForm,
        residentId: resident._id,
        expectedTime: deliveryForm.expectedTime.toISOString()
      };

      const response = await axios.post(`${API}/delivery/create`, payload, headers);
      setCurrentDelivery(response.data.delivery);
      setDeliveryForm({
        deliveryPersonName: '',
        phone: '+91',
        apartment: resident.flat_no,
        deliveryCompany: '',
        expectedTime: new Date()
      });
      setShowForm(false);
      await fetchDeliveries();

      toast.update(toastId, {
        render: 'Delivery request created successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error creating delivery:', error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to create delivery';
      toast.update(toastId, {
        render: errorMessage,
        type: 'error',
        isLoading: false,
        autoClose: 5000
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateDelivery = async (e) => {
    e.preventDefault();
    if (!currentDelivery || !currentDelivery._id) return;

    if (!validateForm()) {
      toast.error('Please fix the form errors', { position: 'top-right', autoClose: 5000 });
      return;
    }

    const toastId = toast.loading('Updating delivery request...');
    setIsSending(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const payload = {
        ...deliveryForm,
        expectedTime: deliveryForm.expectedTime.toISOString()
      };

      const response = await axios.put(
        `${API}/delivery/edit/${currentDelivery._id}`,
        payload,
        headers
      );
      setCurrentDelivery(response.data.delivery);
      setDeliveryForm({
        deliveryPersonName: '',
        phone: '+91',
        apartment: resident.flat_no,
        deliveryCompany: '',
        expectedTime: new Date()
      });
      setShowForm(false);
      await fetchDeliveries();

      toast.update(toastId, {
        render: 'Delivery updated successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error updating delivery:', error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update delivery';
      toast.update(toastId, {
        render: errorMessage,
        type: 'error',
        isLoading: false,
        autoClose: 5000
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteDelivery = async (id) => {
    if (!window.confirm('Are you sure you want to delete this delivery request?')) return;

    const toastId = toast.loading('Deleting delivery request...');
    setIsSending(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.delete(`${API}/delivery/delete/${id}`, headers);
      if (currentDelivery && currentDelivery._id === id) {
        setCurrentDelivery(null);
        setLogs([]);
      }
      await fetchDeliveries();

      toast.update(toastId, {
        render: 'Delivery deleted successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error deleting delivery:', error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to delete delivery';
      toast.update(toastId, {
        render: errorMessage,
        type: 'error',
        isLoading: false,
        autoClose: 5000
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    if (!delivery || !delivery.status) return false;
    const matchesSearch =
      (delivery.deliveryPersonName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       delivery.phone?.includes(searchTerm) ||
       delivery.deliveryCompany?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDate =
      !selectedDate ||
      (delivery.expectedTime &&
       new Date(delivery.expectedTime).toDateString() === selectedDate.toDateString());

    return activeTab === 'active'
      ? matchesSearch && matchesDate && delivery.status !== 'completed'
      : matchesSearch && matchesDate && delivery.status === 'completed';
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDeliveries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      return new Date(timeString).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
      return new Date(dateTimeString).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  useEffect(() => {
    if (currentDelivery?._id) {
      fetchDeliveryLogs(currentDelivery._id);
    } else {
      setLogs([]);
    }
  }, [currentDelivery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDate, activeTab]);

  // Mobile Actions Dropdown
  const MobileActionsDropdown = ({ delivery }) => (
    <div className="relative">
      <button
        onClick={() => setMobileActionMenu(mobileActionMenu === delivery._id ? null : delivery._id)}
        className="p-2 rounded-lg hover:bg-gray-100"
      >
        <MoreVertical size={20} />
      </button>
      
      {mobileActionMenu === delivery._id && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-2">
          <button
            onClick={() => {
              setDeliveryForm({
                deliveryPersonName: delivery.deliveryPersonName,
                phone: delivery.phone,
                apartment: delivery.apartment,
                deliveryCompany: delivery.deliveryCompany,
                expectedTime: new Date(delivery.expectedTime)
              });
              setCurrentDelivery(delivery);
              setShowForm(true);
              setMobileActionMenu(null);
            }}
            disabled={delivery.status === 'completed'}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
              delivery.status === 'completed' ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'
            }`}
          >
            <Edit size={16} /> Edit
          </button>
          
          <button
            onClick={() => {
              setCurrentDelivery(delivery);
              setShowForm(false);
              fetchDeliveryLogs(delivery._id);
              setMobileActionMenu(null);
            }}
            disabled={!delivery.uniqueId}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
              !delivery.uniqueId ? 'text-gray-400 cursor-not-allowed' : 'text-purple-600'
            }`}
          >
            <Package size={16} /> View Code
          </button>
          
          <button
            onClick={() => handleDeleteDelivery(delivery._id)}
            disabled={delivery.status === 'completed'}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
              delivery.status === 'completed' ? 'text-gray-400 cursor-not-allowed' : 'text-red-600'
            }`}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 lg:py-8 px-3 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Delivery Management</h1>
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  {resident ? `${resident.name} • Flat ${resident.flat_no}` : 'Loading resident information...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Tabs - Mobile Responsive */}
          <div className="hidden md:flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-4 px-6 text-center font-medium flex items-center justify-center gap-2 ${
                activeTab === 'active' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Truck size={18} /> Active Deliveries
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 px-6 text-center font-medium flex items-center justify-center gap-2 ${
                activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock size={18} /> Delivery History
            </button>
          </div>

          {/* Mobile Tabs Dropdown */}
          <div className="md:hidden border-b border-gray-200">
            <button
              onClick={() => setShowMobileTabs(!showMobileTabs)}
              className="w-full py-3 px-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Truck size={18} />
                <span className="font-medium">
                  {activeTab === 'active' ? 'Active Deliveries' : 'Delivery History'}
                </span>
              </div>
              <ChevronDown className={`transition-transform ${showMobileTabs ? 'rotate-180' : ''}`} />
            </button>
            
            {showMobileTabs && (
              <div className="bg-white border-t border-gray-200">
                <button
                  onClick={() => {
                    setActiveTab('active');
                    setShowMobileTabs(false);
                  }}
                  className={`w-full py-3 px-6 flex items-center gap-2 ${
                    activeTab === 'active' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <Truck size={18} /> Active Deliveries
                </button>
                <button
                  onClick={() => {
                    setActiveTab('history');
                    setShowMobileTabs(false);
                  }}
                  className={`w-full py-3 px-6 flex items-center gap-2 ${
                    activeTab === 'history' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <Clock size={18} /> Delivery History
                </button>
              </div>
            )}
          </div>

          {/* Filters and Actions */}
          <div className="p-4 md:p-6">
            <div className="flex flex-col space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg md:text-xl font-bold text-gray-800">
                  {activeTab === 'active' ? 'Active Deliveries' : 'Delivery History'}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({filteredDeliveries.length} {filteredDeliveries.length === 1 ? 'record' : 'records'})
                  </span>
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="md:hidden p-2 rounded-lg bg-gray-50 hover:bg-gray-100"
                  >
                    <Filter size={20} />
                  </button>
                </div>
              </div>

              {/* Mobile Filters */}
              {showMobileFilters && (
                <div className="md:hidden bg-gray-50 p-4 rounded-lg space-y-3 animate-slideDown">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search deliveries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2.5 border border-gray-300 rounded-lg">
                    <Calendar className="text-gray-400" size={18} />
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => setSelectedDate(date)}
                      placeholderText="Filter by date"
                      className="w-full focus:outline-none text-sm"
                      dateFormat="MMM d, yyyy"
                      isClearable
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedDate(null);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Desktop Search and Filters */}
              <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search by name, phone, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-300 rounded-lg">
                    <Calendar className="text-gray-400" size={18} />
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => setSelectedDate(date)}
                      placeholderText="Filter by date"
                      className="w-40 focus:outline-none"
                      dateFormat="MMMM d, yyyy"
                      isClearable
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setCurrentDelivery(null);
                      setDeliveryForm({
                        deliveryPersonName: '',
                        phone: '+91',
                        apartment: resident?.flat_no || '',
                        deliveryCompany: '',
                        expectedTime: new Date()
                      });
                      setPhoneError('');
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition bg-blue-600 hover:bg-blue-700 text-white shadow text-sm md:text-base"
                  >
                    <Plus size={18} /> New Delivery
                  </button>
                </div>
              </div>

              {/* Mobile New Delivery Button */}
              <button
                onClick={() => {
                  setShowForm(true);
                  setCurrentDelivery(null);
                  setDeliveryForm({
                    deliveryPersonName: '',
                    phone: '+91',
                    apartment: resident?.flat_no || '',
                    deliveryCompany: '',
                    expectedTime: new Date()
                  });
                  setPhoneError('');
                }}
                className="md:hidden w-full py-3 rounded-lg transition bg-blue-600 hover:bg-blue-700 text-white shadow flex items-center justify-center gap-2"
              >
                <Plus size={18} /> New Delivery
              </button>
            </div>

            {/* Delivery Form / Unique ID Display */}
            {(showForm || currentDelivery) && (
              <div className="mb-6 md:mb-8 bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base md:text-lg font-semibold text-gray-800">
                    {currentDelivery ? 'Delivery Pass Code' : 'Create New Delivery'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setCurrentDelivery(null);
                      setDeliveryForm({
                        deliveryPersonName: '',
                        phone: '+91',
                        apartment: resident?.flat_no || '',
                        deliveryCompany: '',
                        expectedTime: new Date()
                      });
                      setPhoneError('');
                      setLogs([]);
                    }}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <X size={20} />
                  </button>
                </div>

                {currentDelivery ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {/* Unique ID Section */}
                    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
                      <div className="mb-4 p-3 md:p-4 bg-blue-50 rounded border border-blue-200 text-center">
                        <div className="text-lg md:text-xl lg:text-2xl font-mono font-bold text-blue-800 break-all">
                          {currentDelivery.uniqueId || 'No code available'}
                        </div>
                        <p className="text-xs md:text-sm text-blue-600 mt-2">Share this code with the delivery person</p>
                      </div>
                      <div className="space-y-2 md:space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Delivery Person:</span>
                          <span className="text-gray-800">{currentDelivery.deliveryPersonName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Phone:</span>
                          <span className="text-gray-800">{currentDelivery.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Company:</span>
                          <span className="text-gray-800">{currentDelivery.deliveryCompany}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Apartment:</span>
                          <span className="text-gray-800">{currentDelivery.apartment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Expected Time:</span>
                          <span className="text-gray-800">{formatDateTime(currentDelivery.expectedTime)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(currentDelivery.status)}`}>
                            {formatStatus(currentDelivery.status)}
                          </span>
                        </div>
                      </div>
                      <DeliveryLogs logs={logs} />
                    </div>

                    {/* Edit Form Section */}
                    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200">
                      <h4 className="font-medium text-gray-800 mb-3 md:mb-4">Edit Delivery Details</h4>
                      <form onSubmit={handleUpdateDelivery} className="space-y-3 md:space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Person Name *</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                              type="text"
                              value={deliveryForm.deliveryPersonName}
                              onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryPersonName: e.target.value })}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-base"
                              required
                              placeholder="Enter delivery person's name"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                          <PhoneInput
                            value={deliveryForm.phone}
                            onChange={(phone) => setDeliveryForm({ ...deliveryForm, phone })}
                            error={phoneError}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Company *</label>
                          <select
                            value={deliveryForm.deliveryCompany}
                            onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryCompany: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-base"
                            required
                          >
                            <option value="" disabled>Select a delivery company</option>
                            {DELIVERY_COMPANIES.map(company => (
                              <option key={company} value={company}>{company}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Time *</label>
                          <div className="relative flex items-center gap-2 bg-white px-3 md:px-4 py-2 border border-gray-300 rounded-lg">
                            <Calendar className="text-gray-400" size={18} />
                            <DatePicker
                              selected={deliveryForm.expectedTime}
                              onChange={(date) => setDeliveryForm({ ...deliveryForm, expectedTime: date })}
                              showTimeSelect
                              timeFormat="HH:mm"
                              timeIntervals={15}
                              dateFormat="MMM d, yyyy h:mm aa"
                              className="w-full focus:outline-none text-sm md:text-base"
                              required
                              popperPlacement="bottom-start"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 md:gap-3 pt-2">
                          <button
                            type="submit"
                            disabled={isSending}
                            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2 text-sm md:text-base ${
                              isSending ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            <Edit size={16} /> Update Delivery
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDeleteDelivery(currentDelivery._id)}
                            disabled={isSending}
                            className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 px-2 md:px-4 rounded-lg transition flex items-center justify-center gap-2 text-sm md:text-base"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateDelivery} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Person Name *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            value={deliveryForm.deliveryPersonName}
                            onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryPersonName: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-base"
                            required
                            placeholder="Enter delivery person's name"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                        <PhoneInput
                          value={deliveryForm.phone}
                          onChange={(phone) => setDeliveryForm({ ...deliveryForm, phone })}
                          error={phoneError}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apartment *</label>
                        <input
                          type="text"
                          value={deliveryForm.apartment}
                          onChange={(e) => setDeliveryForm({ ...deliveryForm, apartment: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-base"
                          required
                          placeholder="Enter apartment number"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Company *</label>
                        <select
                          value={deliveryForm.deliveryCompany}
                          onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryCompany: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-base"
                          required
                        >
                          <option value="" disabled>Select a delivery company</option>
                          {DELIVERY_COMPANIES.map(company => (
                            <option key={company} value={company}>{company}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Time *</label>
                      <div className="relative flex items-center gap-2 bg-white px-3 md:px-4 py-2 border border-gray-300 rounded-lg">
                        <Calendar className="text-gray-400" size={18} />
                        <DatePicker
                          selected={deliveryForm.expectedTime}
                          onChange={(date) => setDeliveryForm({ ...deliveryForm, expectedTime: date })}
                          showTimeSelect
                          timeFormat="HH:mm"
                          timeIntervals={15}
                          dateFormat="MMM d, yyyy h:mm aa"
                          className="w-full focus:outline-none text-sm md:text-base"
                          required
                          popperPlacement="bottom-start"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 md:gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={isSending}
                        className={`flex-1 py-2 md:py-3 rounded-lg transition flex items-center justify-center gap-2 text-sm md:text-base ${
                          isSending ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isSending ? (
                          <span className="flex items-center">
                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          <>
                            <Plus size={16} /> Generate Delivery Code
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setDeliveryForm({
                            deliveryPersonName: '',
                            phone: '+91',
                            apartment: resident?.flat_no || '',
                            deliveryCompany: '',
                            expectedTime: new Date()
                          });
                          setPhoneError('');
                        }}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 md:py-3 px-2 md:px-4 rounded-lg transition flex items-center justify-center gap-2 text-sm md:text-base"
                      >
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Deliveries List */}
            {isLoading && !showForm && !currentDelivery ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <div className="text-center py-12">
                <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-base md:text-lg text-gray-600 mb-2">
                  {searchTerm || selectedDate
                    ? 'No deliveries found matching your criteria'
                    : `No ${activeTab === 'active' ? 'active' : 'completed'} deliveries found`}
                </p>
                {(searchTerm || selectedDate) && (
                  <button
                    className="mt-4 text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 mx-auto text-sm md:text-base"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedDate(null);
                    }}
                  >
                    <X size={16} /> Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Details</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timings</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map(delivery => (
                        <tr key={delivery._id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="text-blue-600" size={18} />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{delivery.deliveryPersonName}</div>
                                <div className="text-sm text-gray-500">{delivery.phone}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Apartment {delivery.apartment}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 font-medium">{delivery.deliveryCompany}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(delivery.status)}`}>
                              {formatStatus(delivery.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center gap-1">
                                <Clock size={14} className="text-gray-500" />
                                {formatDateTime(delivery.expectedTime)}
                              </div>
                              {delivery.entryTime && (
                                <div className="flex items-center gap-1 mt-1">
                                  <ArrowRightCircle size={14} className="text-green-500" />
                                  {formatTime(delivery.entryTime)}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setDeliveryForm({
                                    deliveryPersonName: delivery.deliveryPersonName,
                                    phone: delivery.phone,
                                    apartment: delivery.apartment,
                                    deliveryCompany: delivery.deliveryCompany,
                                    expectedTime: new Date(delivery.expectedTime)
                                  });
                                  setCurrentDelivery(delivery);
                                  setShowForm(true);
                                }}
                                disabled={delivery.status === 'completed'}
                                className={`p-2 rounded-lg transition ${
                                  delivery.status === 'completed'
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-blue-600 hover:bg-blue-100'
                                }`}
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentDelivery(delivery);
                                  setShowForm(false);
                                  fetchDeliveryLogs(delivery._id);
                                }}
                                disabled={!delivery.uniqueId}
                                className={`p-2 rounded-lg transition ${
                                  !delivery.uniqueId
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-purple-600 hover:bg-purple-100'
                                }`}
                                title="View Delivery Code"
                              >
                                <Package size={18} />
                              </button>

                              <button
                                onClick={() => handleDeleteDelivery(delivery._id)}
                                disabled={delivery.status === 'completed'}
                                className={`p-2 rounded-lg transition ${
                                  delivery.status === 'completed'
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-red-600 hover:bg-red-100'
                                }`}
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile/Tablet Card View */}
                <div className="lg:hidden space-y-4">
                  {currentItems.map(delivery => (
                    <div key={delivery._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
                      {/* Delivery Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="text-blue-600" size={18} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{delivery.deliveryPersonName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Phone size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-600">{delivery.phone}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Apartment {delivery.apartment}</div>
                          </div>
                        </div>
                        <MobileActionsDropdown delivery={delivery} />
                      </div>

                      {/* Delivery Details */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Company</p>
                          <p className="text-sm font-medium text-gray-900">{delivery.deliveryCompany}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Status</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(delivery.status)}`}>
                            {formatStatus(delivery.status)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Expected Time</p>
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-gray-500" />
                            <span className="text-sm">{formatTime(delivery.expectedTime)}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Entry Time</p>
                          <div className="flex items-center gap-1">
                            <ArrowRightCircle size={14} className="text-green-500" />
                            <span className="text-sm">{formatTime(delivery.entryTime) || "-"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Unique ID */}
                      {delivery.uniqueId && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Delivery Code</p>
                          <div className="bg-blue-50 p-2 rounded border border-blue-200">
                            <p className="font-mono text-sm text-blue-800 text-center break-all">
                              {delivery.uniqueId}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 px-2 md:px-6 py-4">
                    <button
                      onClick={() => paginate(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded text-sm ${
                        currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <ChevronLeft size={16} /> <span className="hidden sm:inline">Previous</span>
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => paginate(pageNum)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                              currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <span className="flex items-end px-1 text-gray-500">...</span>
                      )}
                      {totalPages > 5 && currentPage >= totalPages - 2 && (
                        <button
                          onClick={() => paginate(totalPages)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                            currentPage === totalPages ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {totalPages}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded text-sm ${
                        currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="hidden sm:inline">Next</span> <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryManagement;