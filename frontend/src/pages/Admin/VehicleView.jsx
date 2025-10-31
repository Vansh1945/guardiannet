import { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch, FaFilter, FaTimes, FaCar, FaLock, FaLockOpen, FaInfoCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../Context/AuthContext";

const VehicleAdminPanel = () => {
    const [vehicles, setVehicles] = useState([]);
    const [error, setError] = useState("");
    const [blockReason, setBlockReason] = useState("");
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: "all",
        type: "all",
        sortBy: "newest"
    });
    const [vehicleDetails, setVehicleDetails] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const { API } = useAuth();
    // Fetch vehicles from API
    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Unauthorized: Token missing!");
                return;
            }

            const response = await axios.get(`${API}/vehicle/admin/all`, {
                params: {
                    search: searchQuery,
                    type: filters.type === "all" ? undefined : filters.type,
                    status: filters.status === "all" ? undefined : filters.status,
                    page: currentPage,
                    limit: itemsPerPage
                },
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });

            if (response.data?.success) {
                // Normalize vehicle data structure
                const normalizedVehicles = response.data.data.map(vehicle => ({
                    ...vehicle,
                    owner: vehicle.owner || {
                        name: vehicle.owner_name || "N/A",
                        phone: vehicle.owner_phone || vehicle.owner_contact || "N/A",
                        flat_no: vehicle.flat_no || "N/A"
                    }
                }));
                setVehicles(normalizedVehicles || []);
            } else {
                throw new Error("Invalid response format");
            }
        } catch (err) {
            setError("Failed to fetch vehicles.");
            toast.error("Failed to fetch vehicles.");
            console.error("Error fetching vehicles:", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch vehicle details
    const fetchVehicleDetails = async (vehicleId) => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Unauthorized: Token missing!");
                return;
            }

            const response = await axios.get(`${API}/vehicle/admin/${vehicleId}`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });

            if (response.data?.success) {
                // Normalize the vehicle details structure
                const vehicleData = response.data.data;
                setVehicleDetails({
                    ...vehicleData,
                    owner: vehicleData.owner || {
                        name: vehicleData.owner_name || "N/A",
                        phone: vehicleData.owner_phone || vehicleData.owner_contact || "N/A",
                        flat_no: vehicleData.flat_no || "N/A"
                    }
                });
                setShowDetailsModal(true);
            } else {
                throw new Error("Invalid response format");
            }
        } catch (err) {
            toast.error("Failed to fetch vehicle details.");
            console.error("Error fetching vehicle details:", err);
        } finally {
            setLoading(false);
        }
    };

    // Block vehicle
    const handleBlockVehicle = async () => {
        if (!blockReason.trim() && !confirm("Are you sure you want to block without providing a reason?")) {
            return;
        }

        const toastId = toast.loading("Blocking vehicle...");
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

            const response = await axios.post(
                `${API}/vehicle/block/${selectedVehicle.vehicle_no}`,
                { reason: blockReason || "No reason provided" },
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

            setBlockReason("");
            setSelectedVehicle(null);
            fetchVehicles();
        } catch (err) {
            toast.update(toastId, {
                render: err.response?.data?.message || "Blocking failed. Try again.",
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
            console.error("Blocking error:", err);
        }
    };

    // Unblock vehicle
    const handleUnblockVehicle = async (vehicleNo) => {
        const toastId = toast.loading("Unblocking vehicle...");
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

            const response = await axios.post(
                `${API}/vehicle/unblock/${vehicleNo}`,
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

            fetchVehicles();
        } catch (err) {
            toast.update(toastId, {
                render: err.response?.data?.message || "Unblocking failed. Try again.",
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
            console.error("Unblocking error:", err);
        }
    };

    // Apply all filters
    const filteredVehicles = vehicles.filter((vehicle) => {
        // Search filter
        const matchesSearch =
            vehicle.vehicle_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vehicle.flat_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (vehicle.owner?.name && vehicle.owner.name.toLowerCase().includes(searchQuery.toLowerCase()));

        // Status filter
        const matchesStatus =
            filters.status === "all" ||
            (filters.status === "inside" && vehicle.current_status === "inside") ||
            (filters.status === "outside" && vehicle.current_status === "outside");

        // Type filter
        const matchesType =
            filters.type === "all" ||
            (filters.type === "guest" && vehicle.is_guest) ||
            (filters.type === "resident" && !vehicle.is_guest);

        return matchesSearch && matchesStatus && matchesType;
    });

    // Sort vehicles
    const sortedVehicles = [...filteredVehicles].sort((a, b) => {
        if (filters.sortBy === "newest") {
            return new Date(b.createdAt) - new Date(a.createdAt);
        } else {
            return new Date(a.createdAt) - new Date(b.createdAt);
        }
    });

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentVehicles = sortedVehicles.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= Math.ceil(filteredVehicles.length / itemsPerPage)) {
            setCurrentPage(pageNumber);
        }
    };

    // Reset all filters
    const resetFilters = () => {
        setFilters({
            status: "all",
            type: "all",
            sortBy: "newest"
        });
        setSearchQuery("");
    };

    useEffect(() => {
        fetchVehicles();
    }, [currentPage, filters, searchQuery]);

    // Stats calculation
    const stats = {
        total: vehicles.length,
        active: vehicles.filter(v => v.entry_status === "allowed").length,
        blocked: vehicles.filter(v => v.entry_status === "denied").length,
        guests: vehicles.filter(v => v.is_guest).length
    };

    return (
        <div className="p-6 mt-10 md:p-10 min-h-screen bg-background">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                <h2 className="text-2xl m-10 md:text-3xl font-bold mb-6 text-primary text-center">
                    Vehicle Management
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
                            placeholder="Search by vehicle no, flat no, owner..."
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

                        {(filters.status !== "all" || filters.type !== "all" || filters.sortBy !== "newest") && (
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
                                        Current Status
                                    </label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-secondary"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="inside">Inside Premises</option>
                                        <option value="outside">Outside Premises</option>
                                    </select>
                                </div>

                                {/* Type Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-primary-dark mb-1">
                                        Vehicle Type
                                    </label>
                                    <select
                                        value={filters.type}
                                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-secondary"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="resident">Resident</option>
                                        <option value="guest">Guest</option>
                                    </select>
                                </div>

                                {/* Sort Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-primary-dark mb-1">
                                        Sort By
                                    </label>
                                    <select
                                        value={filters.sortBy}
                                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
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
                                <div className="flex items-center gap-3">
                                    <FaCar className="text-2xl text-secondary" />
                                    <div>
                                        <h3 className="text-sm text-gray-500">Total Vehicles</h3>
                                        <p className="text-2xl font-bold text-primary-dark">{stats.total}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                                <div className="flex items-center gap-3">
                                    <FaLockOpen className="text-2xl text-green-500" />
                                    <div>
                                        <h3 className="text-sm text-gray-500">Active</h3>
                                        <p className="text-2xl font-bold text-primary-dark">{stats.active}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                                <div className="flex items-center gap-3">
                                    <FaLock className="text-2xl text-red-500" />
                                    <div>
                                        <h3 className="text-sm text-gray-500">Blocked</h3>
                                        <p className="text-2xl font-bold text-primary-dark">{stats.blocked}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
                                <div className="flex items-center gap-3">
                                    <FaCar className="text-2xl text-yellow-500" />
                                    <div>
                                        <h3 className="text-sm text-gray-500">Guest Vehicles</h3>
                                        <p className="text-2xl font-bold text-primary-dark">{stats.guests}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-primary">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Vehicle No.
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Flat No
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Owner
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
                                    {currentVehicles.length > 0 ? (
                                        currentVehicles.map((vehicle) => (
                                            <motion.tr
                                                key={vehicle._id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-primary-dark">
                                                    {vehicle.vehicle_no}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vehicle.is_guest ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                                                        }`}>
                                                        {vehicle.is_guest ? "Guest" : "Resident"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {vehicle.flat_no || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {vehicle.owner?.name || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vehicle.entry_status === "allowed"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                            }`}>
                                                            {vehicle.entry_status === "allowed" ? "Allowed" : "Blocked"}
                                                        </span>
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vehicle.current_status === "inside"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : "bg-gray-100 text-gray-800"
                                                            }`}>
                                                            {vehicle.current_status === "inside" ? "Inside" : "Outside"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => fetchVehicleDetails(vehicle._id)}
                                                            className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                                                        >
                                                            <FaInfoCircle /> Details
                                                        </button>
                                                        {vehicle.entry_status === "allowed" ? (
                                                            <button
                                                                onClick={() => setSelectedVehicle(vehicle)}
                                                                className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                                                            >
                                                                <FaLock /> Block
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleUnblockVehicle(vehicle.vehicle_no)}
                                                                className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                                                            >
                                                                <FaLockOpen /> Unblock
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                                No vehicles found matching your criteria
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Block Vehicle Modal */}
                        <AnimatePresence>
                            {selectedVehicle && (
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
                                        <h3 className="text-lg font-bold mb-4 text-primary-dark">Block Vehicle</h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            You are about to block vehicle: <strong>{selectedVehicle.vehicle_no}</strong>
                                        </p>
                                        <textarea
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-secondary mb-4"
                                            rows="4"
                                            placeholder="Enter reason for blocking (optional)..."
                                            value={blockReason}
                                            onChange={(e) => setBlockReason(e.target.value)}
                                        />
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => {
                                                    setSelectedVehicle(null);
                                                    setBlockReason("");
                                                }}
                                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleBlockVehicle}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                            >
                                                Confirm Block
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Vehicle Details Modal */}
                        <AnimatePresence>
                            {showDetailsModal && vehicleDetails && (
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
                                        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-primary-dark">
                                                Vehicle Details - {vehicleDetails.vehicle_no}
                                            </h3>
                                            <button
                                                onClick={() => setShowDetailsModal(false)}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            {/* Vehicle Information */}
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="font-medium text-lg mb-3 text-primary-dark border-b pb-2">
                                                    Vehicle Information
                                                </h4>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-sm text-gray-500">Vehicle Type</p>
                                                        <p className="font-medium capitalize">{vehicleDetails.vehicle_type || "N/A"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Flat/Unit</p>
                                                        <p className="font-medium">{vehicleDetails.flat_no || "N/A"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Owner Type</p>
                                                        <p className="font-medium capitalize">
                                                            {vehicleDetails.is_guest ? "Guest" : "Resident"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Entry Status</p>
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vehicleDetails.entry_status === "allowed"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                            }`}>
                                                            {vehicleDetails.entry_status === "allowed" ? "Allowed" : "Blocked"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Owner Information */}
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="font-medium text-lg mb-3 text-primary-dark border-b pb-2">
                                                    Owner Information
                                                </h4>
                                                {vehicleDetails.owner ? (
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-sm text-gray-500">Name</p>
                                                            <p className="font-medium">
                                                                {vehicleDetails.owner.name || "N/A"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Contact</p>
                                                            <p className="font-medium">
                                                                {vehicleDetails.owner.phone || "N/A"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Type</p>
                                                            <p className="font-medium">
                                                                {vehicleDetails.is_guest ? "Guest" : "Resident"}
                                                            </p>
                                                        </div>
                                                        {!vehicleDetails.is_guest && (
                                                            <div>
                                                                <p className="text-sm text-gray-500">Flat No</p>
                                                                <p className="font-medium">
                                                                    {vehicleDetails.flat_no || vehicleDetails.owner.flat_no || "N/A"}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500">No owner information available</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Movement History */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-medium text-lg mb-3 text-primary-dark border-b pb-2">
                                                Movement History
                                            </h4>
                                            {vehicleDetails.movement_logs?.length > 0 ? (
                                                <div className="space-y-4">
                                                    {vehicleDetails.movement_logs
                                                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                                        .map((log, index) => (
                                                            <div key={index} className="border-l-4 pl-4 py-2" style={{
                                                                borderColor:
                                                                    log.action === "Registered" ? "#4caf50" :
                                                                        log.action === "Entered" ? "#2196f3" :
                                                                            log.action === "Exited" ? "#ff9800" :
                                                                                log.action === "Blocked" ? "#f44336" :
                                                                                    log.action === "Unblocked" ? "#9c27b0" : "#607d8b"
                                                            }}>
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <p className="font-medium">{log.action}</p>
                                                                        <p className="text-sm text-gray-500">
                                                                            {new Date(log.timestamp).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                    {log.reason && (
                                                                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                                                            {log.reason}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {log.verified_by && `Verified by: ${log.verified_by.name}`}
                                                                    {log.blocked_by && ` • Blocked by: ${log.blocked_by.name}`}
                                                                    {log.unblocked_by && ` • Unblocked by: ${log.unblocked_by.name}`}
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500">No movement history found</p>
                                            )}
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
                                    {Math.min(indexOfLastItem, filteredVehicles.length)}
                                </span>{" "}
                                of <span className="font-medium">{filteredVehicles.length}</span> results
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-md ${currentPage === 1 ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-primary text-white hover:bg-primary-dark"}`}
                                >
                                    Previous
                                </button>
                                {[...Array(Math.ceil(filteredVehicles.length / itemsPerPage)).keys()].map((num) => (
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
                                    disabled={indexOfLastItem >= filteredVehicles.length}
                                    className={`px-3 py-1 rounded-md ${indexOfLastItem >= filteredVehicles.length ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-primary text-white hover:bg-primary-dark"}`}
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

export default VehicleAdminPanel;