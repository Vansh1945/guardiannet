import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car,
  Bike,
  Plus,
  Clock,
  User,
  UserPlus,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../Context/AuthContext";

const ResidentVehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [residentData, setResidentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleLogs, setVehicleLogs] = useState([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const navigate = useNavigate();
    const { API } = useAuth();

  const [personalVehicleForm, setPersonalVehicleForm] = useState({
    vehicle_no: "",
    vehicle_type: "car",
  });

  const [guestVehicleForm, setGuestVehicleForm] = useState({
    visitor_id: "",
    vehicle_no: "",
    vehicle_type: "car",
  });


  // Get authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No authentication token found. Please log in.", {
        position: "top-right",
        autoClose: 5000,
      });
      navigate("/login");
      return {};
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Fetch resident profile
  const fetchResidentData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/profile/get-profile`, getAuthHeaders());
      setResidentData(response.data.user || response.data.data || response.data);
    } catch (error) {
      console.error("Error fetching resident data:", error);
      toast.error(error.response?.data?.message || "Failed to load resident information", {
        position: "top-right",
        autoClose: 5000,
      });
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  // Fetch resident vehicles
  const fetchResidentVehicles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/vehicle/my-vehicles`, getAuthHeaders());
      setVehicles(response.data.data || response.data.vehicles || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error(error.response?.data?.message || "Failed to load vehicles", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch visitors
  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/visitor/my-visitors`, getAuthHeaders());
      setVisitors(response.data.visitors || []);
    } catch (error) {
      console.error("Error fetching visitors:", error);
      toast.error(error.response?.data?.message || "Failed to load visitors", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Validate vehicle number
  const validateVehicleNo = (vehicleNo) => {
    const regex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;
    return regex.test(vehicleNo.toUpperCase());
  };

  // Register personal vehicle
  const registerPersonalVehicle = async () => {
    if (!residentData) {
      toast.error("Resident data not loaded. Please try again.", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    if (!validateVehicleNo(personalVehicleForm.vehicle_no)) {
      toast.error("Invalid vehicle number format (e.g., MH12AB1234)", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API}/vehicle/personal`,
        {
          vehicle_no: personalVehicleForm.vehicle_no,
          vehicle_type: personalVehicleForm.vehicle_type,
        },
        getAuthHeaders()
      );

      setPersonalVehicleForm({ vehicle_no: "", vehicle_type: "car" });
      setShowVehicleForm(false);
      await fetchResidentVehicles();
      toast.success("Personal vehicle registered successfully", {
        position: "top-right",
        autoClose: 5000,
      });
    } catch (error) {
      console.error("Error registering vehicle:", error);
      toast.error(error.response?.data?.message || "Failed to register vehicle", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Register guest vehicle
  const registerGuestVehicle = async () => {
    if (!residentData) {
      toast.error("Resident data not loaded. Please try again.", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    if (!guestVehicleForm.visitor_id) {
      toast.error("Please select a visitor", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    if (!validateVehicleNo(guestVehicleForm.vehicle_no)) {
      toast.error("Invalid vehicle number format (e.g., MH12AB1234)", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API}/vehicle/guest`,
        {
          visitor_id: guestVehicleForm.visitor_id,
          vehicle_no: guestVehicleForm.vehicle_no,
          vehicle_type: guestVehicleForm.vehicle_type,
        },
        getAuthHeaders()
      );

      setGuestVehicleForm({ visitor_id: "", vehicle_no: "", vehicle_type: "car" });
      setShowVehicleForm(false);
      await fetchResidentVehicles();
      toast.success("Guest vehicle registered successfully", {
        position: "top-right",
        autoClose: 5000,
      });
    } catch (error) {
      console.error("Error registering guest vehicle:", error);
      toast.error(error.response?.data?.message || "Failed to register guest vehicle", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // View vehicle logs
  const viewVehicleLogs = async (vehicleId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/vehicle/logs/${vehicleId}`, 
        getAuthHeaders()
      );
      
      if (response.data.success) {
        const vehicle = vehicles.find(v => v._id === vehicleId);
        if (!vehicle) {
          throw new Error('Vehicle not found');
        }
        
        setSelectedVehicle(vehicle);
        setVehicleLogs(response.data.logs || []);
        setShowLogsModal(true);
      } else {
        toast.error(response.data.message || 'Failed to load vehicle logs', { 
          position: 'top-right', 
          autoClose: 5000 
        });
      }
    } catch (error) {
      console.error('Error fetching vehicle logs:', error);
      
      let errorMessage = 'Failed to load vehicle logs';
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'You are not authorized to view these logs';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      toast.error(errorMessage, { 
        position: 'top-right', 
        autoClose: 5000 
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete vehicle
  const deleteVehicle = async (vehicleId) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      setLoading(true);
      const response = await axios.delete(`${API}/vehicle/${vehicleId}`, getAuthHeaders());

      if (response.data.success) {
        await fetchResidentVehicles();
        toast.success("Vehicle deleted successfully", {
          position: "top-right",
          autoClose: 5000,
        });
      } else {
        toast.error(response.data.message || "Failed to delete vehicle", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      const errorMessage = error.response?.data?.message || "Failed to delete vehicle";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchResidentVehicles(), fetchVisitors()]);
      toast.success("Data refreshed successfully", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data", {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Get vehicle icon
  const getVehicleIcon = (type) => {
    switch (type) {
      case "car":
        return <Car className="w-5 h-5" />;
      case "bike":
        return <Bike className="w-5 h-5" />;
      case "scooter":
        return <Bike className="w-5 h-5" />;
      default:
        return <Car className="w-5 h-5" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "inside":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "outside":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  useEffect(() => {
    fetchResidentData();
  }, []);

  useEffect(() => {
    if (residentData) {
      fetchResidentVehicles();
      fetchVisitors();
    }
  }, [residentData]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Vehicle Management</h1>
              <p className="text-gray-600 mt-1">
                {residentData ? `${residentData.name} - Flat ${residentData.flat_no}` : "Loading..."}
              </p>
            </div>
            <div className="flex gap-3">
            
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Your Vehicles</h2>
                <button
                  onClick={() => setShowVehicleForm(!showVehicleForm)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                  {showVehicleForm ? (
                    <>
                      <ChevronUp size={18} /> Hide Form
                    </>
                  ) : (
                    <>
                      <Plus size={18} /> Add Vehicle
                    </>
                  )}
                </button>
              </div>

              {/* Vehicle Registration Form */}
              {showVehicleForm && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <UserPlus className="text-blue-600" size={24} />
                    <h3 className="text-lg font-semibold text-gray-800">
                      {activeTab === "personal" ? "Register Personal Vehicle" : "Register Guest Vehicle"}
                    </h3>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 mb-6">
                    <button
                      onClick={() => setActiveTab("personal")}
                      className={`px-4 py-2 font-medium text-sm ${
                        activeTab === "personal" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Personal Vehicle
                    </button>
                    <button
                      onClick={() => setActiveTab("guest")}
                      className={`px-4 py-2 font-medium text-sm ${
                        activeTab === "guest" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Guest Vehicle
                    </button>
                  </div>

                  {/* Personal Vehicle Form */}
                  {activeTab === "personal" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
                        <div className="relative">
                          <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            placeholder="e.g., MH12AB1234"
                            value={personalVehicleForm.vehicle_no}
                            onChange={(e) =>
                              setPersonalVehicleForm({
                                ...personalVehicleForm,
                                vehicle_no: e.target.value.toUpperCase(),
                              })
                            }
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Format: MH12AB1234</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type *</label>
                        <div className="relative">
                          <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <select
                            value={personalVehicleForm.vehicle_type}
                            onChange={(e) =>
                              setPersonalVehicleForm({
                                ...personalVehicleForm,
                                vehicle_type: e.target.value,
                              })
                            }
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
                            required
                          >
                            <option value="car">Car</option>
                            <option value="bike">Bike</option>
                            <option value="scooter">Scooter</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={registerPersonalVehicle}
                          disabled={!personalVehicleForm.vehicle_no || loading}
                          className={`w-full py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                            personalVehicleForm.vehicle_no && !loading
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {loading ? (
                            <span className="flex items-center">
                              <RefreshCw className="animate-spin mr-2" size={18} />
                              Processing...
                            </span>
                          ) : (
                            <>
                              <Plus size={18} /> Register Vehicle
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Guest Vehicle Form */}
                  {activeTab === "guest" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Visitor *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <select
                            value={guestVehicleForm.visitor_id}
                            onChange={(e) =>
                              setGuestVehicleForm({
                                ...guestVehicleForm,
                                visitor_id: e.target.value,
                              })
                            }
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
                            required
                            disabled={loading || visitors.length === 0}
                          >
                            <option value="">Select a visitor</option>
                            {visitors.map((visitor) => (
                              <option key={visitor._id} value={visitor._id}>
                                {visitor.name} ({visitor.phone})
                              </option>
                            ))}
                          </select>
                        </div>
                        {visitors.length === 0 && (
                          <p className="text-xs text-red-500 mt-1">No visitors found. Please invite visitors first.</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
                        <div className="relative">
                          <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            placeholder="e.g., MH12AB1234"
                            value={guestVehicleForm.vehicle_no}
                            onChange={(e) =>
                              setGuestVehicleForm({
                                ...guestVehicleForm,
                                vehicle_no: e.target.value.toUpperCase(),
                              })
                            }
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            required
                            disabled={loading}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Format: MH12AB1234</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type *</label>
                        <div className="relative">
                          <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <select
                            value={guestVehicleForm.vehicle_type}
                            onChange={(e) =>
                              setGuestVehicleForm({
                                ...guestVehicleForm,
                                vehicle_type: e.target.value,
                              })
                            }
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
                            required
                            disabled={loading}
                          >
                            <option value="car">Car</option>
                            <option value="bike">Bike</option>
                            <option value="scooter">Scooter</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={registerGuestVehicle}
                          disabled={!guestVehicleForm.visitor_id || !guestVehicleForm.vehicle_no || loading || visitors.length === 0}
                          className={`w-full py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                            guestVehicleForm.visitor_id && guestVehicleForm.vehicle_no && !loading && visitors.length > 0
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {loading ? (
                            <span className="flex items-center">
                              <RefreshCw className="animate-spin mr-2" size={18} />
                              Processing...
                            </span>
                          ) : (
                            <>
                              <Plus size={18} /> Register Vehicle
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Vehicle List */}
              {loading && vehicles.length === 0 ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : vehicles.length > 0 ? (
                <div className="space-y-4">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle._id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-3 rounded-lg ${
                              vehicle.current_status === "inside" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {getVehicleIcon(vehicle.vehicle_type)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800">{vehicle.vehicle_no}</h3>
                            <p className="text-sm text-gray-600 capitalize">
                              {vehicle.vehicle_type} • {vehicle.is_guest ? "Guest Vehicle" : "Personal Vehicle"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              vehicle.current_status === "inside" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {vehicle.current_status === "inside" ? "Inside" : "Outside"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          {vehicle.is_guest ? (
                            <p className="flex items-center">
                              <UserPlus size={14} className="mr-1" />
                              {vehicle.visitor_name || "Guest"}
                            </p>
                          ) : (
                            <p className="flex items-center">
                              <User size={14} className="mr-1" />
                              {residentData?.name}
                            </p>
                          )}
                          {vehicle.last_timestamp && (
                            <p className="flex items-center mt-1">
                              <Clock size={14} className="mr-1" />
                              Last {vehicle.last_action?.toLowerCase()}: {formatDate(vehicle.last_timestamp)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewVehicleLogs(vehicle._id)}
                            disabled={loading}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="View logs"
                          >
                            <Clock size={16} />
                          </button>
                          <button
                            onClick={() => deleteVehicle(vehicle._id)}
                            disabled={loading}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Delete vehicle"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Car size={48} className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-lg text-gray-600 mb-2">No vehicles registered yet</p>
                  <p className="text-gray-500">Add your first vehicle using the button above</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Vehicle Status Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-medium">Inside Premises</span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {vehicles.filter((v) => v.current_status === "inside").length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-red-700 font-medium">Outside Premises</span>
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {vehicles.filter((v) => v.current_status === "outside").length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-700 font-medium">Total Vehicles</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">{vehicles.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
              {vehicles.length > 0 ? (
                <div className="space-y-4">
                  {vehicles
                    .filter((v) => v.last_timestamp)
                    .sort((a, b) => new Date(b.last_timestamp) - new Date(a.last_timestamp))
                    .slice(0, 3)
                    .map((vehicle) => (
                      <div key={vehicle._id} className="flex items-start gap-3">
                        <div className="mt-1">{getStatusIcon(vehicle.current_status)}</div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {vehicle.vehicle_no} ({vehicle.vehicle_type})
                          </p>
                          <p className="text-xs text-gray-500">
                            {vehicle.last_action} at {formatDate(vehicle.last_timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Logs Modal */}
      {showLogsModal && selectedVehicle && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedVehicle.vehicle_no} - Movement History
                </h2>
                <button
                  onClick={() => setShowLogsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      selectedVehicle.current_status === "inside" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {getVehicleIcon(selectedVehicle.vehicle_type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{selectedVehicle.vehicle_no}</h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {selectedVehicle.vehicle_type} • {selectedVehicle.is_guest ? "Guest Vehicle" : "Personal Vehicle"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedVehicle.current_status === "inside" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    Current Status: {selectedVehicle.current_status === "inside" ? "Inside" : "Outside"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedVehicle.entry_status === "allowed" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    Entry Status: {selectedVehicle.entry_status === "allowed" ? "Allowed" : "Blocked"}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-medium text-gray-800 mb-3">Movement Logs</h3>
                {vehicleLogs.length > 0 ? (
                  <div className="space-y-4">
                    {vehicleLogs.map((log, index) => (
                      <div key={index} className="border-l-2 border-blue-200 pl-4 py-1">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">
                              {log.action === "Entered" ? (
                                <span className="text-green-600">Entered Premises</span>
                              ) : log.action === "Exited" ? (
                                <span className="text-red-600">Exited Premises</span>
                              ) : (
                                <span>{log.action}</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">{formatDate(log.timestamp)}</p>
                          </div>
                          {log.verified_by && (
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Verified by Security</div>
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
                  <p className="text-gray-500 text-center py-4">No movement logs available</p>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowLogsModal(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentVehicleManagement;