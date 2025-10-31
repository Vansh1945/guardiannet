import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Calendar, MapPin, Clock, User, AlertCircle,
  ChevronLeft, ChevronRight, X, Search
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from "../../Context/AuthContext";

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState('upcoming');
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { API } = useAuth();


  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to continue', { toastId: 'auth-error' });
      navigate('/login');
      return {};
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

const fetchEvents = async () => {
  try {
    setIsLoading(true);
    setError(null);

    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    const params = {
      page: currentPage,
      limit: 6,
      search: searchTerm,
    };

    // Add date filter if specified
    if (filterDate) {
      params.date = filterDate.toISOString().split('T')[0];
    }

    // Add filter condition based on upcoming/past selection
    if (filter === 'upcoming') {
      params.startDate = today; // Events on or after today
    } else if (filter === 'past') {
      params.endDate = today; // Events before today
    }

    const response = await axios.get(
      `${API}/view-event`,
      {
        ...getAuthHeaders(),
        params
      }
    );

    const { events, pagination } = response.data.data;
    setEvents(events || []);
    setTotalPages(pagination?.pages || 1);
  } catch (error) {
    console.error('Error fetching events:', error);
    const message = error.response?.data?.message || 'Failed to load events';
    setError(message);
    toast.error(message);
  } finally {
    setIsLoading(false);
  }
};

  const fetchEventDetails = async (eventId) => {
    try {
      if (!/^[0-9a-fA-F]{24}$/.test(eventId)) {
        throw new Error('Invalid event ID');
      }
      const response = await axios.get(
        `${API}/view-event/${eventId}`,
        getAuthHeaders()
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching event details:', error);
      let message = error.response?.data?.message || 'Failed to load event details';
      if (error.message === 'Invalid event ID' || error.response?.status === 400) {
        message = 'Invalid event ID';
      } else if (error.response?.status === 404) {
        message = 'Event not found';
      }
      toast.error(message);
      return null;
    }
  };

  const handleViewDetails = async (event) => {
    const eventDetails = await fetchEventDetails(event._id);
    if (eventDetails) {
      setSelectedEvent(eventDetails);
    }
  };

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return 'Date not available';
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })} at ${timeString || 'Time TBD'}`;
  };

  // Filter events client-side if needed (or rely on server-side filtering)
const filteredEvents = events.filter(event => {
  const matchesSearch = !searchTerm ||
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesDate = !filterDate ||
    new Date(event.date).toDateString() === filterDate.toDateString();

  const eventDate = new Date(event.date).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  
  const matchesFilter = filter === 'upcoming' 
    ? eventDate >= today 
    : eventDate < today;

  return matchesSearch && matchesDate && matchesFilter;
});

  useEffect(() => {
    fetchEvents();
  }, [filter, currentPage, searchTerm, filterDate]);

  const EventCard = ({ event }) => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="h-48 relative">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white text-4xl font-bold">
            {event.title.charAt(0)}
          </div>
        )}
        {event.isCancelled && (
          <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Cancelled
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-3 line-clamp-2">{event.title}</h3>
        <div className="flex items-center text-gray-600 mb-2">
          <Calendar size={16} className="mr-2 text-blue-600" />
          <span className="text-sm">{new Date(event.date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center text-gray-600 mb-2">
          <Clock size={16} className="mr-2 text-blue-600" />
          <span className="text-sm">{event.time || 'TBD'}</span>
        </div>
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin size={16} className="mr-2 text-blue-600" />
          <span className="text-sm">{event.location}</span>
        </div>
        <button
          onClick={() => handleViewDetails(event)}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          aria-label={`View details for ${event.title}`}
        >
          View Details
        </button>
      </div>
    </div>
  );

  const EventDetailsModal = ({ event, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="h-56 relative">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover rounded-t-xl"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white text-5xl font-bold rounded-t-xl">
              {event.title.charAt(0)}
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
          {event.isCancelled && (
            <div className="absolute bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
              <AlertCircle size={16} />
              Event Cancelled
            </div>
          )}
        </div>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{event.title}</h2>
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-gray-700">
              <Calendar size={18} className="mr-3 text-blue-600" />
              <span>{formatDateTime(event.date, event.time)}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <MapPin size={18} className="mr-3 text-blue-600" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <User size={18} className="mr-3 text-blue-600" />
              <span>Organized by: {event.organizer?.name || 'Society Admin'}</span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              aria-label="Close event details"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Community Events</h1>
          <p className="text-gray-600 mt-2">Discover and explore upcoming and past events in your society</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setFilter('upcoming');
                setCurrentPage(1);
              }}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${filter === 'upcoming'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-blue-700'
                }`}
              aria-label="Show upcoming events"
            >
              Upcoming Events
            </button>
            <button
              onClick={() => {
                setFilter('past');
                setCurrentPage(1);
              }}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${filter === 'past'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-blue-700'
                }`}
              aria-label="Show past events"
            >
              Past Events
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search events by title, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                aria-label="Search events"
              />
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-3 border border-gray-300 rounded-lg">
              <Calendar size={18} className="text-gray-400" />
              <DatePicker
                selected={filterDate}
                onChange={(date) => setFilterDate(date)}
                placeholderText="Filter by date"
                className="w-36 focus:outline-none"
                dateFormat="MMMM d, yyyy"
                isClearable
                aria-label="Filter events by date"
              />
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchEvents}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                aria-label="Retry loading events"
              >
                Try Again
              </button>
            </div>
          ) : filteredEvents.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredEvents.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-3 rounded-full transition-colors ${currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:bg-blue-100'
                    }`}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={24} />
                </button>
                <span className="text-gray-700 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-3 rounded-full transition-colors ${currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:bg-blue-100'
                    }`}
                  aria-label="Next page"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Calendar size={40} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No {filter} events found.</p>
              {(searchTerm || filterDate) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterDate(null);
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                  aria-label="Clear search and date filters"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default EventsPage;