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
  Home,
  Truck,
  Package, // Using Package as alternative for Van
  Filter
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
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
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
      errors.vehicle_no = 'Invalid vehicle number format (e.g., MH12AB1234)';
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
    if (!selectedVehicle) return;

    try {
      setActionLoading(true);
      
      const response = await axios.post(
        `${API}/vehicle/verify/${selectedVehicle.vehicle_no}/${actionType}`,
        { notes: notes.trim() || undefined },
        getAuthHeaders()
      );

      toast.success(
        `Vehicle ${actionType === 'entry' ? 'entry' : 'exit'} recorded successfully`,
        { position: 'top-right', autoClose: 3000 }
      );

      // Reset modal state
      setShowActionModal(false);
      setNotes('');
      setSelectedVehicle(null);
      
      // Refresh vehicle list
      fetchVehicles();
    } catch (error) {
      console.error(`Error recording ${actionType}:`, error);
      toast.error(
        error.response?.data?.message || `Failed to record ${actionType}`,
        { position: 'top-right', autoClose: 5000 }
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Register vehicle
  const registerVehicle = async () => {
    if (!validateForm()) return;

    try {
      setRegisterLoading(true);
      
      const response = await axios.post(
        `${API}/vehicle/security/register`,
        {
          vehicle_no: vehicleForm.vehicle_no.toUpperCase().trim(),
          vehicle_type: vehicleForm.vehicle_type,
          flat_no: vehicleForm.flat_no?.trim() || undefined
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
      setRegisterLoading(false);
    }
  };

  // Get vehicle logs
  const fetchVehicleHistory = async (vehicleId) => {
    try {
      setHistoryLoading(true);
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
      setHistoryLoading(false);
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
        return <Car className="w-5 h-5 text-primary" />;
      case 'bike':
        return <Bike className="w-5 h-5 text-primary" />;
      case 'scooter':
        return <Bike className="w-5 h-5 text-primary" />;
      case 'truck':
        return <Truck className="w-5 h-5 text-primary" />;
      case 'van':
        return <Package className="w-5 h-5 text-primary" />; // Changed from Van to Package
      default:
        return <Car className="w-5 h-5 text-primary" />;
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
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
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
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-10xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary bg-opacity-10">
              <Shield className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">Security Vehicle Management</h1>
              <p className="text-gray-600 text-sm md:text-base mt-1">Track and manage vehicle entries, exits, and registrations</p>
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
                  {/* Search Input */}
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="text-gray-400 h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search vehicles by number, name, or flat..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="text-gray-500" size={18} />
                    <div className="flex flex-wrap gap-1">
                      {['all', 'inside', 'outside'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            filterStatus === status
                              ? status === 'all'
                                ? 'bg-secondary text-white'
                                : status === 'inside'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {status === 'all' ? 'All Vehicles' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={fetchVehicles}
                  disabled={loading}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <span>Refresh</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="px-4 py-2.5 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors flex items-center gap-2 text-sm"
                >
                  <PlusCircle size={16} />
                  <span>Register Vehicle</span>
                </button>
              </div>
            </div>
          </div>

          {/* Vehicles Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle Details
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner Information
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Action
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && vehicles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 md:px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="animate-spin h-10 w-10 text-secondary mb-3" />
                        <p className="text-gray-500">Loading vehicles...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredVehicles.length ? (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-secondary/10 rounded-full flex items-center justify-center">
                            {getVehicleIcon(vehicle.vehicle_type)}
                          </div>
                          <div className="ml-3 md:ml-4">
                            <div className="text-sm font-medium text-gray-900">{vehicle.vehicle_no}</div>
                            <div className="text-xs text-gray-500 capitalize">
                              {vehicle.vehicle_type === 'car' ? 'Car' : 
                               vehicle.vehicle_type === 'bike' ? 'Bike' : 
                               vehicle.vehicle_type === 'scooter' ? 'Scooter' : 
                               vehicle.vehicle_type === 'truck' ? 'Truck' : 
                               vehicle.vehicle_type === 'van' ? 'Van' : vehicle.vehicle_type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {vehicle.is_guest ? (
                            <>
                              <div className="font-medium flex items-center gap-1">
                                <User size={14} />
                                {vehicle.visitor_name || 'Guest'}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                {vehicle.visitor_phone || 'No phone provided'}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium">
                                {vehicle.owner?.name || 'Resident'}
                              </div>
                              {vehicle.flat_no && (
                                <div className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                                  <Home size={12} />
                                  Flat {vehicle.flat_no}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                              vehicle.current_status === 'inside'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {vehicle.current_status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                          {getStatusIcon(vehicle.current_status)}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {vehicle.last_action ? (
                            <>
                              <div className="capitalize font-medium">
                                {vehicle.last_action?.toLowerCase()}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                {formatDate(vehicle.last_timestamp)}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400">No recent activity</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setActionType(vehicle.current_status === 'inside' ? 'exit' : 'entry');
                              setShowActionModal(true);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                              vehicle.current_status === 'inside'
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            } transition-colors`}
                          >
                            {vehicle.current_status === 'inside' ? (
                              <>
                                <ArrowLeftCircle size={14} />
                                Mark Exit
                              </>
                            ) : (
                              <>
                                <ArrowRightCircle size={14} />
                                Mark Entry
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              fetchVehicleHistory(vehicle._id);
                            }}
                            className="px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                            disabled={historyLoading}
                          >
                            <History size={14} />
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 md:px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center py-8">
                        <Car className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No vehicles found</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {searchTerm.trim() || filterStatus !== 'all' 
                            ? 'Try adjusting your search or filter criteria' 
                            : 'No vehicles are currently registered'}
                        </p>
                        {!searchTerm.trim() && filterStatus === 'all' && (
                          <button
                            onClick={() => setShowRegisterModal(true)}
                            className="mt-3 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors flex items-center gap-2 text-sm"
                          >
                            <PlusCircle size={14} />
                            Register First Vehicle
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          {filteredVehicles.length > 0 && (
            <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
                <div>
                  Showing <span className="font-medium">{filteredVehicles.length}</span> of{' '}
                  <span className="font-medium">{vehicles.length}</span> vehicles
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Inside: {vehicles.filter(v => v.current_status === 'inside').length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Outside: {vehicles.filter(v => v.current_status === 'outside').length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Modal (Entry/Exit) */}
        {showActionModal && selectedVehicle && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-primary">
                    {actionType === 'entry' ? 'Record Vehicle Entry' : 'Record Vehicle Exit'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowActionModal(false);
                      setNotes('');
                      setSelectedVehicle(null);
                    }}
                    disabled={actionLoading}
                    className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-secondary/10">
                      {getVehicleIcon(selectedVehicle.vehicle_type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{selectedVehicle.vehicle_no}</h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {selectedVehicle.vehicle_type === 'car' ? 'Car' : 
                         selectedVehicle.vehicle_type === 'bike' ? 'Bike' : 
                         selectedVehicle.vehicle_type === 'scooter' ? 'Scooter' : 
                         selectedVehicle.vehicle_type === 'truck' ? 'Truck' : 
                         selectedVehicle.vehicle_type === 'van' ? 'Van' : selectedVehicle.vehicle_type} •{' '}
                        {selectedVehicle.is_guest ? 'Guest Vehicle' : 'Resident Vehicle'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Owner</p>
                      <p className="font-medium text-sm">
                        {selectedVehicle.is_guest
                          ? selectedVehicle.visitor_name || 'Guest'
                          : selectedVehicle.owner?.name || 'Resident'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Flat Number</p>
                      <p className="font-medium text-sm">{selectedVehicle.flat_no || 'Not specified'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any additional notes for this action..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors text-sm resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowActionModal(false);
                      setNotes('');
                      setSelectedVehicle(null);
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVehicleAction}
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
                  <h2 className="text-xl font-bold text-primary">Register New Vehicle</h2>
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
                    disabled={registerLoading}
                    className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-colors text-sm ${
                        formErrors.vehicle_no ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-transparent'
                      }`}
                      required
                    />
                    {formErrors.vehicle_no && (
                      <p className="mt-2 text-xs text-red-600">{formErrors.vehicle_no}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Format: State code + District code + Series + Number (e.g., MH12AB1234)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { value: 'car', label: 'Car', icon: <Car size={18} /> },
                        { value: 'bike', label: 'Bike', icon: <Bike size={18} /> },
                        { value: 'scooter', label: 'Scooter', icon: <Bike size={18} /> },
                        { value: 'truck', label: 'Truck', icon: <Truck size={18} /> },
                        { value: 'van', label: 'Van', icon: <Package size={18} /> } // Changed from Van to Package
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setVehicleForm(prev => ({
                            ...prev,
                            vehicle_type: type.value
                          }))}
                          className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-colors ${
                            vehicleForm.vehicle_type === type.value
                              ? 'bg-secondary text-white border-secondary'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {type.icon}
                          <span className="text-xs">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors text-sm"
                    />
                    {formErrors.flat_no && (
                      <p className="mt-2 text-xs text-red-600">{formErrors.flat_no}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
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
                    disabled={registerLoading}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={registerVehicle}
                    disabled={registerLoading}
                    className="px-4 py-2.5 bg-secondary hover:bg-secondary-dark text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {registerLoading ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <>
                        <PlusCircle size={16} />
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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      {getVehicleIcon(selectedVehicle.vehicle_type)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-primary">Vehicle History</h2>
                      <p className="text-gray-600 text-sm">{selectedVehicle.vehicle_no}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Current Status</p>
                    <p className="font-medium">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedVehicle.current_status === 'inside'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedVehicle.current_status?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Vehicle Type</p>
                    <p className="font-medium capitalize">{selectedVehicle.vehicle_type}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Owner Type</p>
                    <p className="font-medium">
                      {selectedVehicle.is_guest ? 'Guest Vehicle' : 'Resident Vehicle'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <History size={18} />
                    Movement History
                  </h3>
                  {historyLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin h-8 w-8 text-secondary" />
                    </div>
                  ) : vehicleHistory.length > 0 ? (
                    <div className="space-y-3">
                      {vehicleHistory.map((log, index) => (
                        <div key={index} className="border-l-2 border-secondary pl-4 py-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {log.action === 'Entered' ? (
                                <ArrowRightCircle className="text-green-500" size={16} />
                              ) : log.action === 'Exited' ? (
                                <ArrowLeftCircle className="text-red-500" size={16} />
                              ) : (
                                <AlertCircle className="text-yellow-500" size={16} />
                              )}
                              <span className="font-medium text-sm">
                                {log.action || 'Unknown Action'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(log.timestamp)}
                            </span>
                          </div>
                          {(log.notes || log.reason) && (
                            <div className="mt-2 bg-gray-50 p-2 rounded text-xs">
                              {log.notes && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Notes:</span> {log.notes}
                                </p>
                              )}
                              {log.reason && (
                                <p className="text-gray-600 mt-1">
                                  <span className="font-medium">Reason:</span> {log.reason}
                                </p>
                              )}
                            </div>
                          )}
                          {log.verified_by && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                              <span>Verified by:</span>
                              <span className="font-medium">{log.verified_by.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No movement history available</p>
                      <p className="text-gray-400 text-sm mt-1">
                        This vehicle has no recorded entries or exits
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowHistoryModal(false)}
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

export default SecurityVehicleManagement;