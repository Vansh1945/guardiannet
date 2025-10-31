import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  AlertTriangle, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Eye,
  Filter,
  Plus,
  Search,
  Bell,
  MapPin,
  Calendar,
  Activity,
  ChevronDown,
  CheckCircle2,
  PlayCircle
} from 'lucide-react';
import { useAuth } from "../../Context/AuthContext";

const SecurityAlertsDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionTaken, setActionTaken] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
    const { API } = useAuth();

  // Fetch all alerts
  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/emergency/all-emergency-alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(response.data.data);
    } catch (error) {
      toast.error('Failed to load alerts');
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Handle status update
  const handleStatusUpdate = async (alertId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/emergency/${alertId}/status`,
        { status: newStatus, actionTaken },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success(`Alert marked as ${newStatus}`);
      fetchAlerts();
      setShowDetailsModal(false);
      setActionTaken('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
      console.error('Update error:', error);
    }
  };

  // Quick status update without modal
  const quickStatusUpdate = async (alertId, currentStatus) => {
    const nextStatus = currentStatus === 'Pending' ? 'Processing' : 'Resolved';
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/emergency/${alertId}/status`,
        { status: nextStatus, actionTaken: `Quick ${nextStatus.toLowerCase()} by security` },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success(`Alert marked as ${nextStatus}`);
      fetchAlerts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  // Report unauthorized entry
  const reportUnauthorizedEntry = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/emergency/unauthorized-entry`,
        { location: 'Main Gate', description: 'Unauthorized person attempting entry' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Unauthorized entry reported');
      fetchAlerts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Report failed');
      console.error('Report error:', error);
    }
  };

  // Filter alerts based on status, type, and search term
  const filteredAlerts = alerts.filter(alert => {
    const statusMatch = statusFilter === 'all' || alert.status.toLowerCase() === statusFilter;
    const typeMatch = typeFilter === 'all' || alert.type.toLowerCase() === typeFilter;
    const searchMatch = searchTerm === '' || 
      alert.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.residentId?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && typeMatch && searchMatch;
  });

  // Get status configuration
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Pending':
        return {
          icon: <Clock size={18} />,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200'
        };
      case 'Processing':
        return {
          icon: <Activity size={18} />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'Resolved':
        return {
          icon: <CheckCircle size={18} />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      default:
        return {
          icon: <AlertTriangle size={18} />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  // Get alert type icon
  const getAlertTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'fire':
        return '🔥';
      case 'security threat':
        return '⚠️';
      case 'suspicious person':
        return '👤';
      case 'unauthorized entry':
        return '🚪';
      default:
        return '🚨';
    }
  };

  // Get stats
  const stats = {
    total: alerts.length,
    pending: alerts.filter(a => a.status === 'Pending').length,
    processing: alerts.filter(a => a.status === 'Processing').length,
    resolved: alerts.filter(a => a.status === 'Resolved').length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading security alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="flex items-center gap-3 mb-4 lg:mb-0">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <Shield className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Security Dashboard</h1>
              <p className="text-gray-600">Monitor and manage security alerts</p>
            </div>
          </div>
          <button
            onClick={reportUnauthorizedEntry}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Plus size={20} />
            Report Unauthorized Entry
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Bell className="text-gray-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Pending</p>
                <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="text-amber-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Processing</p>
                <p className="text-2xl font-bold text-blue-700">{stats.processing}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Resolved</p>
                <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search alerts by type, location, or reporter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            >
              <Filter size={20} />
              Filters
              <ChevronDown className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} size={16} />
            </button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type Filter</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="fire">Fire</option>
                  <option value="security threat">Security Threat</option>
                  <option value="suspicious person">Suspicious Person</option>
                  <option value="unauthorized entry">Unauthorized Entry</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Alerts Grid */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <AlertTriangle size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
              <p className="text-gray-600">No alerts match your current filters</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const statusConfig = getStatusConfig(alert.status);
              return (
                <div key={alert._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="text-2xl">{getAlertTypeIcon(alert.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {alert.type === 'Other' ? alert.customTitle : alert.type}
                            </h3>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
                              <span className={statusConfig.color}>{statusConfig.icon}</span>
                              <span className={`text-sm font-medium ${statusConfig.color}`}>{alert.status}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin size={16} />
                              {alert.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <User size={16} />
                              {alert.residentId?.name || 'Security'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar size={16} />
                              {new Date(alert.createdAt).toLocaleString()}
                            </div>
                          </div>
                          
                          {alert.description && (
                            <p className="text-gray-700 text-sm line-clamp-2">{alert.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                        <button
                          onClick={() => {
                            setSelectedAlert(alert);
                            setShowDetailsModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                        >
                          <Eye size={18} />
                          Details
                        </button>
                        
                        {alert.status !== 'Resolved' && (
                          <button
                            onClick={() => quickStatusUpdate(alert._id, alert.status)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                              alert.status === 'Pending' 
                                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                                : 'text-green-600 bg-green-50 hover:bg-green-100'
                            }`}
                          >
                            {alert.status === 'Pending' ? (
                              <>
                                <PlayCircle size={18} />
                                Start Processing
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={18} />
                                Mark Resolved
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Alert Details Modal */}
        {showDetailsModal && selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{getAlertTypeIcon(selectedAlert.type)}</div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {selectedAlert.type === 'Other' ? selectedAlert.customTitle : selectedAlert.type}
                      </h2>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusConfig(selectedAlert.status).icon}
                        <span className="text-lg font-medium">{selectedAlert.status}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Location</h3>
                      <p className="text-gray-900 flex items-center gap-2">
                        <MapPin size={18} />
                        {selectedAlert.location}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Reported By</h3>
                      <p className="text-gray-900 flex items-center gap-2">
                        <User size={18} />
                        {selectedAlert.residentId?.name || 'Security'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Reported At</h3>
                      <p className="text-gray-900 flex items-center gap-2">
                        <Calendar size={18} />
                        {new Date(selectedAlert.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {selectedAlert.verifiedAt && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Resolved At</h3>
                        <p className="text-gray-900 flex items-center gap-2">
                          <CheckCircle size={18} />
                          {new Date(selectedAlert.verifiedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedAlert.description && (
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Description</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-line">{selectedAlert.description}</p>
                    </div>
                  </div>
                )}

                {selectedAlert.photo && (
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Attached Photo</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <img
                        src={selectedAlert.photo}
                        alt="Alert evidence"
                        className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                    </div>
                  </div>
                )}

                {selectedAlert.actionTaken && (
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Action Taken</h3>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-gray-900 whitespace-pre-line">{selectedAlert.actionTaken}</p>
                    </div>
                  </div>
                )}

                {selectedAlert.status !== 'Resolved' && (
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Alert Status</h3>
                    <textarea
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      rows={4}
                      placeholder="Describe the action taken or plan..."
                    />

                    <div className="flex justify-end gap-3 mt-6">
                      {selectedAlert.status !== 'Processing' && (
                        <button
                          onClick={() => handleStatusUpdate(selectedAlert._id, 'Processing')}
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
                        >
                          <PlayCircle size={18} />
                          Mark as Processing
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusUpdate(selectedAlert._id, 'Resolved')}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 shadow-sm"
                      >
                        <CheckCircle2 size={18} />
                        Mark as Resolved
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityAlertsDashboard;