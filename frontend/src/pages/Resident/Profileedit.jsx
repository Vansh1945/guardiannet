import React, { useState, useEffect } from 'react';
import { User, Edit, Camera, Plus, Trash2, Save, X, Phone, Mail, Home, Users } from 'lucide-react';
import axios from 'axios';
import { useAuth } from "../../Context/AuthContext";

const ResidentProfileManager = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editFamilyMember, setEditFamilyMember] = useState(null);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const { API } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    flat_no: ''
  });
  const [familyForm, setFamilyForm] = useState({
    name: '',
    relation: '',
    gender: ''
  });


  // Set auth token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/profile/get-profile`);

      if (response.data.success) {
        setUser(response.data.user);
        setProfileForm({
          name: response.data.user.name || '',
          email: response.data.user.email || '',
          phone: response.data.user.phone || '',
          flat_no: response.data.user.flat_no || ''
        });
      } else {
        setError(response.data.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      setError(error.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      if (!profileForm.name.trim()) {
        setError('Name is required');
        return;
      }

      const response = await axios.put(`${API}/profile/update-profile`, profileForm);

      if (response.data.success) {
        setUser(prev => ({ ...prev, ...profileForm }));
        setEditMode(false);
        setError('');
      } else {
        setError(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setError(error.response?.data?.message || 'Network error. Please try again.');
    }
  };

  const updateProfilePicture = async (file) => {
    try {
      setUploadingPicture(true);
      setError('');

      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await axios.post(`${API}/profile/picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setUser(prev => ({
          ...prev,
          profilePicture: response.data.profilePicture
        }));
        setError('');
      } else {
        setError(response.data.message || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('Profile picture update error:', error);
      setError(error.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setUploadingPicture(false);
    }
  };

  const addFamilyMember = async () => {
    try {
      if (!familyForm.name.trim() || !familyForm.relation.trim()) {
        setError('Name and relation are required');
        return;
      }

      const response = await axios.post(`${API}/profile/add-familymember`, familyForm);

      if (response.data.success) {
        setUser(prev => ({
          ...prev,
          familyMembers: [...(prev.familyMembers || []), response.data.familyMember]
        }));
        setShowAddFamily(false);
        setFamilyForm({ name: '', relation: '', gender: '' });
        setError('');
      } else {
        setError(response.data.message || 'Failed to add family member');
      }
    } catch (error) {
      console.error('Add family member error:', error);
      setError(error.response?.data?.message || 'Network error. Please try again.');
    }
  };

  const updateFamilyMember = async () => {
    try {
      if (!familyForm.name.trim() || !familyForm.relation.trim()) {
        setError('Name and relation are required');
        return;
      }

      const response = await axios.put(`${API}/profile/edit-family`, {
        memberId: editFamilyMember._id,
        ...familyForm
      });

      if (response.data.success) {
        setUser(prev => ({
          ...prev,
          familyMembers: prev.familyMembers.map(member =>
            member._id === editFamilyMember._id ? response.data.updatedMember : member
          )
        }));
        setEditFamilyMember(null);
        setFamilyForm({ name: '', relation: '', gender: '' });
        setError('');
      } else {
        setError(response.data.message || 'Failed to update family member');
      }
    } catch (error) {
      console.error('Update family member error:', error);
      setError(error.response?.data?.message || 'Network error. Please try again.');
    }
  };

  const removeFamilyMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this family member?')) return;

    try {
      const response = await axios.delete(`${API}/profile/family/${memberId}`);

      if (response.data.success) {
        setUser(prev => ({
          ...prev,
          familyMembers: prev.familyMembers.filter(member => member._id !== memberId)
        }));
        setError('');
      } else {
        setError(response.data.message || 'Failed to remove family member');
      }
    } catch (error) {
      console.error('Remove family member error:', error);
      setError(error.response?.data?.message || 'Network error. Please try again.');
    }
  };

  const handleProfileChange = (e) => {
    setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFamilyChange = (e) => {
    setFamilyForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPEG, JPG, and PNG files are allowed');
        return;
      }

      updateProfilePicture(file);
    }
  };

  const startEditingFamilyMember = (member) => {
    setEditFamilyMember(member);
    setFamilyForm({
      name: member.name,
      relation: member.relation,
      gender: member.gender || ''
    });
  };

  const cancelEditing = () => {
    setEditMode(false);
    setEditFamilyMember(null);
    setShowAddFamily(false);
    setFamilyForm({ name: '', relation: '', gender: '' });
    setError('');
    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
        phone: user.phone,
        flat_no: user.flat_no
      });
    }
  };

  const getProfilePictureUrl = (picturePath) => {
    if (!picturePath) return null;

    if (picturePath.startsWith('http')) {
      return picturePath;
    }

    const cleanPath = picturePath.startsWith('/') ? picturePath.slice(1) : picturePath;
    return `http://localhost:5000/${cleanPath}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile not found</h2>
          <p className="text-gray-600">Unable to load profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white p-1 shadow-md">
                  {user.profilePicture ? (
                    <img
                      src={getProfilePictureUrl(user.profilePicture)}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center"
                    style={{ display: user.profilePicture ? 'none' : 'flex' }}
                  >
                    <User className="w-14 h-14 text-blue-500" />
                  </div>
                </div>
                <label className={`absolute bottom-2 right-2 bg-white rounded-full p-2 cursor-pointer hover:bg-gray-100 transition-colors shadow-md ${uploadingPicture ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {uploadingPicture ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Camera className="w-4 h-4 text-blue-600" />
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingPicture}
                  />
                </label>
              </div>

              {/* User Info */}
              <div className="text-white text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold">{user.name}</h1>
                <p className="text-blue-100 text-lg capitalize">{user.role}</p>
                <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="bg-blue-400 bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    PID: {user.permanentId}
                  </span>
                  {user.flat_no && (
                    <span className="bg-blue-400 bg-opacity-20 px-3 py-1 rounded-full text-sm">
                      Flat: {user.flat_no}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
              <div className="flex justify-between items-start">
                <p className="text-red-800 text-sm">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Profile Details */}
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Profile Information</h2>
              <button
                onClick={() => editMode ? updateProfile() : setEditMode(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                {editMode ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                <span>{editMode ? 'Save Changes' : 'Edit Profile'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Name</label>
                {editMode ? (
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    required
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <User className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-800">{user.name}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                {editMode ? (
                  <input
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-800">{user.email || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                {editMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-800">{user.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* Flat Number */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Flat Number</label>
                {editMode ? (
                  <input
                    type="text"
                    name="flat_no"
                    value={profileForm.flat_no}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Home className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-800">{user.flat_no || 'Not provided'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {editMode && (
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-8">
                <button
                  onClick={updateProfile}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={cancelEditing}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Family Members Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center space-x-2 mb-4 sm:mb-0">
                <Users className="w-6 h-6 text-blue-600" />
                <span>Family Members</span>
              </h2>
              <button
                onClick={() => setShowAddFamily(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>
          </div>

          {/* Family Members List */}
          <div className="p-6 sm:p-8">
            {user.familyMembers && user.familyMembers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.familyMembers.map((member) => (
                  <div key={member._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 text-lg">{member.name}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditingFamilyMember(member)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFamilyMember(member._id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Relation:</span> {member.relation}
                      </p>
                      {member.gender && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Gender:</span> {member.gender}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        PID: {member.permanentId || user.permanentId}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-1">No family members</h3>
                <p className="text-gray-500">Add family members to your profile</p>
                <button
                  onClick={() => setShowAddFamily(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Family Member
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Family Member Modal */}
      {(showAddFamily || editFamilyMember) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                {editFamilyMember ? 'Edit Family Member' : 'Add Family Member'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={familyForm.name}
                  onChange={handleFamilyChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relation *</label>
                <select
                  name="relation"
                  value={familyForm.relation}
                  onChange={handleFamilyChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                >
                  <option value="">Select relation</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Brother">Brother</option>
                  <option value="Sister">Sister</option>
                  <option value="Grandfather">Grandfather</option>
                  <option value="Grandmother">Grandmother</option>
                  <option value="Uncle">Uncle</option>
                  <option value="Aunt">Aunt</option>
                  <option value="Cousin">Cousin</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={familyForm.gender}
                  onChange={handleFamilyChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex space-x-3">
              <button
                onClick={editFamilyMember ? updateFamilyMember : addFamilyMember}
                disabled={!familyForm.name.trim() || !familyForm.relation.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
              >
                {editFamilyMember ? 'Update' : 'Add'} Member
              </button>
              <button
                onClick={cancelEditing}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors shadow-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentProfileManager;