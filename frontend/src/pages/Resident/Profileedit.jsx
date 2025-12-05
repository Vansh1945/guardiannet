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
    return `${API.replace('/api', '')}/${cleanPath}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-3 border-b-3 border-secondary mx-auto mb-4"></div>
          <p className="text-text/70 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md w-full mx-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-3">Profile not found</h2>
          <p className="text-text/70 mb-6">Unable to load profile information. Please try again later.</p>
          <button
            onClick={fetchProfile}
            className="bg-secondary hover:bg-secondary-dark text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow hover:shadow-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      {/* Main Container */}
      <div className="max-w-6xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-primary to-primary-light px-6 py-8 sm:px-8 sm:py-10 lg:py-12">
            <div className="flex flex-col lg:flex-row items-center lg:items-start lg:justify-between gap-8">
              {/* Profile Picture Section */}
              <div className="relative">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full bg-white p-2 shadow-xl">
                  {user.profilePicture ? (
                    <img
                      src={getProfilePictureUrl(user.profilePicture)}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover border-4 border-white shadow-inner"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full rounded-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center border-4 border-white"
                    style={{ display: user.profilePicture ? 'none' : 'flex' }}
                  >
                    <User className="w-16 h-16 sm:w-20 sm:h-20 text-primary" />
                  </div>
                  <label className={`absolute -bottom-2 -right-2 bg-white rounded-full p-3 cursor-pointer hover:bg-gray-50 transition-all duration-300 shadow-lg ${uploadingPicture ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {uploadingPicture ? (
                      <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Camera className="w-5 h-5 text-secondary" />
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
              </div>

              {/* User Info Section */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">{user.name}</h1>
                <p className="text-white/90 text-lg sm:text-xl capitalize mb-6">{user.role}</p>
                
                <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                  <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-white">
                    PID: {user.permanentId}
                  </span>
                  {user.flat_no && (
                    <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-white">
                      <Home className="inline-block w-4 h-4 mr-2" />
                      Flat: {user.flat_no}
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Button for Mobile */}
              <div className="lg:hidden w-full">
                <button
                  onClick={() => editMode ? updateProfile() : setEditMode(true)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary-dark text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {editMode ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                  <span className="font-medium">{editMode ? 'Save Changes' : 'Edit Profile'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-red-800 font-medium">Error</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-600 hover:text-red-800 text-sm p-1 hover:bg-red-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Profile Details Section */}
          <div className="p-6 sm:p-8 lg:p-10">
            {/* Desktop Edit Button */}
            <div className="hidden lg:flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                Profile Information
              </h2>
              <button
                onClick={() => editMode ? updateProfile() : setEditMode(true)}
                className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary-dark text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {editMode ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
                <span className="font-medium">{editMode ? 'Save Changes' : 'Edit Profile'}</span>
              </button>
            </div>

            {/* Profile Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* Name Field */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-primary">Full Name</label>
                {editMode ? (
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-primary/20 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all duration-300 bg-background text-text"
                    placeholder="Enter your full name"
                    required
                  />
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-primary/10">
                    <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-secondary" />
                    </div>
                    <span className="text-text font-medium">{user.name}</span>
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-primary">Email Address</label>
                {editMode ? (
                  <input
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-primary/20 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all duration-300 bg-background text-text"
                    placeholder="Enter your email"
                  />
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-primary/10">
                    <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-secondary" />
                    </div>
                    <span className="text-text font-medium">{user.email || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-primary">Phone Number</label>
                {editMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-primary/20 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all duration-300 bg-background text-text"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-primary/10">
                    <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-secondary" />
                    </div>
                    <span className="text-text font-medium">{user.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>

              {/* Flat Number Field */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-primary">Flat Number</label>
                {editMode ? (
                  <input
                    type="text"
                    name="flat_no"
                    value={profileForm.flat_no}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-primary/20 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all duration-300 bg-background text-text"
                    placeholder="Enter flat number"
                  />
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-primary/10">
                    <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                      <Home className="w-5 h-5 text-secondary" />
                    </div>
                    <span className="text-text font-medium">{user.flat_no || 'Not provided'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Mode Action Buttons */}
            {editMode && (
              <div className="flex flex-col sm:flex-row gap-4 mt-10 pt-8 border-t border-primary/10">
                <button
                  onClick={updateProfile}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Save className="w-5 h-5" />
                  <span className="font-medium">Save Changes</span>
                </button>
                <button
                  onClick={cancelEditing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <X className="w-5 h-5" />
                  <span className="font-medium">Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Family Members Section */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8 lg:p-10 border-b border-primary/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-primary">Family Members</h2>
                  <p className="text-text/70 text-sm mt-1">Manage your family members in the residence</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddFamily(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary-dark text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Member</span>
              </button>
            </div>
          </div>

          {/* Family Members List */}
          <div className="p-6 sm:p-8 lg:p-10">
            {user.familyMembers && user.familyMembers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {user.familyMembers.map((member) => (
                  <div key={member._id} className="bg-background rounded-xl p-5 border border-primary/10 hover:border-secondary transition-all duration-300 hover:shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-bold text-lg text-primary">{member.name}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditingFamilyMember(member)}
                          className="p-2 text-secondary hover:text-secondary-dark hover:bg-secondary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFamilyMember(member._id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pl-13">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="w-3 h-3 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-text/60">Relation</p>
                          <p className="font-medium text-text">{member.relation}</p>
                        </div>
                      </div>
                      
                      {member.gender && (
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-text/60">Gender</p>
                            <p className="font-medium text-text capitalize">{member.gender}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-primary/10">
                        <p className="text-xs text-text/50">
                          PID: {member.permanentId || user.permanentId}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 lg:py-16">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">No family members added</h3>
                <p className="text-text/70 mb-8 max-w-md mx-auto">Start by adding your family members to manage their information in the residence</p>
                <button
                  onClick={() => setShowAddFamily(true)}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-secondary hover:bg-secondary-dark text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add First Family Member</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Family Member Modal */}
      {(showAddFamily || editFamilyMember) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-slideUp">
            <div className="p-6 bg-gradient-to-r from-primary to-primary-light">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                {editFamilyMember ? 'Edit Family Member' : 'Add Family Member'}
              </h3>
            </div>

            <div className="p-6 space-y-5">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={familyForm.name}
                  onChange={handleFamilyChange}
                  className="w-full px-4 py-3 border border-primary/20 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all duration-300 bg-background text-text"
                  placeholder="Enter family member's name"
                  required
                />
              </div>

              {/* Relation Select */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Relation *</label>
                <select
                  name="relation"
                  value={familyForm.relation}
                  onChange={handleFamilyChange}
                  className="w-full px-4 py-3 border border-primary/20 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all duration-300 bg-background text-text appearance-none"
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

              {/* Gender Select */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Gender</label>
                <select
                  name="gender"
                  value={familyForm.gender}
                  onChange={handleFamilyChange}
                  className="w-full px-4 py-3 border border-primary/20 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all duration-300 bg-background text-text appearance-none"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-background border-t border-primary/10 flex flex-col sm:flex-row gap-3">
              <button
                onClick={editFamilyMember ? updateFamilyMember : addFamilyMember}
                disabled={!familyForm.name.trim() || !familyForm.relation.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary-dark text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
              >
                <Save className="w-5 h-5" />
                <span className="font-medium">{editFamilyMember ? 'Update' : 'Add'} Member</span>
              </button>
              <button
                onClick={cancelEditing}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <X className="w-5 h-5" />
                <span className="font-medium">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentProfileManager;