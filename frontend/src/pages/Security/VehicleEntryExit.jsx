import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Car,
  Bike,
  CheckCircle,
  XCircle,
  Search,
  ArrowRightCircle,
  ArrowLeftCircle,
  AlertCircle,
  Loader2,
  Shield,
  History,
  PlusCircle,
  User,
  Home
} from 'lucide-react';
import { useAuth } from "../../Context/AuthContext";

const SecurityVehicleManagement = () => {
  // State declarations
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [actionType, setActionType] = useState('entry');
  const [notes, setNotes] = useState('');
  const [vehicleHistory, setVehicleHistory] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [vehicleForm, setVehicleForm] = useState({
    vehicle_no: '',
    vehicle_type: 'car',
    flat_no: ''
  });
  const [formErrors, setFormErrors] = useState({});
      const { API } = useAuth();
  

  // Get authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No authentication token found. Please log in.', {
        position: 'top-right',
        autoClose: 5000,
      });
      window.location.href = '/login';
      return {};
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // Validate vehicle form
  const validateForm = () => {
    const errors = {};
    const { vehicle_no } = vehicleForm;

    if (!vehicle_no.trim()) {
      errors.vehicle_no = 'Vehicle number is required';
    } else if (!/^[A-Za-z]{2}\d{1,2}[A-Za-z]{0,2}\d{1,4}$/.test(vehicle_no.trim())) {
      errors.vehicle_no = 'Invalid vehicle number format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch all vehicles
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/vehicle/security/all`,
        getAuthHeaders()
      );
      
      if (response.data.success) {
        setVehicles(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to load vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error(error.response?.data?.message || 'Failed to load vehicles', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle vehicle entry/exit
  const handleVehicleAction = async () => {
    try {
      setLoading(true);
      
      const response = await axios.post(
        `${API}/vehicle/verify/${selectedVehicle.vehicle_no}/${actionType}`,
        { notes },
        getAuthHeaders()
      );

      toast.success(
        `Vehicle ${actionType === 'entry' ? 'entry' : 'exit'} recorded successfully`,
        { position: 'top-right', autoClose: 3000 }
      );

      // Reset modal state
      setShowActionModal(false);
      setNotes('');
      
      // Refresh vehicle list
      fetchVehicles();
    } catch (error) {
      console.error(`Error recording ${actionType}:`, error);
      toast.error(
        error.response?.data?.message || `Failed to record ${actionType}`,
        { position: 'top-right', autoClose: 5000 }
      );
    } finally {
      setLoading(false);
    }
  };

  // Register vehicle
  const registerVehicle = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const response = await axios.post(
        `${API}/vehicle/security/register`,
        {
          vehicle_no: vehicleForm.vehicle_no.toUpperCase(),
          vehicle_type: vehicleForm.vehicle_type,
          flat_no: vehicleForm.flat_no || null
        },
        getAuthHeaders()
      );

      toast.success('Vehicle registered successfully', {
        position: 'top-right',
        autoClose: 3000,
      });

      // Reset form and modal state
      setShowRegisterModal(false);
      setVehicleForm({
        vehicle_no: '',
        vehicle_type: 'car',
        flat_no: ''
      });
      setFormErrors({});
      
      // Refresh vehicle list
      fetchVehicles();
    } catch (error) {
      console.error('Error registering vehicle:', error);
      
      // Handle backend validation errors
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.path] = err.msg;
        });
        setFormErrors(backendErrors);
      } else {
        toast.error(
          error.response?.data?.message || 'Failed to register vehicle',
          { position: 'top-right', autoClose: 5000 }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Get vehicle logs
  const fetchVehicleHistory = async (vehicleId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/vehicle/history/${vehicleId}`,
        getAuthHeaders()
      );
      
      if (response.data.success) {
        setVehicleHistory(response.data.data.movement_logs || []);
        setShowHistoryModal(true);
      } else {
        throw new Error(response.data.message || 'Failed to load vehicle history');
      }
    } catch (error) {
      console.error('Error fetching vehicle history:', error);
      toast.error(
        error.response?.data?.message || 'Failed to load vehicle history',
        { position: 'top-right', autoClose: 5000 }
      );
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'inside':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'outside':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  // Get vehicle icon
  const getVehicleIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'car':
        return <Car className="w-5 h-5" />;
      case 'bike':
      case 'scooter':
        return <Bike className="w-5 h-5" />;
      default:
        return <Car className="w-5 h-5" />;
    }
  };

  // Filter vehicles based on search and status
  const filteredVehicles = vehicles.filter(vehicle => {
    // Filter by status
    if (filterStatus !== 'all') {
      if (filterStatus === 'inside' && vehicle.current_status !== 'inside') return false;
      if (filterStatus === 'outside' && vehicle.current_status !== 'outside') return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        vehicle.vehicle_no.toLowerCase().includes(searchLower) ||
        (vehicle.owner?.name && vehicle.owner.name.toLowerCase().includes(searchLower)) ||
        (vehicle.visitor_name && vehicle.visitor_name.toLowerCase().includes(searchLower)) ||
        (vehicle.flat_no && vehicle.flat_no.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Shield className="text-blue-600" size={28} />
                Security Vehicle Management
              </h1>
              <p className="text-gray-600 mt-1">Manage all vehicle entries and exits</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchVehicles}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <span>Refresh</span>
                )}
              </button>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <PlusCircle size={18} />
                <span className="hidden sm:inline">Register Vehicle</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'inside', 'outside'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1 rounded-lg text-sm capitalize ${
                      filterStatus === status
                        ? status === 'all' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : status === 'inside'
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all' ? 'All' : status}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Vehicles</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400 h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by plate, name, or flat..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Vehicle', 'Owner', 'Status', 'Last Action', 'Actions'].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && vehicles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                      </div>
                    </td>
                  </tr>
                ) : filteredVehicles.length ? (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            {getVehicleIcon(vehicle.vehicle_type)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{vehicle.vehicle_no}</div>
                            <div className="text-sm text-gray-500 capitalize">{vehicle.vehicle_type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vehicle.is_guest ? (
                            <>
                              <div className="font-medium">{vehicle.visitor_name || 'Guest'}</div>
                              <div className="text-gray-500">{vehicle.visitor_phone}</div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium">{vehicle.owner?.name || 'Resident'}</div>
                              {vehicle.flat_no && <div className="text-gray-500">Flat {vehicle.flat_no}</div>}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1 ${
                            vehicle.current_status === 'inside'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {vehicle.current_status?.toUpperCase() || 'UNKNOWN'}
                          {getStatusIcon(vehicle.current_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {vehicle.last_action && (
                            <>
                              <div className="capitalize">{vehicle.last_action?.toLowerCase()}</div>
                              <div className="text-gray-500">{formatDate(vehicle.last_timestamp)}</div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setActionType(vehicle.current_status === 'inside' ? 'exit' : 'entry');
                              setShowActionModal(true);
                            }}
                            className={`${
                              vehicle.current_status === 'inside'
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            } transition-colors`}
                          >
                            {vehicle.current_status === 'inside' ? 'Exit' : 'Entry'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              fetchVehicleHistory(vehicle._id);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No vehicles found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Modal (Entry/Exit) */}
        {showActionModal && selectedVehicle && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    {actionType === 'entry' ? 'Record Vehicle Entry' : 'Record Vehicle Exit'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowActionModal(false);
                      setNotes('');
                    }}
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
                      {getVehicleIcon(selectedVehicle.vehicle_type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{selectedVehicle.vehicle_no}</h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {selectedVehicle.vehicle_type} •{' '}
                        {selectedVehicle.is_guest ? 'Guest Vehicle' : 'Resident Vehicle'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Owner</p>
                      <p className="font-medium text-sm">
                        {selectedVehicle.is_guest
                          ? selectedVehicle.visitor_name || 'Guest'
                          : selectedVehicle.owner?.name || 'Resident'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Flat</p>
                      <p className="font-medium text-sm">{selectedVehicle.flat_no || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional notes..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm focus:border-transparent transition-colors"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowActionModal(false);
                      setNotes('');
                    }}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVehicleAction}
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

        {/* Register Vehicle Modal */}
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
              <div className="p-6 flex-grow overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Register Vehicle</h2>
                  <button
                    onClick={() => {
                      setShowRegisterModal(false);
                      setVehicleForm({
                        vehicle_no: '',
                        vehicle_type: 'car',
                        flat_no: ''
                      });
                      setFormErrors({});
                    }}
                    disabled={loading}
                    className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={vehicleForm.vehicle_no}
                      onChange={(e) => {
                        setVehicleForm(prev => ({
                          ...prev,
                          vehicle_no: e.target.value.toUpperCase()
                        }));
                        if (formErrors.vehicle_no) {
                          setFormErrors(prev => ({ ...prev, vehicle_no: '' }));
                        }
                      }}
                      placeholder="e.g. MH12AB1234"
                      className={`w-full px-4 py-2 border ${
                        formErrors.vehicle_no ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm`}
                      required
                    />
                    {formErrors.vehicle_no && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.vehicle_no}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={vehicleForm.vehicle_type}
                      onChange={(e) => setVehicleForm(prev => ({
                        ...prev,
                        vehicle_type: e.target.value
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {['car', 'bike', 'scooter', 'truck', 'van'].map((type) => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Flat Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={vehicleForm.flat_no}
                      onChange={(e) => {
                        setVehicleForm(prev => ({
                          ...prev,
                          flat_no: e.target.value.toUpperCase()
                        }));
                        if (formErrors.flat_no) {
                          setFormErrors(prev => ({ ...prev, flat_no: '' }));
                        }
                      }}
                      placeholder="e.g. A101, B202"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowRegisterModal(false);
                      setVehicleForm({
                        vehicle_no: '',
                        vehicle_type: 'car',
                        flat_no: ''
                      });
                      setFormErrors({});
                    }}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={registerVehicle}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <>
                        <PlusCircle size={18} />
                        <span>Register Vehicle</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && selectedVehicle && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <History className="text-blue-600" />
                    Vehicle History - {selectedVehicle.vehicle_no}
                  </h2>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Vehicle Number', value: selectedVehicle.vehicle_no },
                      { label: 'Type', value: selectedVehicle.vehicle_type, capitalize: true },
                      { label: 'Current Status', value: selectedVehicle.current_status, status: true }
                    ].map((item) => (
                      <div key={item.label} className="flex flex-col">
                        <p className="text-sm text-gray-500">{item.label}</p>
                        <p className="font-medium text-sm">
                          {item.status ? (
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                item.value === 'inside'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {item.value?.toUpperCase() || 'UNKNOWN'}
                            </span>
                          ) : item.capitalize ? (
                            item.value?.toLowerCase()
                          ) : (
                            item.value
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-800 mb-3">Movement History</h3>
                  {vehicleHistory.length > 0 ? (
                    <div className="space-y-4">
                      {vehicleHistory.map((log, index) => (
                        <div key={index} className="border-l-2 border-blue-200 pl-4 py-2">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium flex items-center gap-2 text-sm">
                                {log.action === 'Entered' ? (
                                  <span className="text-green-600">
                                    <ArrowRightCircle className="inline mr-1" size={16} />
                                    Entered Premises
                                  </span>
                                ) : log.action === 'Exited' ? (
                                  <span className="text-red-600">
                                    <ArrowLeftCircle className="inline mr-1" size={16} />
                                    Exited Premises
                                  </span>
                                ) : (
                                  <span className="capitalize">{log.action?.toLowerCase()}</span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">{formatDate(log.timestamp)}</p>
                            </div>
                            {log.verified_by && (
                              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                Verified by {log.verified_by.name}
                              </div>
                            )}
                          </div>
                          {log.notes && (
                            <p className="text-sm mt-1 text-gray-600">
                              <span className="font-medium">Notes:</span> {log.notes}
                            </p>
                          )}
                          {log.reason && (
                            <p className="text-sm mt-1 text-gray-600">
                              <span className="font-medium">Reason:</span> {log.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4 text-sm">No movement history available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityVehicleManagement;