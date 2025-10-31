import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Calendar,
  Bell,
  AlertTriangle,
  Shield,
  User,
  Package,
  Clock,
  ArrowUpRight,
  Home,
  PhoneCall,
  MessageCircle,
  Users,
  Car
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../Context/AuthContext";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const ResidentDashboard = () => {
  const [residentData, setResidentData] = useState(null);
  const [stats, setStats] = useState([
    { title: 'Upcoming Events', value: '0', icon: <Calendar className="text-indigo-600" />, change: 'None scheduled' },
    { title: 'Pending Approvals', value: '0', icon: <Users className="text-amber-600" />, change: 'No pending visitors' },
    { title: 'Pending Deliveries', value: '0', icon: <Package className="text-blue-600" />, change: 'None pending' },
    { title: 'Active Staff', value: '0', icon: <User className="text-green-600" />, change: 'No active staff' }
  ]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [participationData, setParticipationData] = useState({
    labels: ['Attended', 'Not Attended', 'Pending'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#3498DB', '#e74c3c', '#f39c12'],
      borderWidth: 0,
      hoverOffset: 20
    }]
  });
  const [logData, setLogData] = useState({
    labels: ['Resident', 'Staff', 'Visitor'],
    datasets: [{
      label: 'Entries (This Week)',
      data: [0, 0, 0],
      backgroundColor: '#3498DB',
      borderRadius: 6,
      barThickness: 30
    }]
  });
  const [contacts, setContacts] = useState([
    { name: 'Security Emergency', number: '+91 98765 43210' },
    { name: 'Management Office', number: '+91 98765 43211' }
  ]);
  const [error, setError] = useState(null);
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
        'Content-Type': 'application/json',
      },
    };
  };

  // Fetch resident profile
  const fetchResidentData = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API}/profile/get-profile`, getAuthHeaders());
      const resident = response.data.user || response.data.data || response.data;
      setResidentData(resident);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error.response?.data?.message || 'Failed to load profile');
      toast.error('Failed to load profile', { toastId: 'profile-error' });
    }
  };

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      setError(null);
      const [eventsRes, visitorsRes, deliveriesRes, staffRes] = await Promise.all([
        axios.get(`${API}/event/view-event?past=false`, getAuthHeaders()),
        axios.get(`${API}/visitor/pending-approvals`, getAuthHeaders()),
        axios.get(`${API}/delivery/all`, getAuthHeaders()),
        axios.get(`${API}/staff/resident/${residentData?._id || 'temp'}`, getAuthHeaders())
      ]);

      const events = eventsRes.data.data?.events || [];
      const pendingVisitors = visitorsRes.data.data || [];
      const deliveries = (deliveriesRes.data.data || []).filter(d => d.residentId === residentData?._id && d.status === 'Pending');
      const staff = staffRes.data.data || [];

      setStats([
        {
          title: 'Upcoming Events',
          value: events.length.toString(),
          icon: <Calendar className="text-indigo-600" />,
          change: events.length > 0 ? `${events[0].title} soon` : 'None scheduled'
        },
        {
          title: 'Pending Approvals',
          value: pendingVisitors.length.toString(),
          icon: <Users className="text-amber-600" />,
          change: pendingVisitors.length > 0 ? `${pendingVisitors.length} visitor(s)` : 'No pending visitors'
        },
        {
          title: 'Pending Deliveries',
          value: deliveries.length.toString(),
          icon: <Package className="text-blue-600" />,
          change: deliveries.length > 0 ? `${deliveries.length} pending` : 'None pending'
        },
        {
          title: 'Active Staff',
          value: staff.length.toString(),
          icon: <User className="text-green-600" />,
          change: staff.length > 0 ? `${staff.length} active` : 'No active staff'
        }
      ]);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard stats');
      toast.error('Failed to load dashboard stats', { toastId: 'stats-error' });
    }
  };

  // Fetch recent emergency alerts
  const fetchRecentAlerts = async () => {
    try {
      const promise = axios.get(`${API}/emergency/my-alerts`, getAuthHeaders());
      const response = await toast.promise(
        promise,
        {
          pending: 'Loading recent alerts...',
          success: 'Alerts loaded',
          error: 'Failed to load alerts'
        },
        { toastId: 'fetch-alerts' }
      );
      setRecentAlerts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError(error.response?.data?.message || 'Failed to load alerts');
    }
  };

  // Fetch upcoming events
  const fetchUpcomingEvents = async () => {
    try {
      const promise = axios.get(`${API}/event/view-event?past=false&limit=2`, getAuthHeaders());
      const response = await toast.promise(
        promise,
        {
          pending: 'Loading upcoming events...',
          success: 'Events loaded',
          error: 'Failed to load events'
        },
        { toastId: 'fetch-events' }
      );
      setUpcomingEvents(response.data.data?.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(error.response?.data?.message || 'Failed to load events');
    }
  };

  // Fetch community participation (placeholder)
  const fetchParticipationData = async () => {
    try {
      // Placeholder: Implement /api/event/participation in backend
      const response = { data: { data: { attended: 5, notAttended: 3, pending: 2 } } }; // Static fallback
      const { attended, notAttended, pending } = response.data.data;
      setParticipationData({
        labels: ['Attended', 'Not Attended', 'Pending'],
        datasets: [{
          data: [attended, notAttended, pending],
          backgroundColor: ['#3498DB', '#e74c3c', '#f39c12'],
          borderWidth: 0,
          hoverOffset: 20
        }]
      });
    } catch (error) {
      console.error('Error fetching participation data:', error);
      setError('Community participation data unavailable');
    }
  };

  // Fetch entry/exit logs
  const fetchLogData = async () => {
    try {
      const [residentLogsRes, staffLogsRes] = await Promise.all([
        axios.get(`${API}/profile/logs/${residentData?.permanentId || 'temp'}`, getAuthHeaders()),
        axios.get(`${API}/staff/history/${residentData?.permanentId || 'temp'}`, getAuthHeaders())
      ]);

      const residentLogs = residentLogsRes.data.data || [];
      const staffLogs = staffLogsRes.data.data || [];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      const residentEntries = residentLogs.filter(log => new Date(log.timestamp) >= weekStart).length;
      const staffEntries = staffLogs.filter(log => new Date(log.timestamp) >= weekStart).length;
      // Placeholder for visitor logs (no direct endpoint)
      const visitorEntries = 0;

      setLogData({
        labels: ['Resident', 'Staff', 'Visitor'],
        datasets: [{
          label: 'Entries (This Week)',
          data: [residentEntries, staffEntries, visitorEntries],
          backgroundColor: '#3498DB',
          borderRadius: 6,
          barThickness: 30
        }]
      });
    } catch (error) {
      console.error('Error fetching log data:', error);
      setError(error.response?.data?.message || 'Failed to load entry/exit logs');
    }
  };

  // Fetch emergency contacts (placeholder)
  const fetchEmergencyContacts = async () => {
    try {
      // Placeholder: Implement /api/contact/emergency
      setContacts(contacts); // Static fallback
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContacts(contacts);
    }
  };

  // Trigger emergency alert
  const triggerEmergency = async () => {
    try {
      const promise = axios.post(
        `${API}/emergency/create-emergency`,
        {
          type: 'Panic',
          location: residentData?.flat_no || 'Resident Dashboard',
          description: 'Emergency alert triggered via panic button'
        },
        getAuthHeaders()
      );
      await toast.promise(
        promise,
        {
          pending: 'Triggering emergency alert...',
          success: 'Emergency alert sent to security!',
          error: 'Failed to trigger emergency alert'
        },
        { toastId: 'emergency-trigger' }
      );
    } catch (error) {
      console.error('Error triggering emergency:', error);
      toast.error('Failed to trigger emergency alert', { toastId: 'emergency-error' });
    }
  };

  // Fetch all data on mount
  useEffect(() => {
    fetchResidentData();
  }, []);

  useEffect(() => {
    if (residentData) {
      fetchStats();
      fetchRecentAlerts();
      fetchUpcomingEvents();
      fetchParticipationData();
      fetchLogData();
      fetchEmergencyContacts();
      const interval = setInterval(() => {
        fetchStats();
        fetchRecentAlerts();
        fetchUpcomingEvents();
      }, 60000); // Poll every 60 seconds
      return () => clearInterval(interval);
    }
  }, [residentData]);

  // Quick Actions
  const quickLinks = [
    { title: 'Invite Visitor', icon: <Users size={24} />, link: '/visitor/invite', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { title: 'Register Vehicle', icon: <Car size={24} />, link: '/vehicle/register', color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
    { title: 'Add Staff', icon: <User size={24} />, link: '/staff/add', color: 'bg-green-600 hover:bg-green-700 text-white' },
    { title: 'Create Delivery', icon: <Package size={24} />, link: '/delivery/create', color: 'bg-amber-600 hover:bg-amber-700 text-white' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="light" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
              {residentData?.name?.[0] || 'R'}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Welcome, {residentData?.name || 'Resident'}</h1>
              <p className="text-sm text-gray-500">Flat {residentData?.flat_no || 'N/A'} • Community Portal</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 text-sm text-gray-500 flex items-center">
            <Clock className="mr-2" size={18} />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 shadow-md flex items-center">
            <AlertTriangle size={20} className="mr-3" />
            {error}
          </div>
        )}

        {/* Panic Button */}
        <div className="mb-10">
          <button
            onClick={triggerEmergency}
            className="w-full py-5 bg-gradient-to-r from-red-600 to-red-700 text-white font-extrabold rounded-3xl shadow-xl flex items-center justify-center space-x-4 transition-all hover:-translate-y-1 hover:shadow-2xl"
            aria-label="Trigger emergency alert"
          >
            <Shield size={28} />
            <span className="text-2xl">EMERGENCY PANIC BUTTON</span>
            <PhoneCall size={28} />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl shadow-xl p-6 transform transition-all hover:-translate-y-1 hover:shadow-2xl border-l-4 border-blue-600"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Alerts */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900">Recent Alerts</h2>
                <button
                  className="text-sm text-blue-600 font-semibold flex items-center hover:text-blue-700 transition"
                  onClick={() => navigate('/emergency')}
                  aria-label="View all alerts"
                >
                  View all <ArrowUpRight size={16} className="ml-1" />
                </button>
              </div>
              <div className="space-y-4">
                {recentAlerts.length > 0 ? (
                  recentAlerts.map(alert => (
                    <div
                      key={alert._id}
                      className="p-5 bg-red-50 rounded-2xl border-l-4 border-red-600 hover:bg-red-100 transition-all shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-900">{alert.type}</h3>
                        <span className="text-xs text-gray-500">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">{alert.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Status: {alert.status}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">No recent alerts.</p>
                )}
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Event Participation</h2>
                <div className="h-72">
                  <Pie
                    data={participationData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'bottom', labels: { font: { size: 14 } } },
                        tooltip: { backgroundColor: '#1F2937', bodyFont: { size: 14 } }
                      }
                    }}
                  />
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Entry/Exit Logs</h2>
                <div className="h-72">
                  <Bar
                    data={logData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: 'bottom', labels: { font: { size: 14 } } },
                        tooltip: { backgroundColor: '#1F2937', bodyFont: { size: 14 } }
                      },
                      scales: {
                        y: { beginAtZero: true, grid: { display: false } },
                        x: { grid: { display: false } }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                {quickLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.link}
                    className={`p-5 rounded-2xl flex flex-col items-center text-center ${link.color} transition-all hover:-translate-y-1 shadow-md hover:shadow-lg`}
                    aria-label={link.title}
                  >
                    <div className="p-3 bg-white/20 rounded-full mb-3">{link.icon}</div>
                    <span className="text-sm font-semibold">{link.title}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Upcoming Events</h2>
              <div className="space-y-4">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map(event => (
                    <div
                      key={event._id}
                      className="flex items-start pb-4 border-b border-gray-100 last:border-0"
                    >
                      <div className="p-2 bg-indigo-100 rounded-full mr-3">
                        <Calendar size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleDateString()} • {event.time || 'TBD'}
                        </p>
                        <p className="text-xs text-gray-500">{event.location}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-6">No upcoming events.</p>
                )}
              </div>
            </div>

            {/* Important Contacts */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Important Contacts</h2>
              <div className="space-y-4">
                {contacts.map((contact, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{contact.name}</span>
                    <a
                      href={`tel:${contact.number}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                      aria-label={`Call ${contact.name}`}
                    >
                      {contact.number}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
