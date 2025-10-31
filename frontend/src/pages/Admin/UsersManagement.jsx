import { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch, FaFilter, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../Context/AuthContext";

const ManageUser = () => {
  const [residents, setResidents] = useState([]);
  const [error, setError] = useState("");
  const [rejectRemark, setRejectRemark] = useState("");
  const [selectedRejectId, setSelectedRejectId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    role: "all",
    sortBy: "newest"
  });
  const { API } = useAuth();

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Unauthorized: Token missing!");
          return;
        }

        const response = await axios.get(`${API}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        });

        if (response.data?.success && response.data.users) {
          setResidents(response.data.users);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        setError("Failed to fetch residents.");
        toast.error("Failed to fetch residents.");
        console.error("Error fetching residents:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, []);

  const approveUser = async (userId) => {
    const toastId = toast.loading("Approving user...");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.update(toastId, {
          render: "Unauthorized: Token missing!",
          type: "error",
          isLoading: false,
          autoClose: 3000
        });
        return;
      }

      const response = await axios.put(
        `${API}/admin/approve/${userId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );

      toast.update(toastId, {
        render: response.data.message,
        type: "success",
        isLoading: false,
        autoClose: 3000
      });

      setResidents((prev) =>
        prev.map((resident) =>
          resident._id === userId ? { ...resident, approval_status: "approved" } : resident
        )
      );
    } catch (err) {
      toast.update(toastId, {
        render: err.response?.data?.message || "Approval failed. Try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
      console.error("Approval error:", err);
    }
  };

  const rejectUser = async () => {
    if (!rejectRemark.trim()) {
      toast.warn("Please enter a remark for rejection.");
      return;
    }

    const toastId = toast.loading("Rejecting user...");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.update(toastId, {
          render: "Unauthorized: Token missing!",
          type: "error",
          isLoading: false,
          autoClose: 3000
        });
        return;
      }

      const response = await axios.put(
        `${API}/admin/reject/${selectedRejectId}`,
        { remark: rejectRemark },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );

      toast.update(toastId, {
        render: response.data.message,
        type: "success",
        isLoading: false,
        autoClose: 3000
      });

      setResidents((prev) =>
        prev.map((resident) =>
          resident._id === selectedRejectId
            ? { ...resident, approval_status: "rejected", remark: rejectRemark }
            : resident
        )
      );

      setRejectRemark("");
      setSelectedRejectId(null);
    } catch (err) {
      toast.update(toastId, {
        render: err.response?.data?.message || "Rejection failed. Try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
      console.error("Rejection error:", err);
    }
  };

  // Apply all filters
  const filteredResidents = residents.filter((resident) => {
    // Search filter
    const matchesSearch = Object.values(resident).some(
      (value) =>
        value &&
        typeof value === "string" &&
        value.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Status filter
    const matchesStatus = 
      filters.status === "all" || 
      resident.approval_status === filters.status;

    // Role filter
    const matchesRole = 
      filters.role === "all" || 
      resident.role === filters.role;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Sort residents
  const sortedResidents = [...filteredResidents].sort((a, b) => {
    if (filters.sortBy === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentResidents = sortedResidents.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= Math.ceil(filteredResidents.length / itemsPerPage)) {
      setCurrentPage(pageNumber);
    }
  };

  // Get unique roles for filter dropdown
  const uniqueRoles = [...new Set(residents.map(resident => resident.role))];

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      status: "all",
      role: "all",
      sortBy: "newest"
    });
    setSearchQuery("");
  };

  return (
    <div className="p-4 md:p-10 min-h-screen bg-background">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <h2 className="text-2xl m-10 md:text-3xl font-bold mb-6 text-primary text-center">
          Manage Users
        </h2>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-1/2">
            <input
              type="text"
              placeholder="Search by name, email, flat no..."
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

            {(filters.status !== "all" || filters.role !== "all" || filters.sortBy !== "newest") && (
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
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    Approval Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-secondary"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Role Filter */}
                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    User Role
                  </label>
                  <select
                    value={filters.role}
                    onChange={(e) => setFilters({...filters, role: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-secondary"
                  >
                    <option value="all">All Roles</option>
                    {uniqueRoles.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Filter */}
                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-secondary"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                <h3 className="text-sm text-gray-500">Total Users</h3>
                <p className="text-2xl font-bold text-primary-dark">{residents.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                <h3 className="text-sm text-gray-500">Approved</h3>
                <p className="text-2xl font-bold text-primary-dark">
                  {residents.filter(r => r.approval_status === "approved").length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
                <h3 className="text-sm text-gray-500">Pending</h3>
                <p className="text-2xl font-bold text-primary-dark">
                  {residents.filter(r => r.approval_status === "pending").length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                <h3 className="text-sm text-gray-500">Rejected</h3>
                <p className="text-2xl font-bold text-primary-dark">
                  {residents.filter(r => r.approval_status === "rejected").length}
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-primary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Flat No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentResidents.length > 0 ? (
                    currentResidents.map((resident) => (
                      <motion.tr 
                        key={resident._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-light flex items-center justify-center text-white font-bold">
                              {resident.name?.charAt(0) || "U"}
                            </div>
                            <div className="ml-4">
                            <div className="text-sm font-medium text-primary-dark capitalize">
                                {resident.name || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {resident.email || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-light/10 text-primary-dark capitalize">
                            {resident.role || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {resident.flat_no || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            resident.approval_status === "approved"
                              ? "bg-green-100 text-green-800"
                              : resident.approval_status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {resident.approval_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {resident.approval_status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => approveUser(resident._id)}
                                className="text-white bg-secondary hover:bg-secondary-dark px-3 py-1 rounded text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setSelectedRejectId(resident._id)}
                                className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No users found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Reject Modal */}
            <AnimatePresence>
              {selectedRejectId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
                  >
                    <h3 className="text-lg font-bold mb-4 text-primary-dark">Reject User</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Please provide a reason for rejecting this user:
                    </p>
                    <textarea
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-secondary mb-4"
                      rows="4"
                      placeholder="Enter rejection reason..."
                      value={rejectRemark}
                      onChange={(e) => setRejectRemark(e.target.value)}
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setSelectedRejectId(null);
                          setRejectRemark("");
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={rejectUser}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Confirm Reject
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredResidents.length)}
                </span>{" "}
                of <span className="font-medium">{filteredResidents.length}</span> results
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${currentPage === 1 ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-primary text-white hover:bg-primary-dark"}`}
                >
                  Previous
                </button>
                {[...Array(Math.ceil(filteredResidents.length / itemsPerPage)).keys()].map((num) => (
                  <button
                    key={num + 1}
                    onClick={() => paginate(num + 1)}
                    className={`px-3 py-1 rounded-md ${currentPage === num + 1 ? "bg-secondary text-white" : "bg-white text-primary hover:bg-gray-100"}`}
                  >
                    {num + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={indexOfLastItem >= filteredResidents.length}
                  className={`px-3 py-1 rounded-md ${indexOfLastItem >= filteredResidents.length ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-primary text-white hover:bg-primary-dark"}`}
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

export default ManageUser;