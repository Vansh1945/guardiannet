import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  User,
  CheckCircle,
  XCircle,
  Search,
  ArrowRightCircle,
  ArrowLeftCircle,
  AlertCircle,
  Loader2,
  Shield,
  History,
  UserCheck,
  UserX,
  PlusCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useAuth } from "../../Context/AuthContext";

const SecurityStaffManagement = () => {
  // State declarations
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [actionType, setActionType] = useState('entry');
  const [notes, setNotes] = useState('');
  const [staffHistory, setStaffHistory] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [staffForm, setStaffForm] = useState({
    name: '',
    permanentId: '',
    role: 'staff',
    other_role: '',
    residentId: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const { API } = useAuth();

  // Enhanced auth headers with error handling
  const getAuthHeaders = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      return {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Please login to continue', { position: 'top-right', autoClose: 3000 });
      window.location.href = '/login';
      return {};
    }
  };

  // Validate staff form
  const validateForm = () => {
    const errors = {};
    const { name, permanentId } = staffForm;

    if (!name.trim()) {
      errors.name = 'Name is required';
    }

    if (!permanentId.trim()) {
      errors.permanentId = 'Permanent ID is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch all staff with enhanced error handling
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/staff/admin/stats`,
        getAuthHeaders()
      );
      
      if (response.data?.success) {
        setStaff(response.data.data || []);
      } else {
        throw new Error(response.data?.message || 'Invalid response format');
      }
    } catch (error) {
      console.error('Staff fetch error:', error);
      
      let errorMessage = 'Failed to load staff';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      toast.error(errorMessage, { position: 'top-right', autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  // Handle staff entry/exit with validation
  const handleStaffAction = async () => {
    if (!selectedStaff) {
      toast.error('No staff member selected', { position: 'top-right', autoClose: 3000 });
      return;
    }
    
    try {
      setActionLoading(true);
      
      const endpoint = actionType === 'entry' ? 'entry' : 'exit';
      const response = await axios.post(
        `${API}/staff/${endpoint}`,
        { 
          permanentId: selectedStaff.permanentId, 
          notes: notes.trim() || undefined 
        },
        getAuthHeaders()
      );
      
      if (response.status >= 200 && response.status < 300) {
        const successMessage = response.data?.message || `Staff ${actionType} recorded successfully`;
        toast.success(successMessage, { position: 'top-right', autoClose: 3000 });
        
        // Update the staff member's status in the local state
        setStaff(prevStaff => prevStaff.map(member => {
          if (member._id === selectedStaff._id) {
            return {
              ...member,
              isInside: actionType === 'entry',
              lastEntryTime: actionType === 'entry' ? new Date().toISOString() : member.lastEntryTime,
              lastExitTime: actionType === 'exit' ? new Date().toISOString() : member.lastExitTime
            };
          }
          return member;
        }));
        
        // Reset modal state
        setShowActionModal(false);
        setNotes('');
        setSelectedStaff(null);
        
        // If history modal is open, update the history as well
        if (showHistoryModal) {
          const newLog = {
            staffId: selectedStaff.permanentId,
            action: actionType,
            timestamp: new Date().toISOString(),
            notes: notes.trim() || '',
            entryTime: actionType === 'entry' ? new Date().toISOString() : null,
            exitTime: actionType === 'exit' ? new Date().toISOString() : null
          };
          setStaffHistory(prev => [...prev, newLog]);
        }
      } else {
        throw new Error(response.data?.message || `Action ${actionType} failed`);
      }
    } catch (error) {
      console.error('Action error:', error);
      
      let errorMessage = `Failed to record ${actionType}`;
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid request. Please check the staff status.';
        } else if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.request) {
        errorMessage = 'No response received from server';
      }
      
      toast.error(errorMessage, { position: 'top-right', autoClose: 5000 });
    } finally {
      setActionLoading(false);
    }
  };

  // Register new staff
  const registerStaff = async () => {
    if (!validateForm()) return;

    try {
      setRegisterLoading(true);
      
      const response = await axios.post(
        `${API}/staff/register`,
        {
          name: staffForm.name.trim(),
          permanentId: staffForm.permanentId.trim(),
          role: staffForm.role,
          other_role: staffForm.role === 'other' ? staffForm.other_role.trim() : undefined,
          residentId: staffForm.residentId?.trim() || undefined
        },
        getAuthHeaders()
      );

      toast.success('Staff registered successfully', {
        position: 'top-right',
        autoClose: 3000,
      });

      // Reset form and modal state
      setShowRegisterModal(false);
      setStaffForm({
        name: '',
        permanentId: '',
        role: 'staff',
        other_role: '',
        residentId: ''
      });
      setFormErrors({});
      
      // Refresh staff list
      fetchStaff();
    } catch (error) {
      console.error('Error registering staff:', error);
      
      // Handle backend validation errors
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.path] = err.msg;
        });
        setFormErrors(backendErrors);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message, { position: 'top-right', autoClose: 5000 });
      } else {
        toast.error('Failed to register staff', { position: 'top-right', autoClose: 5000 });
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  // Get staff logs in chronological order
  const fetchStaffHistory = async (permanentId) => {
    if (!permanentId) {
      toast.error('No staff ID provided', { position: 'top-right', autoClose: 3000 });
      return;
    }
    
    try {
      setHistoryLoading(true);
      const response = await axios.get(
        `${API}/staff/history/${permanentId}`,
        getAuthHeaders()
      );
      
      if (response.data) {
        const sortedHistory = (response.data.history || []).sort((a, b) => {
          const dateA = a.entryTime || a.exitTime || 0;
          const dateB = b.entryTime || b.exitTime || 0;
          return new Date(dateA) - new Date(dateB);
        });
        setStaffHistory(sortedHistory);
        setShowHistoryModal(true);
      } else {
        throw new Error('Invalid history data format');
      }
    } catch (error) {
      console.error('History fetch error:', error);
      
      let errorMessage = 'Failed to load history';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      toast.error(errorMessage, { position: 'top-right', autoClose: 5000 });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Format date with timezone consideration
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
      console.error('Date formatting error:', e);
      return dateString;
    }
  };

  // Status icon component
  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'inside':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'outside':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'blocked':
        return <UserX className="w-5 h-5 text-red-700" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  // Filter staff
  const filteredStaff = staff.filter(member => {
    // Filter by status
    if (filterStatus !== 'all') {
      if (filterStatus === 'inside' && !member.isInside) return false;
      if (filterStatus === 'outside' && member.isInside) return false;
      if (filterStatus === 'blocked' && member.status !== 'blocked') return false;
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      return (
        (member.permanentId?.toLowerCase().includes(searchLower)) ||
        (member.name?.toLowerCase().includes(searchLower)) ||
        (member.role && member.role.toLowerCase().includes(searchLower)) ||
        (member.residentId?.name && member.residentId.name.toLowerCase().includes(searchLower)) ||
        (member.other_role && member.other_role.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  // Initial data fetch
  useEffect(() => {
    fetchStaff();
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-10xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary bg-opacity-10">
              <Shield className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">Security Staff Management</h1>
              <p className="text-gray-600 text-sm md:text-base mt-1">Track and manage staff entries, exits, and registrations</p>
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
                        placeholder="Search staff by name, ID, role, or resident..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="text-gray-500" size={18} />
                    <div className="flex flex-wrap gap-1">
                      {['all', 'inside', 'outside', 'blocked'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            filterStatus === status
                              ? status === 'all'
                                ? 'bg-secondary text-white'
                                : status === 'inside'
                                  ? 'bg-green-600 text-white'
                                  : status === 'outside'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {status === 'all' ? 'All Staff' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={fetchStaff}
                  disabled={loading}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      <span>Refresh</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="px-4 py-2.5 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors flex items-center gap-2 text-sm"
                >
                  <PlusCircle size={16} />
                  <span>Register Staff</span>
                </button>
              </div>
            </div>
          </div>

          {/* Staff Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Details
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role Information
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Action
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && staff.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 md:px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="animate-spin h-10 w-10 text-secondary mb-3" />
                        <p className="text-gray-500">Loading staff members...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredStaff.length ? (
                  filteredStaff.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-secondary/10 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <div className="ml-3 md:ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            <div className="text-xs text-gray-500">ID: {member.permanentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium capitalize">
                            {member.role === 'other' ? member.other_role || 'Other' : member.role}
                          </div>
                          {member.residentId?.name && (
                            <div className="text-gray-500 text-xs mt-1">
                              Resident: {member.residentId.name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                              member.status === 'blocked'
                                ? 'bg-purple-100 text-purple-800'
                                : member.isInside
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {member.status === 'blocked' ? 'BLOCKED' : member.isInside ? 'INSIDE' : 'OUTSIDE'}
                          </span>
                          {getStatusIcon(member.status === 'blocked' ? 'blocked' : member.isInside ? 'inside' : 'outside')}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {member.lastEntryTime ? (
                            <>
                              <div className="capitalize font-medium">
                                {member.isInside ? 'Entered' : 'Exited'}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                {formatDate(member.isInside ? member.lastEntryTime : member.lastExitTime)}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">No recent activity</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                          {member.status !== 'blocked' && (
                            <button
                              onClick={() => {
                                setSelectedStaff(member);
                                setActionType(member.isInside ? 'exit' : 'entry');
                                setShowActionModal(true);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                                member.isInside
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                  : 'bg-green-50 text-green-700 hover:bg-green-100'
                              } transition-colors`}
                              disabled={actionLoading}
                            >
                              {member.isInside ? (
                                <>
                                  <ArrowLeftCircle size={14} />
                                  Mark Exit
                                </>
                              ) : (
                                <>
                                  <ArrowRightCircle size={14} />
                                  Mark Entry
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedStaff(member);
                              fetchStaffHistory(member.permanentId);
                            }}
                            className="px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                            disabled={historyLoading}
                          >
                            <History size={14} />
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 md:px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center py-8">
                        <User className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No staff members found</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {searchTerm.trim() || filterStatus !== 'all' 
                            ? 'Try adjusting your search or filter criteria' 
                            : 'No staff members are currently registered'}
                        </p>
                        {!searchTerm.trim() && filterStatus === 'all' && (
                          <button
                            onClick={() => setShowRegisterModal(true)}
                            className="mt-3 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors flex items-center gap-2 text-sm"
                          >
                            <PlusCircle size={14} />
                            Register First Staff
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          {filteredStaff.length > 0 && (
            <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
                <div>
                  Showing <span className="font-medium">{filteredStaff.length}</span> of{' '}
                  <span className="font-medium">{staff.length}</span> staff members
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Inside: {staff.filter(s => s.isInside).length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Outside: {staff.filter(s => !s.isInside && s.status !== 'blocked').length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Blocked: {staff.filter(s => s.status === 'blocked').length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Modal (Entry/Exit) */}
        {showActionModal && selectedStaff && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-primary">
                    {actionType === 'entry' ? 'Record Staff Entry' : 'Record Staff Exit'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowActionModal(false);
                      setNotes('');
                      setSelectedStaff(null);
                    }}
                    disabled={actionLoading}
                    className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{selectedStaff.name}</h3>
                      <p className="text-sm text-gray-600">
                        ID: {selectedStaff.permanentId} •{' '}
                        {selectedStaff.role === 'other' 
                          ? selectedStaff.other_role || 'Other' 
                          : selectedStaff.role}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Resident</p>
                      <p className="font-medium text-sm">
                        {selectedStaff.residentId?.name || 'Not assigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Current Status</p>
                      <p className="font-medium text-sm capitalize">
                        {selectedStaff.status === 'blocked' ? 'Blocked' : selectedStaff.isInside ? 'Inside' : 'Outside'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any additional notes for this action..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors text-sm resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowActionModal(false);
                      setNotes('');
                      setSelectedStaff(null);
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStaffAction}
                    disabled={actionLoading}
                    className={`px-4 py-2.5 rounded-lg text-white transition-colors flex items-center gap-2 text-sm ${
                      actionType === 'entry'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } disabled:opacity-50`}
                  >
                    {actionLoading ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <>
                        {actionType === 'entry' ? (
                          <ArrowRightCircle size={16} />
                        ) : (
                          <ArrowLeftCircle size={16} />
                        )}
                        <span>{actionType === 'entry' ? 'Confirm Entry' : 'Confirm Exit'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Register Staff Modal */}
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
              <div className="p-6 flex-grow overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-primary">Register New Staff</h2>
                  <button
                    onClick={() => {
                      setShowRegisterModal(false);
                      setStaffForm({
                        name: '',
                        permanentId: '',
                        role: 'staff',
                        other_role: '',
                        residentId: ''
                      });
                      setFormErrors({});
                    }}
                    disabled={registerLoading}
                    className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={staffForm.name}
                      onChange={(e) => {
                        setStaffForm(prev => ({
                          ...prev,
                          name: e.target.value
                        }));
                        if (formErrors.name) {
                          setFormErrors(prev => ({ ...prev, name: '' }));
                        }
                      }}
                      placeholder="Enter staff member's full name"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-colors text-sm ${
                        formErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-transparent'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="mt-2 text-xs text-red-600">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permanent ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={staffForm.permanentId}
                      onChange={(e) => {
                        setStaffForm(prev => ({
                          ...prev,
                          permanentId: e.target.value
                        }));
                        if (formErrors.permanentId) {
                          setFormErrors(prev => ({ ...prev, permanentId: '' }));
                        }
                      }}
                      placeholder="Enter unique permanent ID"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition-colors text-sm ${
                        formErrors.permanentId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-transparent'
                      }`}
                    />
                    {formErrors.permanentId && (
                      <p className="mt-2 text-xs text-red-600">{formErrors.permanentId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={staffForm.role}
                      onChange={(e) => setStaffForm(prev => ({
                        ...prev,
                        role: e.target.value
                      }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors text-sm"
                    >
                      {['staff', 'guard', 'cleaner', 'maintenance', 'other'].map((role) => (
                        <option key={role} value={role} className="capitalize">
                          {role === 'other' ? 'Other' : role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {staffForm.role === 'other' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specify Role
                      </label>
                      <input
                        type="text"
                        value={staffForm.other_role}
                        onChange={(e) => setStaffForm(prev => ({
                          ...prev,
                          other_role: e.target.value
                        }))}
                        placeholder="Enter custom role"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors text-sm"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resident ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={staffForm.residentId}
                      onChange={(e) => setStaffForm(prev => ({
                        ...prev,
                        residentId: e.target.value
                      }))}
                      placeholder="Enter resident ID if applicable"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowRegisterModal(false);
                      setStaffForm({
                        name: '',
                        permanentId: '',
                        role: 'staff',
                        other_role: '',
                        residentId: ''
                      });
                      setFormErrors({});
                    }}
                    disabled={registerLoading}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={registerStaff}
                    disabled={registerLoading}
                    className="px-4 py-2.5 bg-secondary hover:bg-secondary-dark text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {registerLoading ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <>
                        <PlusCircle size={16} />
                        <span>Register Staff</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && selectedStaff && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-primary">Staff History</h2>
                      <p className="text-gray-600 text-sm">{selectedStaff.name} • ID: {selectedStaff.permanentId}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Current Status</p>
                    <p className="font-medium">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedStaff.status === 'blocked'
                          ? 'bg-purple-100 text-purple-800'
                          : selectedStaff.isInside
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedStaff.status === 'blocked' ? 'BLOCKED' : selectedStaff.isInside ? 'INSIDE' : 'OUTSIDE'}
                      </span>
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Role</p>
                    <p className="font-medium capitalize">
                      {selectedStaff.role === 'other' ? selectedStaff.other_role || 'Other' : selectedStaff.role}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Resident</p>
                    <p className="font-medium">
                      {selectedStaff.residentId?.name || 'Not assigned'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <History size={18} />
                    Movement History
                  </h3>
                  {historyLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin h-8 w-8 text-secondary" />
                    </div>
                  ) : staffHistory.length > 0 ? (
                    <div className="space-y-3">
                      {staffHistory.map((log, index) => (
                        <div key={index} className="border-l-2 border-secondary pl-4 py-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {log.entryTime && !log.exitTime ? (
                                <ArrowRightCircle className="text-green-500" size={16} />
                              ) : log.exitTime ? (
                                <ArrowLeftCircle className="text-red-500" size={16} />
                              ) : (
                                <AlertCircle className="text-yellow-500" size={16} />
                              )}
                              <span className="font-medium text-sm">
                                {log.entryTime && !log.exitTime ? 'Entered Premises' : 
                                 log.exitTime ? 'Exited Premises' : 
                                 log.action || 'Unknown Action'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(log.entryTime || log.exitTime || log.timestamp)}
                            </span>
                          </div>
                          {log.notes && (
                            <div className="mt-2 bg-gray-50 p-2 rounded text-xs">
                              <p className="text-gray-600">
                                <span className="font-medium">Notes:</span> {log.notes}
                              </p>
                            </div>
                          )}
                          {log.securityGuard && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                              <span>Verified by Security</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No movement history available</p>
                      <p className="text-gray-400 text-sm mt-1">
                        This staff member has no recorded entries or exits
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
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

export default SecurityStaffManagement;