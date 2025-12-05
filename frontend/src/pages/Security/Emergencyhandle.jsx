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
  PlayCircle,
  X,
  Loader2
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
  const [updating, setUpdating] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [actionError, setActionError] = useState('');
  const navigate = useNavigate();
  const { API } = useAuth();

  // Get authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No authentication token found. Please log in.', {
        position: 'top-right',
        autoClose: 5000,
      });
      window.location.href = '/login';
      return {};
    }
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  // Fetch all alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/emergency/all-emergency-alerts`, getAuthHeaders());
      
      if (response.data?.success) {
        setAlerts(response.data.data || []);
      } else {
        throw new Error(response.data?.message || 'Failed to load alerts');
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error(error.response?.data?.message || 'Failed to load alerts', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Validate action taken input
  const validateAction = () => {
    if (!actionTaken.trim()) {
      setActionError('Please describe the action taken');
      return false;
    }
    if (actionTaken.trim().length < 5) {
      setActionError('Action description must be at least 5 characters');
      return false;
    }
    setActionError('');
    return true;
  };

  // Handle status update
  const handleStatusUpdate = async (alertId, newStatus) => {
    if (newStatus === 'Resolved' && !validateAction()) {
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API}/emergency/${alertId}/status`,
        { 
          status: newStatus, 
          actionTaken: actionTaken.trim() || `Marked as ${newStatus} by security` 
        },
        getAuthHeaders()
      );

      if (response.data?.success) {
        toast.success(`Alert marked as ${newStatus}`, {
          position: 'top-right',
          autoClose: 3000,
        });
        
        // Update the alert in local state
        setAlerts(prevAlerts => prevAlerts.map(alert => {
          if (alert._id === alertId) {
            return {
              ...alert,
              status: newStatus,
              actionTaken: actionTaken.trim() || `Marked as ${newStatus} by security`,
              verifiedAt: newStatus === 'Resolved' ? new Date().toISOString() : alert.verifiedAt
            };
          }
          return alert;
        }));
        
        setShowDetailsModal(false);
        setActionTaken('');
        setActionError('');
      } else {
        throw new Error(response.data?.message || 'Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Update failed', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setUpdating(false);
    }
  };

  // Quick status update without modal
  const quickStatusUpdate = async (alertId, currentStatus) => {
    const nextStatus = currentStatus === 'Pending' ? 'Processing' : 'Resolved';
    const actionText = nextStatus === 'Processing' 
      ? 'Started processing by security' 
      : 'Quickly resolved by security';

    try {
      setUpdating(true);
      const response = await axios.put(
        `${API}/emergency/${alertId}/status`,
        { 
          status: nextStatus, 
          actionTaken: actionText 
        },
        getAuthHeaders()
      );

      if (response.data?.success) {
        toast.success(`Alert marked as ${nextStatus}`, {
          position: 'top-right',
          autoClose: 3000,
        });
        
        // Update the alert in local state
        setAlerts(prevAlerts => prevAlerts.map(alert => {
          if (alert._id === alertId) {
            return {
              ...alert,
              status: nextStatus,
              actionTaken: actionText,
              verifiedAt: nextStatus === 'Resolved' ? new Date().toISOString() : alert.verifiedAt
            };
          }
          return alert;
        }));
      } else {
        throw new Error(response.data?.message || 'Update failed');
      }
    } catch (error) {
      console.error('Quick update error:', error);
      toast.error(error.response?.data?.message || 'Update failed', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setUpdating(false);
    }
  };

  // Report unauthorized entry
  const reportUnauthorizedEntry = async () => {
    try {
      setReporting(true);
      const response = await axios.post(
        `${API}/emergency/unauthorized-entry`,
        { 
          location: 'Main Gate', 
          description: 'Unauthorized person attempting entry. Immediate attention required.' 
        },
        getAuthHeaders()
      );

      if (response.data?.success) {
        toast.success('Unauthorized entry reported successfully', {
          position: 'top-right',
          autoClose: 3000,
        });
        fetchAlerts();
      } else {
        throw new Error(response.data?.message || 'Report failed');
      }
    } catch (error) {
      console.error('Report error:', error);
      toast.error(error.response?.data?.message || 'Report failed', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setReporting(false);
    }
  };

  // Filter alerts based on status, type, and search term
  const filteredAlerts = alerts.filter(alert => {
    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter !== alert.status?.toLowerCase()) return false;
    }
    
    // Filter by type
    if (typeFilter !== 'all') {
      if (typeFilter !== alert.type?.toLowerCase()) return false;
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const typeMatch = alert.type?.toLowerCase().includes(searchLower);
      const locationMatch = alert.location?.toLowerCase().includes(searchLower);
      const nameMatch = alert.residentId?.name?.toLowerCase().includes(searchLower);
      const descriptionMatch = alert.description?.toLowerCase().includes(searchLower);
      const customTitleMatch = alert.customTitle?.toLowerCase().includes(searchLower);
      
      return typeMatch || locationMatch || nameMatch || descriptionMatch || customTitleMatch;
    }
    
    return true;
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
          color: 'text-secondary',
          bgColor: 'bg-secondary/10',
          borderColor: 'border-secondary/20'
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
    switch (type?.toLowerCase()) {
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateString;
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
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-secondary mx-auto" />
          <p className="mt-4 text-gray-600">Loading security alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-10xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary bg-opacity-10">
              <Shield className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">Security Alerts Dashboard</h1>
              <p className="text-gray-600 text-sm md:text-base mt-1">Monitor and manage emergency alerts and security incidents</p>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header with Actions */}
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Search Input */}
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="text-gray-400 h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search alerts by type, location, or reporter..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* Filter Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                    >
                      <Filter size={16} />
                      Filters
                      <ChevronDown className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} size={14} />
                    </button>
                  </div>
                </div>

                {/* Filter Options */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors text-sm"
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
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors text-sm"
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
                  </div>
                )}
              </div>

              {/* Report Button */}
              <button
                onClick={reportUnauthorizedEntry}
                disabled={reporting}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
              >
                {reporting ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Report Incident</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Alerts */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-100">
                    <Bell className="text-gray-600" size={20} />
                  </div>
                </div>
              </div>
              
              {/* Pending */}
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600">Pending</p>
                    <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Clock className="text-amber-600" size={20} />
                  </div>
                </div>
              </div>
              
              {/* Processing */}
              <div className="bg-secondary/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary">Processing</p>
                    <p className="text-2xl font-bold text-secondary-dark">{stats.processing}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary/20">
                    <Activity className="text-secondary" size={20} />
                  </div>
                </div>
              </div>
              
              {/* Resolved */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Resolved</p>
                    <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-100">
                    <CheckCircle className="text-green-600" size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts List */}
          <div className="p-4 md:p-6">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-500">No alerts found</h3>
                <p className="text-gray-400 text-sm mt-1">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'No alerts have been reported yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => {
                  const statusConfig = getStatusConfig(alert.status);
                  return (
                    <div key={alert._id} className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="p-4 md:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Alert Information */}
                          <div className="flex items-start gap-4 flex-1">
                            <div className="text-2xl flex-shrink-0">
                              {getAlertTypeIcon(alert.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {alert.type === 'Other' ? alert.customTitle || 'Other Alert' : alert.type}
                                </h3>
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
                                  <span className={statusConfig.color}>{statusConfig.icon}</span>
                                  <span className={`text-xs font-medium ${statusConfig.color}`}>
                                    {alert.status}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Alert Details */}
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <MapPin size={14} />
                                  <span>{alert.location || 'Unknown location'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <User size={14} />
                                  <span>{alert.residentId?.name || 'Security'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  <span>{formatDate(alert.createdAt)}</span>
                                </div>
                              </div>
                              
                              {/* Description */}
                              {alert.description && (
                                <p className="text-gray-700 text-sm line-clamp-2">
                                  {alert.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                            <button
                              onClick={() => {
                                setSelectedAlert(alert);
                                setShowDetailsModal(true);
                              }}
                              className="px-3 py-1.5 text-secondary bg-secondary/10 hover:bg-secondary/20 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                            >
                              <Eye size={14} />
                              Details
                            </button>
                            
                            {alert.status !== 'Resolved' && (
                              <button
                                onClick={() => quickStatusUpdate(alert._id, alert.status)}
                                disabled={updating}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                                  alert.status === 'Pending' 
                                    ? 'text-secondary bg-secondary/10 hover:bg-secondary/20' 
                                    : 'text-green-600 bg-green-50 hover:bg-green-100'
                                } disabled:opacity-50`}
                              >
                                {updating ? (
                                  <Loader2 className="animate-spin h-3 w-3" />
                                ) : alert.status === 'Pending' ? (
                                  <>
                                    <PlayCircle size={14} />
                                    Start Processing
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 size={14} />
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
                })}
              </div>
            )}
          </div>
        </div>

        {/* Alert Details Modal */}
        {showDetailsModal && selectedAlert && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getAlertTypeIcon(selectedAlert.type)}</div>
                    <div>
                      <h2 className="text-xl font-bold text-primary">
                        {selectedAlert.type === 'Other' ? selectedAlert.customTitle || 'Other Alert' : selectedAlert.type}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusConfig(selectedAlert.status).icon}
                        <span className="text-sm font-medium text-gray-600">{selectedAlert.status}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setActionTaken('');
                      setActionError('');
                    }}
                    className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-grow">
                {/* Alert Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
                      <p className="text-gray-900 flex items-center gap-2">
                        <MapPin size={16} />
                        {selectedAlert.location || 'Unknown location'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Reported By</h3>
                      <p className="text-gray-900 flex items-center gap-2">
                        <User size={16} />
                        {selectedAlert.residentId?.name || 'Security'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Reported At</h3>
                      <p className="text-gray-900 flex items-center gap-2">
                        <Calendar size={16} />
                        {formatDate(selectedAlert.createdAt)}
                      </p>
                    </div>
                    {selectedAlert.verifiedAt && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Resolved At</h3>
                        <p className="text-gray-900 flex items-center gap-2">
                          <CheckCircle size={16} />
                          {formatDate(selectedAlert.verifiedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selectedAlert.description && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-line">{selectedAlert.description}</p>
                    </div>
                  </div>
                )}

                {/* Photo */}
                {selectedAlert.photo && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Attached Photo</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <img
                        src={selectedAlert.photo}
                        alt="Alert evidence"
                        className="max-w-full h-auto rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="16" text-anchor="middle" fill="%239ca3af"%3EImage not available%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Previous Action Taken */}
                {selectedAlert.actionTaken && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Previous Action Taken</h3>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-gray-900 whitespace-pre-line">{selectedAlert.actionTaken}</p>
                    </div>
                  </div>
                )}

                {/* Update Form - Only show if not resolved */}
                {selectedAlert.status !== 'Resolved' && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Alert Status</h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Action Taken / Resolution Notes <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={actionTaken}
                        onChange={(e) => {
                          setActionTaken(e.target.value);
                          if (actionError) setActionError('');
                        }}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-colors text-sm resize-none ${
                          actionError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-transparent'
                        }`}
                        rows={4}
                        placeholder="Describe the action taken, investigation findings, or resolution..."
                      />
                      {actionError && (
                        <p className="mt-2 text-xs text-red-600">{actionError}</p>
                      )}
                    </div>

                    <div className="flex justify-end gap-3">
                      {selectedAlert.status !== 'Processing' && (
                        <button
                          onClick={() => handleStatusUpdate(selectedAlert._id, 'Processing')}
                          disabled={updating}
                          className="px-4 py-2.5 bg-secondary hover:bg-secondary-dark text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
                        >
                          {updating ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                          ) : (
                            <>
                              <PlayCircle size={16} />
                              <span>Mark as Processing</span>
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusUpdate(selectedAlert._id, 'Resolved')}
                        disabled={updating}
                        className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
                      >
                        {updating ? (
                          <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                          <>
                            <CheckCircle2 size={16} />
                            <span>Mark as Resolved</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setActionTaken('');
                      setActionError('');
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityAlertsDashboard;