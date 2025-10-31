import { useEffect, useState } from "react";
import axios from "axios";
import { 
  FaSearch, 
  FaFilter, 
  FaTimes,
  FaExclamationTriangle,
  FaUserShield,
  FaHistory,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import { 
  MdWarning, 
  MdEmergency, 
  MdSecurity,
  MdPerson,
  MdLocationOn,
  MdAccessTime
} from "react-icons/md";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "react-modal";
import { useAuth } from "../../Context/AuthContext";

Modal.setAppElement("#root");

const EmergencyAlertsAdmin = () => {
  const { user, API } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    dateRange: "all"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: "Pending",
    actionTaken: "",
    assignedTo: ""
  });
  const [securityStaff, setSecurityStaff] = useState([]);
  const [tab, setTab] = useState("active");
  const [expandedAlert, setExpandedAlert] = useState(null);

  useEffect(() => {
    fetchAlerts();
    fetchSecurityStaff();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/emergency/all-emergency-alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch emergency alerts");
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/api/auth/security-staff", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSecurityStaff(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch security staff", error);
    }
  };

  const handleStatusChange = (e) => {
    const { name, value } = e.target;
    setStatusForm({
      ...statusForm,
      [name]: value
    });
  };

  const openStatusModal = (alert) => {
    setCurrentAlert(alert);
    setStatusForm({
      status: alert.status,
      actionTaken: alert.actionTaken || "",
      assignedTo: alert.assignedTo?._id || ""
    });
    setIsStatusModalOpen(true);
  };

  const openDetailsModal = (alert) => {
    setCurrentAlert(alert);
    setIsDetailsModalOpen(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/emergency/${currentAlert._id}/status`,
        statusForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Alert status updated successfully");
      fetchAlerts();
      setIsStatusModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update alert status");
      console.error("Status update error:", error);
    }
  };

  const handleDeleteAlert = async (id) => {
    if (window.confirm("Are you sure you want to delete this alert?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`http://localhost:5000/api/emergency/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Alert deleted successfully");
        fetchAlerts();
      } catch (error) {
        toast.error("Failed to delete alert");
        console.error("Delete error:", error);
      }
    }
  };

  // Filter and pagination logic
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.residentId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = 
      filters.type === "all" || 
      alert.type === filters.type;

    const matchesStatus = 
      filters.status === "all" || 
      alert.status === filters.status;

    const matchesDateRange = () => {
      if (filters.dateRange === "all") return true;
      const alertDate = new Date(alert.createdAt);
      const now = new Date();
      const diffHours = (now - alertDate) / (1000 * 60 * 60);
      
      if (filters.dateRange === "today") return diffHours < 24;
      if (filters.dateRange === "week") return diffHours < 168;
      if (filters.dateRange === "month") return diffHours < 720;
      return true;
    };

    return matchesSearch && matchesType && matchesStatus && matchesDateRange();
  });

  const activeAlerts = filteredAlerts.filter(alert => alert.status !== "Resolved");
  const resolvedAlerts = filteredAlerts.filter(alert => alert.status === "Resolved");

  const sortedAlerts = [...(tab === "active" ? activeAlerts : resolvedAlerts)].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAlerts = sortedAlerts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedAlerts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getAlertIcon = (type) => {
    switch (type) {
      case "Fire":
        return <MdEmergency className="text-red-500 text-2xl" />;
      case "Security Threat":
        return <MdSecurity className="text-blue-500 text-2xl" />;
      case "Unauthorized Entry":
        return <FaUserShield className="text-orange-500 text-2xl" />;
      case "Suspicious Person":
        return <MdPerson className="text-purple-500 text-2xl" />;
      default:
        return <MdWarning className="text-yellow-500 text-2xl" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">Pending</span>;
      case "Processing":
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">Processing</span>;
      case "Resolved":
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">Resolved</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">Unknown</span>;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const options = { 
      year: "numeric", 
      month: "short", 
      day: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const resetFilters = () => {
    setFilters({
      type: "all",
      status: "all",
      dateRange: "all"
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <div className="p-4 mt-10 md:p-10 min-h-screen bg-background">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex items-center mb-6 gap-4">
          <div className="bg-blue-600 p-3 rounded-lg">
            <FaExclamationTriangle className="text-2xl text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-primary">
            Emergency Alerts Dashboard
          </h2>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-1/2">
            <input
              type="text"
              placeholder="Search alerts by type, description, resident or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border p-3 w-full rounded-lg shadow-sm pl-10 focus:outline-none focus:ring-2 focus:ring-secondary text-text"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-primary-light text-white px-4 py-3 rounded-lg hover:bg-primary transition-colors"
            >
              <FaFilter /> Filters
            </button>

            {(filters.type !== "all" || filters.status !== "all" || filters.dateRange !== "all") && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 bg-gray-200 text-text px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <FaTimes /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-4 rounded-lg shadow-md mb-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    Alert Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-secondary"
                  >
                    <option value="all">All Types</option>
                    <option value="Fire">Fire</option>
                    <option value="Security Threat">Security Threat</option>
                    <option value="Suspicious Person">Suspicious Person</option>
                    <option value="Unauthorized Entry">Unauthorized Entry</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-secondary"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    Time Period
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-secondary"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Last 24 Hours</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-3 px-6 font-medium text-sm flex items-center gap-2 ${tab === "active" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-blue-600"}`}
            onClick={() => {
              setTab("active");
              setCurrentPage(1);
            }}
          >
            <FaExclamationTriangle /> Active Alerts ({activeAlerts.length})
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm flex items-center gap-2 ${tab === "history" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-blue-600"}`}
            onClick={() => {
              setTab("history");
              setCurrentPage(1);
            }}
          >
            <FaHistory /> Resolved Alerts ({resolvedAlerts.length})
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-secondary">
                <h3 className="text-sm text-gray-500">Total Alerts</h3>
                <p className="text-2xl font-bold text-primary-dark">{filteredAlerts.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                <h3 className="text-sm text-gray-500">Pending</h3>
                <p className="text-2xl font-bold text-primary-dark">
                  {filteredAlerts.filter(a => a.status === "Pending").length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
                <h3 className="text-sm text-gray-500">Processing</h3>
                <p className="text-2xl font-bold text-primary-dark">
                  {filteredAlerts.filter(a => a.status === "Processing").length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                <h3 className="text-sm text-gray-500">Resolved</h3>
                <p className="text-2xl font-bold text-primary-dark">
                  {filteredAlerts.filter(a => a.status === "Resolved").length}
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-primary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Alert Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Reported By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentAlerts.length > 0 ? (
                    currentAlerts.map((alert) => (
                      <motion.tr 
                        key={alert._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              {getAlertIcon(alert.type)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-primary-dark flex items-center gap-2">
                                {alert.type === "Other" ? alert.customTitle : alert.type}
                                {alert.photo && (
                                  <span 
                                    className="text-xs text-blue-600 cursor-pointer hover:underline"
                                    onClick={() => setExpandedAlert(alert._id)}
                                  >
                                    [View Photo]
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">{alert.description}</div>
                              <div className="text-xs text-gray-400 mt-1 flex items-center">
                                <MdLocationOn className="mr-1" /> {alert.location}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <MdPerson className="text-gray-500 text-xl" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-primary-dark">
                                {alert.residentId?.name || "Security"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {alert.residentId?.flat_no ? `Flat ${alert.residentId.flat_no}` : ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(alert.status)}
                            {alert.verifiedBy && (
                              <div className="text-xs text-gray-500">
                                Verified by: {alert.verifier?.name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <MdAccessTime className="text-gray-400" />
                            {formatDateTime(alert.createdAt)}
                          </div>
                          {alert.verifiedAt && (
                            <div className="text-xs text-gray-500 mt-1">
                              Resolved: {formatDateTime(alert.verifiedAt)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openDetailsModal(alert)}
                              className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                            >
                              Details
                            </button>
                            {(user?.role === "admin" || user?.role === "security") && (
                              <button
                                onClick={() => openStatusModal(alert)}
                                className="text-green-600 hover:text-green-800 px-3 py-1 rounded hover:bg-green-50 transition-colors"
                              >
                                Update
                              </button>
                            )}
                            {user?.role === "admin" && (
                              <button
                                onClick={() => handleDeleteAlert(alert._id)}
                                className="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center">
                        <div className="text-gray-500 flex flex-col items-center justify-center">
                          <FaExclamationTriangle className="text-3xl text-gray-400 mb-2" />
                          <p className="text-lg font-medium">No {tab === "active" ? "active" : "resolved"} alerts found</p>
                          <p className="text-sm">Try adjusting your filters or search query</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Expanded Alert Photo */}
            <AnimatePresence>
              {expandedAlert && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                  onClick={() => setExpandedAlert(null)}
                >
                  <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                    <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                      <h3 className="text-lg font-bold text-gray-800">Alert Evidence</h3>
                      <button 
                        onClick={() => setExpandedAlert(null)}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                      >
                        <FaTimes className="text-xl" />
                      </button>
                    </div>
                    <div className="p-6">
                      <img 
                        src={alerts.find(a => a._id === expandedAlert)?.photo} 
                        alt="Alert evidence" 
                        className="max-w-full max-h-[70vh] mx-auto rounded-lg border border-gray-200"
                      />
                      <div className="mt-4 text-sm text-gray-500">
                        <p>Uploaded: {formatDateTime(alerts.find(a => a._id === expandedAlert)?.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Update Modal */}
            <Modal
              isOpen={isStatusModalOpen}
              onRequestClose={() => setIsStatusModalOpen(false)}
              style={{
                overlay: {
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  zIndex: 1000
                },
                content: {
                  border: "none",
                  borderRadius: "0.75rem",
                  padding: "0",
                  maxWidth: "90%",
                  width: "32rem",
                  margin: "0 auto",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
                }
              }}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-primary-dark">Update Alert Status</h2>
                  <button
                    onClick={() => setIsStatusModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                  >
                    <FaTimes />
                  </button>
                </div>
                
                <form onSubmit={handleStatusSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-dark mb-1">Status</label>
                      <select
                        name="status"
                        value={statusForm.status}
                        onChange={handleStatusChange}
                        className="w-full p-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                    
                    {statusForm.status === "Processing" && (
                      <div>
                        <label className="block text-sm font-medium text-primary-dark mb-1">Assign To Security Staff</label>
                        <select
                          name="assignedTo"
                          value={statusForm.assignedTo}
                          onChange={handleStatusChange}
                          className="w-full p-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
                        >
                          <option value="">Select staff member</option>
                          {securityStaff.map(staff => (
                            <option key={staff._id} value={staff._id}>
                              {staff.name} ({staff.role})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-primary-dark mb-1">Action Taken</label>
                      <textarea
                        name="actionTaken"
                        value={statusForm.actionTaken}
                        onChange={handleStatusChange}
                        rows="3"
                        className="w-full p-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-secondary"
                        placeholder="Describe what action was taken..."
                        required={statusForm.status === "Resolved"}
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsStatusModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors shadow-md"
                    >
                      Update Status
                    </button>
                  </div>
                </form>
              </div>
            </Modal>

            {/* Alert Details Modal */}
            <Modal
              isOpen={isDetailsModalOpen}
              onRequestClose={() => setIsDetailsModalOpen(false)}
              style={{
                overlay: {
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  zIndex: 1000
                },
                content: {
                  border: "none",
                  borderRadius: "0.75rem",
                  padding: "0",
                  maxWidth: "90%",
                  width: "40rem",
                  margin: "0 auto",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
                }
              }}
            >
              {currentAlert && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-primary-dark">Alert Details</h2>
                    <button
                      onClick={() => setIsDetailsModalOpen(false)}
                      className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-primary-dark mb-2">Basic Information</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Type</p>
                          <p className="font-medium">{currentAlert.type === "Other" ? currentAlert.customTitle : currentAlert.type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <p>{getStatusBadge(currentAlert.status)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium">{currentAlert.location}</p>
                        </div>
                        {currentAlert.repeatedAttempts > 0 && (
                          <div>
                            <p className="text-sm text-gray-500">Repeated Attempts</p>
                            <p className="font-medium">{currentAlert.repeatedAttempts}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-primary-dark mb-2">Timeline</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Reported At</p>
                          <p className="font-medium">{formatDateTime(currentAlert.createdAt)}</p>
                        </div>
                        {currentAlert.verifiedAt && (
                          <div>
                            <p className="text-sm text-gray-500">Resolved At</p>
                            <p className="font-medium">{formatDateTime(currentAlert.verifiedAt)}</p>
                          </div>
                        )}
                        {currentAlert.verifier && (
                          <div>
                            <p className="text-sm text-gray-500">Verified By</p>
                            <p className="font-medium">
                              {currentAlert.verifier.name} ({currentAlert.verifier.role})
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-medium text-primary-dark mb-2">Description</h3>
                    <p className="text-gray-800">{currentAlert.description || "No description provided"}</p>
                  </div>
                  
                  {currentAlert.actionTaken && (
                    <div className="mt-6">
                      <h3 className="font-medium text-primary-dark mb-2">Action Taken</h3>
                      <p className="text-gray-800">{currentAlert.actionTaken}</p>
                    </div>
                  )}
                  
                  {currentAlert.photo && (
                    <div className="mt-6">
                      <h3 className="font-medium text-primary-dark mb-2">Evidence Photo</h3>
                      <img 
                        src={currentAlert.photo} 
                        alt="Alert evidence" 
                        className="max-w-full rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          setIsDetailsModalOpen(false);
                          setExpandedAlert(currentAlert._id);
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setIsDetailsModalOpen(false)}
                      className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors shadow-md"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </Modal>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, sortedAlerts.length)}
                </span>{" "}
                of <span className="font-medium">{sortedAlerts.length}</span> results
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${currentPage === 1 ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-primary text-white hover:bg-primary-dark"}`}
                >
                  Previous
                </button>
                {[...Array(totalPages).keys()].map((number) => (
                  <button
                    key={number + 1}
                    onClick={() => paginate(number + 1)}
                    className={`px-3 py-1 rounded-md ${currentPage === number + 1 ? "bg-secondary text-white" : "bg-white text-primary hover:bg-gray-100"}`}
                  >
                    {number + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={indexOfLastItem >= sortedAlerts.length}
                  className={`px-3 py-1 rounded-md ${indexOfLastItem >= sortedAlerts.length ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-primary text-white hover:bg-primary-dark"}`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default EmergencyAlertsAdmin;