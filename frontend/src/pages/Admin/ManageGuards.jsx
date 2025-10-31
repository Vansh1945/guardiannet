import { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch, FaFilter, FaTimes, FaEdit, FaTrash } from "react-icons/fa";
import { IoCheckmarkDone, IoClose } from "react-icons/io5";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../Context/AuthContext";

const ManageGuards = () => {
  const { API } = useAuth();
  const [securityUsers, setSecurityUsers] = useState([]);
  const [error, setError] = useState("");
  const [rejectRemark, setRejectRemark] = useState("");
  const [selectedRejectId, setSelectedRejectId] = useState(null);
  const [selectedEditUser, setSelectedEditUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    sortBy: "newest"
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: ""
  });

  useEffect(() => {
    fetchSecurityUsers();
  }, []);

  const fetchSecurityUsers = async () => {
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
        // Filter users with security role
        const securityUsers = response.data.users.filter(user => user.role === 'security');
        setSecurityUsers(securityUsers);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError("Failed to fetch security personnel.");
      toast.error("Failed to fetch security personnel.");
      console.error("Error fetching security personnel:", err);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId) => {
    const toastId = toast.loading("Approving security personnel...");
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

      setSecurityUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, approval_status: "approved" } : user
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

    const toastId = toast.loading("Rejecting security personnel...");
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

      setSecurityUsers((prev) =>
        prev.map((user) =>
          user._id === selectedRejectId
            ? { ...user, approval_status: "rejected", remark: rejectRemark }
            : user
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

  const updateUser = async () => {
    const toastId = toast.loading("Updating security personnel...");
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
        `${API}/admin/update/${selectedEditUser._id}`,
        editForm,
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

      setSecurityUsers((prev) =>
        prev.map((user) =>
          user._id === selectedEditUser._id ? { ...user, ...editForm } : user
        )
      );

      setSelectedEditUser(null);
    } catch (err) {
      toast.update(toastId, {
        render: err.response?.data?.message || "Update failed. Try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
      console.error("Update error:", err);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this security personnel?")) return;

    const toastId = toast.loading("Deleting security personnel...");
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

      const response = await axios.delete(
        `${API}/admin/remove/${userId}`,
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

      setSecurityUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (err) {
      toast.update(toastId, {
        render: err.response?.data?.message || "Deletion failed. Try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000
      });
      console.error("Deletion error:", err);
    }
  };

  // Apply all filters
  const filteredUsers = securityUsers.filter((user) => {
    // Search filter
    const matchesSearch = Object.values(user).some(
      (value) =>
        value &&
        typeof value === "string" &&
        value.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Status filter
    const matchesStatus = 
      filters.status === "all" || 
      user.approval_status === filters.status;

    return matchesSearch && matchesStatus;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (filters.sortBy === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= Math.ceil(filteredUsers.length / itemsPerPage)) {
      setCurrentPage(pageNumber);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      status: "all",
      sortBy: "newest"
    });
    setSearchQuery("");
  setCurrentPage(1);
  };

  // Open edit modal and set form data
  const openEditModal = (user) => {
    setSelectedEditUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      badgeNumber: user.badgeNumber || ""
    });
  };

  return (
    <div className="p-6 mt-10 md:p-10 min-h-screen bg-gray-50">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 text-center">
          Manage Guards
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
              placeholder="Search by name, email ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border p-3 w-full rounded-lg shadow-sm pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaFilter /> Filters
            </button>

            {(filters.status !== "all" || filters.sortBy !== "newest") && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors"
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
              className="bg-white p-4 rounded-lg shadow-md mb-6 overflow-hidden border border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approval Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Sort Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                <h3 className="text-sm text-gray-500">Total Security Personnel</h3>
                <p className="text-2xl font-bold text-gray-800">{securityUsers.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                <h3 className="text-sm text-gray-500">Approved</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {securityUsers.filter(u => u.approval_status === "approved").length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
                <h3 className="text-sm text-gray-500">Pending</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {securityUsers.filter(u => u.approval_status === "pending").length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                <h3 className="text-sm text-gray-500">Rejected</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {securityUsers.filter(u => u.approval_status === "rejected").length}
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Phone
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
                  {currentUsers.length > 0 ? (
                    currentUsers.map((user) => (
                      <motion.tr 
                        key={user._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                              {user.name?.charAt(0) || "S"}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 capitalize">
                                {user.name || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.phone || "N/A"}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.approval_status === "approved"
                              ? "bg-green-100 text-green-800"
                              : user.approval_status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {user.approval_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            {user.approval_status === "pending" && (
                              <>
                                <button
                                  onClick={() => approveUser(user._id)}
                                  className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                                  title="Approve"
                                >
                                  <IoCheckmarkDone /> Approve
                                </button>
                                <button
                                  onClick={() => setSelectedRejectId(user._id)}
                                  className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                                  title="Reject"
                                >
                                  <IoClose /> Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                              title="Edit"
                            >
                              <FaEdit /> Edit
                            </button>
                            <button
                              onClick={() => deleteUser(user._id)}
                              className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                              title="Delete"
                            >
                              <FaTrash /> Delete
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No security personnel found matching your criteria
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
                    <h3 className="text-lg font-bold mb-4 text-gray-800">Reject Security Personnel</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Please provide a reason for rejecting this security personnel:
                    </p>
                    <textarea
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
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

            {/* Edit Modal */}
            <AnimatePresence>
              {selectedEditUser && (
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
                    <h3 className="text-lg font-bold mb-4 text-gray-800">Edit Security Personnel</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Badge Number</label>
                        <input
                          type="text"
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          value={editForm.badgeNumber}
                          onChange={(e) => setEditForm({...editForm, badgeNumber: e.target.value})}
                        />
                      </div>
                     
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => setSelectedEditUser(null)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updateUser}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Save Changes
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
                  {Math.min(indexOfLastItem, filteredUsers.length)}
                </span>{" "}
                of <span className="font-medium">{filteredUsers.length}</span> results
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${currentPage === 1 ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                >
                  Previous
                </button>
                {[...Array(Math.ceil(filteredUsers.length / itemsPerPage)).keys()].map((num) => (
                  <button
                    key={num + 1}
                    onClick={() => paginate(num + 1)}
                    className={`px-3 py-1 rounded-md ${currentPage === num + 1 ? "bg-blue-800 text-white" : "bg-white text-blue-600 hover:bg-gray-100"}`}
                  >
                    {num + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={indexOfLastItem >= filteredUsers.length}
                  className={`px-3 py-1 rounded-md ${indexOfLastItem >= filteredUsers.length ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
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

export default ManageGuards;
