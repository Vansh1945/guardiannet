import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaSearch,
    FaFilter,
    FaTimes,
    FaClock,
    FaUser,
    FaHome,
    FaArrowRight,
    FaArrowLeft,
    FaUserShield,
    FaIdCard,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../../Context/AuthContext";

const ResidentLogsView = () => {
    const { API } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filters, setFilters] = useState({
        permanentId: "",
        type: "all",
        startDate: null,
        endDate: null,
        limit: 10,
        page: 1,
    });
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
    });
    const [showFilters, setShowFilters] = useState(false);

    // Fetch PID suggestions
    const fetchSuggestions = async (query) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${API}/profile/pid-suggestions`,
                {
                    params: { query },
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (response.data?.success) {
                setSuggestions(response.data.suggestions || []);
                setShowSuggestions(true);
            }
        } catch (err) {
            console.error("Fetch suggestions error:", err);
        }
    };

    // Handle PID input changes
    const handlePidChange = (e) => {
        const value = e.target.value;
        setFilters((prev) => ({ ...prev, permanentId: value, page: 1 }));
        if (value.length > 1) {
            fetchSuggestions(value);
        } else {
            setShowSuggestions(false);
            setSuggestions([]);
        }
    };

    // Select a suggestion
    const selectSuggestion = (suggestion) => {
        setFilters((prev) => ({
            ...prev,
            permanentId: suggestion.permanentId,
            page: 1,
        }));
        setShowSuggestions(false);
    };

    // Fetch resident logs
    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError("");
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Unauthorized: Token missing!");
            }

            const params = {
                type: filters.type !== "all" ? filters.type : undefined,
                startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
                endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
                limit: filters.limit,
                page: filters.page,
            };

            let endpoint = "/profile/logs/all";
            if (filters.permanentId) {
                endpoint = `/profile/logs/${filters.permanentId}`;
            }

            const response = await axios.get(
                `${API}${endpoint}`,
                {
                    params,
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data?.success) {
                setLogs(response.data.logs || []);
                setPagination({
                    total: response.data.total || response.data.logs.length,
                    page: response.data.page || filters.page,
                    limit: response.data.limit || filters.limit,
                    totalPages: response.data.totalPages || Math.ceil((response.data.total || response.data.logs.length) / filters.limit),
                });
            } else {
                throw new Error(response.data.message || "Invalid response format");
            }
        } catch (err) {
            const errorMessage =
                err.response?.data?.message || err.message || "Failed to fetch logs.";
            setError(errorMessage);
            toast.error(errorMessage);
            console.error("Fetch logs error:", err);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
    };

    // Handle date changes
    const handleDateChange = (date, field) => {
        setFilters((prev) => ({ ...prev, [field]: date, page: 1 }));
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            permanentId: "",
            type: "all",
            startDate: null,
            endDate: null,
            limit: 10,
            page: 1,
        });
        setLogs([]);
        setPagination({ total: 0, page: 1, limit: 10, totalPages: 1 });
        setShowSuggestions(false);
    };

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "N/A";
        const date = new Date(timestamp);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    };

    // Pagination handler
    const handlePageChange = (page) => {
        if (page > 0 && page <= pagination.totalPages) {
            setFilters((prev) => ({ ...prev, page }));
        }
    };

    // Fetch logs when filters change
    useEffect(() => {
        fetchLogs();
    }, [filters.page, filters.type, filters.startDate, filters.endDate, filters.permanentId]);

    // Get paginated logs
    const getPaginatedLogs = () => {
        const startIndex = (filters.page - 1) * filters.limit;
        const endIndex = startIndex + filters.limit;
        return logs.slice(startIndex, endIndex);
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
                    Resident Entry/Exit Logs
                </h2>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                        <p>{error}</p>
                        <button
                            onClick={fetchLogs}
                            className="mt-2 text-sm text-secondary hover:underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Search and Filter Bar */}
                <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-1/2">
                        <div className="relative">
                            <input
                                type="text"
                                name="permanentId"
                                placeholder="Search by Permanent ID or Name"
                                value={filters.permanentId}
                                onChange={handlePidChange}
                                className="border p-3 w-full rounded-lg shadow-sm pl-10 focus:outline-none focus:ring-2 focus:ring-secondary text-text"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        </div>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg max-h-60 overflow-auto">
                                {suggestions.map((suggestion) => (
                                    <div
                                        key={suggestion.permanentId}
                                        className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                                        onClick={() => selectSuggestion(suggestion)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FaIdCard className="text-secondary" />
                                            <span className="font-medium">{suggestion.permanentId}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <FaUser className="text-gray-400" />
                                            {suggestion.name} ({suggestion.relation})
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <FaHome className="text-gray-400" />
                                            Flat: {suggestion.flatNo}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 bg-primary-light text-white px-4 py-3 rounded-lg hover:bg-primary transition-colors"
                        >
                            <FaFilter /> Filters
                        </button>

                        {(filters.type !== "all" || filters.startDate || filters.endDate) && (
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
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary-dark mb-1">
                                        Log Type
                                    </label>
                                    <select
                                        name="type"
                                        value={filters.type}
                                        onChange={handleFilterChange}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-secondary"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="entry">Entry Only</option>
                                        <option value="exit">Exit Only</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary-dark mb-1">
                                        Start Date
                                    </label>
                                    <DatePicker
                                        selected={filters.startDate}
                                        onChange={(date) => handleDateChange(date, "startDate")}
                                        selectsStart
                                        startDate={filters.startDate}
                                        endDate={filters.endDate}
                                        placeholderText="Select start date"
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-secondary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary-dark mb-1">
                                        End Date
                                    </label>
                                    <DatePicker
                                        selected={filters.endDate}
                                        onChange={(date) => handleDateChange(date, "endDate")}
                                        selectsEnd
                                        startDate={filters.startDate}
                                        endDate={filters.endDate}
                                        minDate={filters.startDate}
                                        placeholderText="Select end date"
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-secondary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary-dark mb-1">
                                        Items per page
                                    </label>
                                    <select
                                        name="limit"
                                        value={filters.limit}
                                        onChange={handleFilterChange}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-secondary"
                                    >
                                        <option value="5">5</option>
                                        <option value="10">10</option>
                                        <option value="20">20</option>
                                        <option value="50">50</option>
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
                                <h3 className="text-sm text-gray-500">Total Logs</h3>
                                <p className="text-2xl font-bold text-primary-dark">{logs.length}</p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                                <h3 className="text-sm text-gray-500">Entry Logs</h3>
                                <p className="text-2xl font-bold text-primary-dark">
                                    {logs.filter(log => log.type === "entry").length}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                                <h3 className="text-sm text-gray-500">Exit Logs</h3>
                                <p className="text-2xl font-bold text-primary-dark">
                                    {logs.filter(log => log.type === "exit").length}
                                </p>
                            </div>

                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-primary">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Person
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Flat
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Method
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Time
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Verified By
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {getPaginatedLogs().length > 0 ? (
                                        getPaginatedLogs().map((log) => (
                                            <motion.tr
                                                key={log._id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {log.user?.profilePicture ? (
                                                            <img
                                                                src={`${API}/${log.user.profilePicture}`}
                                                                alt={log.personName}
                                                                className="w-10 h-10 rounded-full object-cover mr-3"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                                                <FaUser className="text-gray-500" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-primary-dark">
                                                                {log.personName}
                                                                {log.isFamilyMember && (
                                                                    <span className="ml-2 text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                                                                        Family
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                ID: {log.permanentId}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                    {log.flatNo || "N/A"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.type === "entry"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                            }`}
                                                    >
                                                        {log.type === "entry" ? "Entry" : "Exit"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                    {log.method || "Manual"}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center">
                                                        <FaClock className="mr-1 text-gray-400" />
                                                        {formatTimestamp(log.timestamp)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <FaUserShield className="mr-1 text-gray-400" />
                                                        <div>
                                                            <div className="text-sm font-medium text-primary-dark">
                                                                {log.verifiedBy?.name || "System"}
                                                            </div>
                                                            <div className="text-xs text-gray-500 capitalize">
                                                                {log.verifiedBy?.role || "Admin"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-6 py-4 text-center text-gray-500"
                                            >
                                                {filters.permanentId
                                                    ? "No logs found matching your criteria"
                                                    : "Search for a resident or view all logs"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {logs.length > 0 && (
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">
                                        {(filters.page - 1) * filters.limit + 1}
                                    </span> to{" "}
                                    <span className="font-medium">
                                        {Math.min(filters.page * filters.limit, logs.length)}
                                    </span>{" "}
                                    of <span className="font-medium">{logs.length}</span> results
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handlePageChange(filters.page - 1)}
                                        disabled={filters.page === 1}
                                        className={`px-3 py-1 rounded-md ${filters.page === 1
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                : "bg-primary text-white hover:bg-primary-dark"
                                            }`}
                                    >
                                        Previous
                                    </button>
                                    {[...Array(pagination.totalPages).keys()].map((num) => (
                                        <button
                                            key={num + 1}
                                            onClick={() => handlePageChange(num + 1)}
                                            className={`px-3 py-1 rounded-md ${filters.page === num + 1
                                                    ? "bg-secondary text-white"
                                                    : "bg-white text-primary hover:bg-gray-100"
                                                }`}
                                        >
                                            {num + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handlePageChange(filters.page + 1)}
                                        disabled={filters.page >= pagination.totalPages}
                                        className={`px-3 py-1 rounded-md ${filters.page >= pagination.totalPages
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                : "bg-primary text-white hover:bg-primary-dark"
                                            }`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default ResidentLogsView;