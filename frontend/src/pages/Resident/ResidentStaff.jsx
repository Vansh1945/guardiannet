import React, { useState, useEffect } from 'react';
import { Phone, User, Briefcase, Shield, Eye, Trash2, UserPlus, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from "../../Context/AuthContext";

const StaffManagement = () => {
  const [staffData, setStaffData] = useState([]);
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'maid',
    phone: '',
    other_role: ''
  });
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [blockRemark, setBlockRemark] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [actionStaff, setActionStaff] = useState(null);
  const [residentData, setResidentData] = useState(null);
  const [residentLoading, setResidentLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [messageRecipient, setMessageRecipient] = useState(null);
  const [editableSmsPhone, setEditableSmsPhone] = useState('');
  const navigate = useNavigate();
    const { API } = useAuth();


  // Get authentication headers with token validation
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No authentication token found. Please log in.', { position: 'top-right', autoClose: 5000 });
      navigate('/login');
      return {};
    }
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  // Fetch resident profile data
  const fetchResidentData = async () => {
    try {
      setResidentLoading(true);
      const response = await axios.get(`${API}/profile/get-profile`, getAuthHeaders());
      const resident = response.data.user || response.data.data || response.data;
      if (!resident._id) {
        throw new Error('Resident data missing _id');
      }
      setResidentData(resident);
    } catch (error) {
      console.error('Error fetching resident data:', error);
      toast.error(error.message || 'Failed to load resident information', { position: 'top-right', autoClose: 5000 });
      navigate('/login');
    } finally {
      setResidentLoading(false);
    }
  };

  // Fetch staff data for the resident
  const fetchStaff = async () => {
    if (!residentData) return;
    try {
      const response = await axios.get(`${API}/staff/resident/${residentData._id}`, getAuthHeaders());
      setStaffData(response.data);
    } catch (error) {
      console.error('Error fetching staff data:', error);
      toast.error(error.response?.data?.message || 'Failed to load staff data', { position: 'top-right', autoClose: 5000 });
    }
  };

  // Handle phone input to auto-prepend +91
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (!value.startsWith('91')) {
      value = '91' + value;
    }
    value = '+' + value;
    setNewStaff({ ...newStaff, phone: value });
  };

  // Add new staff member
  const addStaff = async (e) => {
    e.preventDefault();
    if (!residentData || !residentData._id) {
      toast.error('Resident data not loaded. Please try again.', { position: 'top-right', autoClose: 5000 });
      return;
    }
    if (!newStaff.name || !newStaff.role || !newStaff.phone) {
      toast.error('Please fill all required fields', { position: 'top-right', autoClose: 5000 });
      return;
    }
    if (!newStaff.phone.startsWith('+')) {
      toast.error('Phone number must include country code (e.g., +91...)', { position: 'top-right', autoClose: 5000 });
      return;
    }
    const payload = { ...newStaff, residentId: residentData._id };
    await toast.promise(
      axios.post(`${API}/staff/add-staff`, payload, getAuthHeaders()).then(response => {
        if (response.data.success) {
          setNewStaff({ name: '', role: 'maid', phone: '', other_role: '' });
          fetchStaff();
          return `Staff added successfully! Permanent ID: ${response.data.data.permanentId}`;
        }
        throw new Error(response.data.message || 'Failed to add staff');
      }),
      {
        pending: 'Adding staff...',
        success: { render: ({ data }) => data },
        error: { render: ({ data }) => data.response?.data?.message || 'Failed to add staff' }
      },
      { position: 'top-right', autoClose: 5000 }
    );
  };

  // Block staff with remark
  const blockStaff = async () => {
    if (!blockRemark.trim()) {
      toast.error('Block remark is required', { position: 'top-right', autoClose: 5000 });
      return;
    }
    await toast.promise(
      axios.put(`${API}/staff/block/${actionStaff._id}`, { remark: blockRemark }, getAuthHeaders()).then(() => {
        setShowBlockModal(false);
        setBlockRemark('');
        setActionStaff(null);
        fetchStaff();
        return 'Staff blocked successfully';
      }),
      {
        pending: 'Blocking staff...',
        success: { render: ({ data }) => data },
        error: { render: ({ data }) => data.response?.data?.message || 'Failed to block staff' }
      },
      { position: 'top-right', autoClose: 5000 }
    );
  };

  // Unblock staff
  const unblockStaff = async (staff) => {
    await toast.promise(
      axios.put(`${API}/staff/unblock/${staff._id}`, {}, getAuthHeaders()).then(() => {
        fetchStaff();
        return 'Staff unblocked successfully';
      }),
      {
        pending: 'Unblocking staff...',
        success: { render: ({ data }) => data },
        error: { render: ({ data }) => data.response?.data?.message || 'Failed to unblock staff' }
      },
      { position: 'top-right', autoClose: 5000 }
    );
  };

  // Delete staff
  const deleteStaff = async (staff) => {
    if (!window.confirm(`Are you sure you want to delete ${staff.name}?`)) return;
    await toast.promise(
      axios.delete(`${API}/staff/delete/${staff._id}`, getAuthHeaders()).then(() => {
        fetchStaff();
        return 'Staff deleted successfully';
      }),
      {
        pending: 'Deleting staff...',
        success: { render: ({ data }) => data },
        error: { render: ({ data }) => data.response?.data?.message || 'Failed to delete staff' }
      },
      { position: 'top-right', autoClose: 5000 }
    );
  };

  // View staff entry/exit history
  const viewHistory = async (staff) => {
    await toast.promise(
      axios.get(`${API}/staff/history/${staff.permanentId}`, getAuthHeaders()).then(response => {
        setSelectedStaff({ ...staff, history: response.data.history });
        return 'History loaded successfully';
      }),
      {
        pending: 'Loading history...',
        success: { render: ({ data }) => data },
        error: { render: ({ data }) => data.response?.data?.message || 'Failed to fetch history' }
      },
      { position: 'top-right', autoClose: 5000 }
    );
  };

  // Send SMS to staff
  const sendMessage = async () => {
    if (!messageContent.trim()) {
      toast.error('Message cannot be empty', { position: 'top-right', autoClose: 5000 });
      return;
    }
    let phoneNumberToSend = editableSmsPhone;
    if (!phoneNumberToSend.startsWith('+')) {
      phoneNumberToSend = '+91' + phoneNumberToSend;
    }
    if (!phoneNumberToSend) {
      toast.error('Invalid phone number for messaging', { position: 'top-right', autoClose: 5000 });
      return;
    }
    await toast.promise(
      axios.post(`${API}/staff/send-sms`, { phone: phoneNumberToSend, message: messageContent }, getAuthHeaders()).then(response => {
        if (response.data.success) {
          setShowMessageModal(false);
          setMessageContent('');
          setMessageRecipient(null);
          setEditableSmsPhone('');
          return `Message sent successfully to ${phoneNumberToSend}`;
        }
        throw new Error(response.data.message || 'Failed to send message');
      }),
      {
        pending: 'Sending message...',
        success: { render: ({ data }) => data },
        error: { render: ({ data }) => data.response?.data?.message || 'Failed to send message' }
      },
      { position: 'top-right', autoClose: 5000 }
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  useEffect(() => {
    fetchResidentData();
  }, []);

  useEffect(() => {
    if (residentData) fetchStaff();
  }, [residentData]);

  if (residentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Staff Management System</h1>
              <p className="text-gray-600 mt-1">
                {residentData ? `Resident: ${residentData.name}` : 'No resident information available'}
              </p>
            </div>
           
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <UserPlus className="text-blue-600" size={28} />
            <h2 className="text-2xl font-bold text-gray-800">Add New Staff Member</h2>
          </div>

          <form onSubmit={addStaff} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
                  required
                >
                  <option value="maid">Maid</option>
                  <option value="driver">Driver</option>
                  <option value="cook">Cook</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {newStaff.role === 'other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specify Role</label>
                <input
                  type="text"
                  placeholder="Specify other role"
                  value={newStaff.other_role}
                  onChange={(e) => setNewStaff({ ...newStaff, other_role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  placeholder="987654XXXX"
                  value={newStaff.phone}
                  onChange={handlePhoneChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                  pattern="^\+?[0-9]{10,15}$"
                />
              </div>
            </div>

            <div className="lg:col-span-4 flex justify-center mt-4">
              <button
                type="submit"
                disabled={!residentData}
                className={`py-3 px-8 rounded-lg transition flex items-center justify-center gap-2 shadow-md ${
                  residentData ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <UserPlus size={18} /> Add Staff Member
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Staff List</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {staffData.length > 0 ? (
              staffData.map((staff) => (
                <div
                  key={staff._id}
                  className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{staff.name}</h3>
                      <p className="text-gray-600 capitalize">
                        {staff.role === 'other' ? staff.other_role : staff.role}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        staff.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {staff.status === 'active' ? 'Active' : 'Blocked'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <p className="text-gray-700 flex items-center">
                      <Phone size={16} className="mr-2 text-blue-600" />
                      {staff.phone}
                    </p>
                    <p className="text-gray-700 flex items-center">
                      <Shield size={16} className="mr-2 text-blue-600" />
                      ID: {staff.permanentId}
                    </p>
                    {staff.status === 'blocked' && staff.blockRemark && (
                      <p className="text-red-600 text-sm bg-red-50 p-2 rounded">
                        <strong>Block Reason:</strong> {staff.blockRemark}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {staff.status === 'active' ? (
                      <button
                        onClick={() => {
                          setActionStaff(staff);
                          setShowBlockModal(true);
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                      >
                        Block
                      </button>
                    ) : (
                      <button
                        onClick={() => unblockStaff(staff)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                      >
                        Unblock
                      </button>
                    )}

                    <button
                      onClick={() => viewHistory(staff)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center"
                    >
                      <Eye size={16} className="mr-1" /> History
                    </button>

                    <button
                      onClick={() => {
                        setMessageRecipient(staff);
                        setEditableSmsPhone(staff.phone);
                        setShowMessageModal(true);
                      }}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm font-medium flex items-center"
                    >
                      <MessageSquare size={16} className="mr-1" /> Message
                    </button>

                    <button
                      onClick={() => deleteStaff(staff)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium flex items-center"
                    >
                      <Trash2 size={16} className="mr-2" /> Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <User size={32} className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <p className="text-xl text-gray-600 mb-2">No staff members added yet</p>
                <p className="text-gray-500">Add your first staff member to get started</p>
              </div>
            )}
          </div>
      </div>

      {showBlockModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Block {actionStaff?.name}</h2>
            <p className="text-gray-600 mb-4">Please provide a reason for blocking this staff member:</p>
            <textarea
              value={blockRemark}
              onChange={(e) => setBlockRemark(e.target.value)}
              placeholder="Enter block reason..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-6"
              rows="3"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockRemark('');
                  setActionStaff(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={blockStaff}
                disabled={!blockRemark.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Block Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Send SMS to {messageRecipient?.name}</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={editableSmsPhone}
                onChange={(e) => setEditableSmsPhone(e.target.value)}
                placeholder="Enter phone number (e.g., +919876543210)"
                className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Type your message..."
              className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6"
              rows="4"
              maxLength={160}
            />
            <div className="text-right text-xs text-gray-500 mb-4">
              {messageContent.length}/160 characters
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setMessageContent('');
                  setMessageRecipient(null);
                  setEditableSmsPhone('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                disabled={!messageContent.trim() || !editableSmsPhone.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <MessageSquare size={16} /> Send SMS
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{selectedStaff.name}'s Entry/Exit History</h2>
            <div className="max-h-96 overflow-y-auto">
              {selectedStaff.history && selectedStaff.history.length > 0 ? (
                <div className="space-y-3">
                  {selectedStaff.history.map((log, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-start">
                        <div>
                          <p className="font-semibold text-green-600">
                            Entry: {formatDate(log.entryTime)}
                          </p>
                          {log.exitTime && (
                            <p className="font-semibold text-red-600">
                              Exit: {formatDate(log.exitTime)}
                            </p>
                          )}
                          {!log.exitTime && (
                            <p className="text-orange-600 font-medium">Currently Inside</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No entry/exit history available</p>
              )}
            </div>
            <button
              onClick={() => setSelectedStaff(null)}
              className="mt-6 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default StaffManagement;