import { useEffect, useState } from "react";
import axios from "axios";
import {
    FaSearch,
    FaFilter,
    FaTimes,
    FaCalendarAlt,
    FaTrash,
    FaEdit,
    FaInfoCircle,
    FaPlus,
    FaUser,
    FaMapMarkerAlt
} from "react-icons/fa";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../Context/AuthContext";

const EventsManagement = () => {
    const { API } = useAuth();
    const [events, setEvents] = useState([]);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        pages: 1,
        limit: 10
    });
    const [error, setError] = useState("");
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: 'all',
        sort: 'date:1'
    });
    const [eventDetails, setEventDetails] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [editForm, setEditForm] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        image: null
    });

    const [createForm, setCreateForm] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        image: null
    });

    const isAdmin = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.log("No token found in localStorage");
            return false;
        }
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log("Token payload:", payload);
            return payload.role === 'admin';
        } catch (err) {
            console.error("Error decoding token:", err);
            return false;
        }
    };

    const getEventStatus = (event) => {
        if (!event?.date || !event?.time) return "past";

        try {
            // Create date strings in local timezone for comparison
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const currentTimeStr = now.toTimeString().substring(0, 5); // "HH:mm"

            // If event date is in the future
            if (event.date > todayStr) return "upcoming";

            // If event date is in the past
            if (event.date < todayStr) return "past";

            // If event is today, compare times
            return event.time >= currentTimeStr ? "upcoming" : "past";
        } catch (err) {
            console.error("Error determining event status:", err);
            return "past";
        }
    };

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError("");
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Unauthorized: Token missing!");
            }

            const params = {
                page: pagination.page,
                limit: pagination.limit,
                sort: filters.sort,
                search: searchQuery || undefined
            };

            if (filters.status !== 'all') {
                params.status = filters.status;
            }

            console.log("Fetching events with params:", params);

            const response = await axios.get(`${API}/event/view-event`, {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("API response:", response.data);

            if (response.data?.success) {
                const { events, pagination: paginationData } = response.data.data || {};
                if (!events || !paginationData) {
                    throw new Error("Invalid data format: missing events or pagination");
                }

                setEvents(events);
                setPagination({
                    total: paginationData.total || 0,
                    page: paginationData.page || 1,
                    pages: paginationData.pages || 1,
                    limit: paginationData.limit || 10
                });
            } else {
                throw new Error(response.data.message || "Invalid response format");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to fetch events.";
            setError(errorMessage);
            toast.error(errorMessage);
            console.error("Error fetching events:", err);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEventDetails = async (eventId) => {
        try {
            setLoading(true);
            setError("");
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Unauthorized: Token missing!");
            }

            const response = await axios.get(`http://localhost:5000/api/event/view-event/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("Event details response:", response.data);

            if (response.data?.success) {
                setEventDetails(response.data.data);
                setShowDetailsModal(true);
            } else {
                throw new Error(response.data.message || "Invalid response format");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Failed to fetch event details.";
            setError(errorMessage);
            toast.error(errorMessage);
            console.error("Error fetching event details:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async () => {
        const toastId = toast.loading("Deleting event...");
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Unauthorized: Token missing!");
            }

            const response = await axios.delete(
                `http://localhost:5000/api/event/delete-event/${selectedEvent._id}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast.update(toastId, {
                render: response.data.message || "Event deleted successfully",
                type: "success",
                isLoading: false,
                autoClose: 3000
            });

            setShowDeleteModal(false);
            setSelectedEvent(null);
            fetchEvents();
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Deletion failed. Try again.";
            toast.update(toastId, {
                render: errorMessage,
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
            console.error("Deletion error:", err);
        }
    };

    const handleUpdateEvent = async () => {
        const toastId = toast.loading("Updating event...");
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Unauthorized: Token missing!");
            }

            const formData = new FormData();
            formData.append('title', editForm.title);
            formData.append('description', editForm.description);
            formData.append('date', new Date(editForm.date).toISOString());
            formData.append('time', editForm.time);
            formData.append('location', editForm.location);
            if (editForm.image) {
                formData.append('image', editForm.image);
            }

            const response = await axios.put(
                `http://localhost:5000/api/event/update-event/${selectedEvent._id}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            toast.update(toastId, {
                render: response.data.message || "Event updated successfully",
                type: "success",
                isLoading: false,
                autoClose: 3000
            });

            setShowEditModal(false);
            setSelectedEvent(null);
            fetchEvents();
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Update failed. Try again.";
            toast.update(toastId, {
                render: errorMessage,
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
            console.error("Update error:", err);
        }
    };

    const handleCreateEvent = async () => {
        if (!isAdmin()) {
            toast.error("Only admins can create events!");
            return;
        }

        const toastId = toast.loading("Creating event...");
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Unauthorized: Token missing!");
            }

            const formData = new FormData();
            formData.append('title', createForm.title);
            formData.append('description', createForm.description);
            formData.append('date', new Date(createForm.date).toISOString());
            formData.append('time', createForm.time);
            formData.append('location', createForm.location);
            if (createForm.image) {
                formData.append('image', createForm.image);
            }

            const response = await axios.post(
                "http://localhost:5000/api/event/register-event",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            toast.update(toastId, {
                render: response.data.message || "Event created successfully",
                type: "success",
                isLoading: false,
                autoClose: 3000
            });

            setShowCreateModal(false);
            setCreateForm({
                title: "",
                description: "",
                date: "",
                time: "",
                location: "",
                image: null
            });
            fetchEvents();
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Creation failed. Try again.";
            toast.update(toastId, {
                render: errorMessage,
                type: "error",
                isLoading: false,
                autoClose: 3000
            });
            console.error("Creation error:", err);
        }
    };

    const resetFilters = () => {
        setFilters({
            status: 'all',
            sort: 'date:1'
        });
        setSearchQuery("");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatTime = (timeString) => {
        if (!timeString) return "N/A";
        const [hours, minutes] = timeString.split(':');
        const time = new Date();
        time.setHours(parseInt(hours, 10));
        time.setMinutes(parseInt(minutes, 10));
        return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.pages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleImageChange = (e, formType) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Image size must be less than 2MB");
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.error("Please upload an image file");
                return;
            }
            if (formType === 'create') {
                setCreateForm({ ...createForm, image: file });
            } else {
                setEditForm({ ...editForm, image: file });
            }
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [pagination.page, filters, searchQuery]);

    // Calculate stats for display
    const stats = events.reduce(
        (acc, event) => {
            const status = getEventStatus(event);
            acc[status]++;
            return acc;
        },
        { total: pagination.total, upcoming: 0, past: 0 }
    );

    return (
        <div className="p-6 mt-10 md:p-10 min-h-screen bg-gray-50">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-7xl mx-auto"
            >
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 text-center">
                    Events Management
                </h2>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                        <p>{error}</p>
                        <button
                            onClick={fetchEvents}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {isAdmin() && (
                    <div className="mb-6">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FaPlus /> Create Event
                        </button>
                    </div>
                )}

                <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-1/2">
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="border p-3 w-full rounded-lg shadow-sm pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            <FaFilter /> Filters
                        </button>

                        {(filters.status !== 'all' || filters.sort !== 'date:1' || searchQuery) && (
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                <FaTimes /> Clear
                            </button>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white p-4 rounded-lg shadow-md mb-6 overflow-hidden"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Event Status
                                    </label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">All Events</option>
                                        <option value="upcoming">Upcoming Events</option>
                                        <option value="past">Past Events</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sort By
                                    </label>
                                    <select
                                        value={filters.sort}
                                        onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="date:1">Date (Ascending)</option>
                                        <option value="date:-1">Date (Descending)</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                                <div className="flex items-center gap-3">
                                    <FaCalendarAlt className="text-2xl text-blue-500" />
                                    <div>
                                        <h3 className="text-sm text-gray-500">Total Events</h3>
                                        <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                                <div className="flex items-center gap-3">
                                    <FaCalendarAlt className="text-2xl text-green-500" />
                                    <div>
                                        <h3 className="text-sm text-gray-500">Upcoming</h3>
                                        <p className="text-2xl font-bold text-gray-800">{stats.upcoming}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-500">
                                <div className="flex items-center gap-3">
                                    <FaCalendarAlt className="text-2xl text-gray-500" />
                                    <div>
                                        <h3 className="text-sm text-gray-500">Past Events</h3>
                                        <p className="text-2xl font-bold text-gray-800">{stats.past}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Title
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Date & Time
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Location
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
                                    {events.length > 0 ? (
                                        events.map((event) => {
                                            const status = getEventStatus(event);

                                            return (
                                                <motion.tr
                                                    key={event._id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                        {event.title || "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div>
                                                            <div>{formatDate(event.date)}</div>
                                                            <div>{formatTime(event.time)}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {event.location || "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status === "upcoming" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                                            {status === "upcoming" ? "Upcoming" : "Past"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => fetchEventDetails(event._id)}
                                                                className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                                                            >
                                                                <FaInfoCircle /> Details
                                                            </button>
                                                            {isAdmin() && (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedEvent(event);
                                                                            setEditForm({
                                                                                title: event.title || "",
                                                                                description: event.description || "",
                                                                                date: event.date ? event.date.split('T')[0] : "",
                                                                                time: event.time || "",
                                                                                location: event.location || "",
                                                                                image: null
                                                                            });
                                                                            setShowEditModal(true);
                                                                        }}
                                                                        className="text-white bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                                                                    >
                                                                        <FaEdit /> Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedEvent(event);
                                                                            setShowDeleteModal(true);
                                                                        }}
                                                                        className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                                                                    >
                                                                        <FaTrash /> Delete
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                                {error ? "Error loading events. Please try again." : "No events found matching your criteria."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <AnimatePresence>
                            {showDetailsModal && eventDetails && (
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
                                            <h3 className="text-xl font-bold text-gray-800">
                                                Event Details - {eventDetails.title || "N/A"}
                                            </h3>
                                            <button
                                                onClick={() => setShowDetailsModal(false)}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>

                                        {eventDetails.image && (
                                            <div className="mb-6">
                                                <img
                                                    src={eventDetails.image}
                                                    alt={eventDetails.title || "Event"}
                                                    className="w-full h-48 object-cover rounded-lg"
                                                />
                                            </div>
                                        )}

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-medium text-lg mb-3 text-gray-800 border-b pb-2">
                                                Event Information
                                            </h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-gray-500">Title</p>
                                                    <p className="font-medium">{eventDetails.title || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Date</p>
                                                    <p className="font-medium">{formatDate(eventDetails.date)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Time</p>
                                                    <p className="font-medium">{formatTime(eventDetails.time)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Location</p>
                                                    <p className="font-medium flex items-center gap-1">
                                                        <FaMapMarkerAlt className="text-red-500" />
                                                        {eventDetails.location || "N/A"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Status</p>
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEventStatus(eventDetails) === "upcoming" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                                        {getEventStatus(eventDetails) === "upcoming" ? "Upcoming" : "Past"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>




                                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                            <h4 className="font-medium text-lg mb-3 text-gray-800 border-b pb-2">
                                                Description
                                            </h4>
                                            <p className="text-gray-700 whitespace-pre-line">
                                                {eventDetails.description || "No description available"}
                                            </p>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {showDeleteModal && selectedEvent && (
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
                                        <h3 className="text-lg font-bold mb-4 text-gray-800">Delete Event</h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Are you sure you want to delete the event: <strong>{selectedEvent.title || "N/A"}</strong>?
                                        </p>
                                        <p className="text-sm text-red-600 mb-4">
                                            This action cannot be undone.
                                        </p>
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => {
                                                    setShowDeleteModal(false);
                                                    setSelectedEvent(null);
                                                }}
                                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDeleteEvent}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                            >
                                                Confirm Delete
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {showEditModal && selectedEvent && (
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
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-lg font-bold text-gray-800">Edit Event</h3>
                                            <button
                                                onClick={() => {
                                                    setShowEditModal(false);
                                                    setSelectedEvent(null);
                                                }}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>

                                        <form className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Title
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    value={editForm.title}
                                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Description
                                                </label>
                                                <textarea
                                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    rows="3"
                                                    value={editForm.description}
                                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        value={editForm.date}
                                                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Time
                                                    </label>
                                                    <input
                                                        type="time"
                                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        value={editForm.time}
                                                        onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Location
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    value={editForm.location}
                                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Event Image
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="w-full p-2 border rounded-lg"
                                                    onChange={(e) => handleImageChange(e, 'edit')}
                                                />
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Max size: 2MB. Leave empty to keep current image.
                                                </p>
                                            </div>

                                            <div className="flex justify-end gap-3 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowEditModal(false);
                                                        setSelectedEvent(null);
                                                    }}
                                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleUpdateEvent}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    Update Event
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {showCreateModal && (
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
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-lg font-bold text-gray-800">Create Event</h3>
                                            <button
                                                onClick={() => {
                                                    setShowCreateModal(false);
                                                    setCreateForm({
                                                        title: "",
                                                        description: "",
                                                        date: "",
                                                        time: "",
                                                        location: "",
                                                        image: null
                                                    });
                                                }}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>

                                        <form className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Title
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    value={createForm.title}
                                                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Description
                                                </label>
                                                <textarea
                                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    rows="3"
                                                    value={createForm.description}
                                                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        value={createForm.date}
                                                        onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Time
                                                    </label>
                                                    <input
                                                        type="time"
                                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        value={createForm.time}
                                                        onChange={(e) => setCreateForm({ ...createForm, time: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Location
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    value={createForm.location}
                                                    onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Event Image
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="w-full p-2 border rounded-lg"
                                                    onChange={(e) => handleImageChange(e, 'create')}
                                                />
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Max size: 2MB. Optional.
                                                </p>
                                            </div>

                                            <div className="flex justify-end gap-3 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowCreateModal(false);
                                                        setCreateForm({
                                                            title: "",
                                                            description: "",
                                                            date: "",
                                                            time: "",
                                                            location: "",
                                                            image: null
                                                        });
                                                    }}
                                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                                >
                                                    Cancel
                                                </button>
                                                <button type="button" onClick={handleCreateEvent} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600" >
                                                    Create Event
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="flex items-center justify-between mt-6">
                            <div className="text-sm text-gray-700">
                                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                                <span className="font-medium">
                                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                                </span>{" "}
                                of <span className="font-medium">{pagination.total}</span> results
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className={`px-3 py-1 rounded-md ${pagination.page === 1 ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                                >
                                    Previous
                                </button>
                                {[...Array(pagination.pages).keys()].map((num) => (
                                    <button
                                        key={num + 1}
                                        onClick={() => handlePageChange(num + 1)}
                                        className={`px-3 py-1 rounded-md ${pagination.page === num + 1 ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
                                    >
                                        {num + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.pages || pagination.pages === 0}
                                    className={`px-3 py-1 rounded-md ${pagination.page === pagination.pages || pagination.pages === 0 ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
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

export default EventsManagement;