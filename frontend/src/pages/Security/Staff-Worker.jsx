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
  PlusCircle
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
      toast.error('Please login to continue');
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
      setLoading(true);
      
      const endpoint = actionType === 'entry' ? 'entry' : 'exit';
      const response = await axios.post(
        `${API}/staff/${endpoint}`,
        { permanentId: selectedStaff.permanentId, notes },
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
        
        // If history modal is open, update the history as well
        if (showHistoryModal) {
          const newLog = {
            staffId: selectedStaff.permanentId,
            action: actionType,
            timestamp: new Date().toISOString(),
            notes: notes || '',
            entryTime: actionType === 'entry' ? new Date().toISOString() : null,
            exitTime: actionType === 'exit' ? new Date().toISOString() : null
          };
          // Add new entry to the end of history (chronological order)
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
      setLoading(false);
    }
  };

  // Register new staff
  const registerStaff = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const response = await axios.post(
        `${API}/staff/register`,
        {
          name: staffForm.name,
          permanentId: staffForm.permanentId,
          role: staffForm.role,
          other_role: staffForm.role === 'other' ? staffForm.other_role : undefined,
          residentId: staffForm.residentId || null
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
      } else {
        toast.error(
          error.response?.data?.message || 'Failed to register staff',
          { position: 'top-right', autoClose: 5000 }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Get staff logs in chronological order (oldest first)
  const fetchStaffHistory = async (permanentId) => {
    if (!permanentId) {
      toast.error('No staff ID provided', { position: 'top-right', autoClose: 3000 });
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.get(
        `${API}/staff/history/${permanentId}`,
        getAuthHeaders()
      );
      
      if (response.data) {
        // Sort history by timestamp (oldest first)
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
      setLoading(false);
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
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (member.permanentId?.toLowerCase().includes(searchLower)) ||
        (member.name?.toLowerCase().includes(searchLower)) ||
        (member.role && member.role.toLowerCase().includes(searchLower)) ||
        (member.residentId?.name && member.residentId.name.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  // Initial data fetch
  useEffect(() => {
    fetchStaff();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Shield className="text-blue-600" size={28} />
                Security Staff Management
              </h1>
              <p className="text-gray-600 mt-1">Manage all staff entries and exits</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchStaff}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  'Refresh'
                )}
              </button>
           
            </div>
          </div>
        </div>

        {/* Filters and Search Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'inside', 'outside', 'blocked'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1 rounded-lg text-sm capitalize ${
                      filterStatus === status
                        ? status === 'all' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : status === 'inside'
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : status === 'outside'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all' ? 'All' : status}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Staff</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400 h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, ID, role, or resident..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Staff Table Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Staff', 'Role', 'Status', 'Last Action', 'Actions'].map((header) => (
                    <th key={header} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && staff.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                      </div>
                    </td>
                  </tr>
                ) : filteredStaff.length ? (
                  filteredStaff.map((member) => (
                    <tr key={member._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-500">ID: {member.permanentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {member.role === 'other' ? member.other_role : member.role}
                        </div>
                        {member.residentId?.name && (
                          <div className="text-sm text-gray-500">Resident: {member.residentId.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center gap-1 ${
                            member.status === 'blocked'
                              ? 'bg-purple-100 text-purple-800'
                              : member.isInside
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {member.status === 'blocked' ? 'BLOCKED' : member.isInside ? 'INSIDE' : 'OUTSIDE'}
                          {getStatusIcon(member.status === 'blocked' ? 'blocked' : member.isInside ? 'inside' : 'outside')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {member.lastEntryTime && (
                            <>
                              <div>{member.isInside ? 'Entered' : 'Exited'}</div>
                              <div className="text-gray-500">{formatDate(member.isInside ? member.lastEntryTime : member.lastExitTime)}</div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-3">
                          {member.status !== 'blocked' && (
                            <button
                              onClick={() => {
                                setSelectedStaff(member);
                                setActionType(member.isInside ? 'exit' : 'entry');
                                setShowActionModal(true);
                              }}
                              className={`${
                                member.isInside
                                  ? 'text-red-600 hover:text-red-900'
                                  : 'text-green-600 hover:text-green-900'
                              } transition-colors`}
                            >
                              {member.isInside ? 'Exit' : 'Entry'}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedStaff(member);
                              fetchStaffHistory(member.permanentId);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No staff members found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Modal (Entry/Exit) */}
        {showActionModal && selectedStaff && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    {actionType === 'entry' ? 'Record Staff Entry' : 'Record Staff Exit'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowActionModal(false);
                      setNotes('');
                    }}
                    disabled={loading}
                    className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`p-3 rounded-lg ${
                        actionType === 'entry' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{selectedStaff.name}</h3>
                      <p className="text-sm text-gray-600">
                        ID: {selectedStaff.permanentId} • {selectedStaff.role === 'other' ? selectedStaff.other_role : selectedStaff.role}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Resident</p>
                      <p className="font-medium text-sm">
                        {selectedStaff.residentId?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium text-sm">
                        {selectedStaff.status === 'blocked' ? 'Blocked' : selectedStaff.isInside ? 'Inside' : 'Outside'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional notes..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm focus:border-transparent transition-colors"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowActionModal(false);
                      setNotes('');
                    }}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStaffAction}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2 text-sm ${
                      actionType === 'entry'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } disabled:opacity-50`}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <>
                        {actionType === 'entry' ? (
                          <ArrowRightCircle size={18} />
                        ) : (
                          <ArrowLeftCircle size={18} />
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

       

        {/* History Modal */}
        {showHistoryModal && selectedStaff && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <History className="text-blue-600" />
                    Staff History - {selectedStaff.name} ({selectedStaff.permanentId})
                  </h2>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Name', value: selectedStaff.name },
                      { label: 'Role', value: selectedStaff.role === 'other' ? selectedStaff.other_role : selectedStaff.role, capitalize: true },
                      { label: 'Status', value: selectedStaff.status === 'blocked' ? 'blocked' : selectedStaff.isInside ? 'inside' : 'outside', status: true }
                    ].map((item) => (
                      <div key={item.label} className="flex flex-col">
                        <p className="text-sm text-gray-500">{item.label}</p>
                        <p className="font-medium text-sm">
                          {item.status ? (
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                item.value === 'inside'
                                  ? 'bg-green-100 text-green-800'
                                  : item.value === 'outside'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {item.value?.toUpperCase() || 'UNKNOWN'}
                            </span>
                          ) : item.capitalize ? (
                            item.value?.toLowerCase()
                          ) : (
                            item.value
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-800 mb-3">Movement History</h3>
                  {staffHistory.length > 0 ? (
                    <div className="space-y-4">
                      {staffHistory.map((log, index) => (
                        <div key={index} className="border-l-2 border-blue-200 pl-4 py-2">
                          <div key={index} className="border-l-2 border-blue-200 pl-4 py-2">
  <div className="flex justify-between">
    <div>
      <p className="font-medium flex items-center gap-2 text-sm">
        {log.entryTime && !log.exitTime ? (
          <span className="text-green-600">
            <ArrowRightCircle className="inline mr-1" size={16} />
            Entered Premises
          </span>
        ) : log.exitTime ? (
          <span className="text-red-600">
            <ArrowLeftCircle className="inline mr-1" size={16} />
            Exited Premises
          </span>
        ) : (
          <span className="capitalize">{log.action?.toLowerCase()}</span>
        )}
      </p>
      <p className="text-sm text-gray-500">
        {formatDate(log.entryTime || log.exitTime)}
      </p>
      {log.notes && (
        <p className="text-xs text-gray-500 mt-1 bg-gray-100 p-2 rounded">
          <span className="font-medium">Note:</span> {log.notes}
        </p>
      )}
    </div>
    {log.securityGuard && (
      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
        Verified by Security
      </div>
    )}
  </div>
</div>
              
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4 text-sm">No movement history available</p>
                  )}
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