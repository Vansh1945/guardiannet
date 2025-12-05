import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Camera, Lock, Shield, Mail, Phone, Save, X, Edit2, Key } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from "../../Context/AuthContext";

const SecurityProfile = () => {
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const { API, BASE_URL } = useAuth();

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API}/profile/get-profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(response.data.user);
                reset(response.data.user);
            } catch (error) {
                toast.error('Failed to load profile');
                console.error('Profile fetch error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [reset, API]);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API}/profile/update-profile`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(response.data.user);
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
            console.error('Update error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            setSelectedFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const uploadProfilePicture = async () => {
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('profilePicture', selectedFile);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API}/profile/picture`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setProfile(prev => ({ ...prev, profilePicture: response.data.profilePicture }));
            setSelectedFile(null);
            setPreviewImage('');
            toast.success('Profile picture updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Upload failed');
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    if (isLoading && !profile) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-6 md:py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6 md:mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-primary bg-opacity-10">
                            <Shield className="text-primary" size={24} />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-primary">Security Profile</h1>
                    </div>
                    <p className="text-gray-600 text-sm md:text-base">Manage your account information and security settings</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Profile Header Section */}
                    <div className="bg-gradient-to-r from-primary to-primary-dark px-6 py-8 text-white">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            {/* Profile Picture */}
                            <div className="relative">
                                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl bg-gradient-to-br from-white/10 to-transparent">
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : profile?.profilePicture ? (
                                        <img
                                            src={`${BASE_URL}/${profile.profilePicture}`}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-primary-light/20 flex items-center justify-center">
                                            <User size={48} className="text-white/80" />
                                        </div>
                                    )}
                                </div>
                                <label
                                    htmlFor="profilePicture"
                                    className="absolute bottom-2 right-2 bg-secondary text-white p-2 rounded-full cursor-pointer hover:bg-secondary-dark transition-all shadow-lg hover:scale-105 active:scale-95"
                                    title="Change photo"
                                >
                                    <Camera size={16} />
                                    <input
                                        id="profilePicture"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>

                            {/* Profile Info */}
                            <div className="text-center sm:text-left">
                                <h2 className="text-2xl md:text-3xl font-bold mb-2">{profile?.name}</h2>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                                    <span className="text-sm font-medium capitalize">{profile?.role}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="p-6 md:p-8">
                        {/* Profile Picture Upload Button */}
                        {selectedFile && (
                            <div className="mb-6 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Camera className="text-secondary" size={20} />
                                        <span className="text-sm text-gray-700">
                                            New profile picture selected
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={uploadProfilePicture}
                                            disabled={uploading}
                                            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {uploading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={16} />
                                                    Save Picture
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedFile(null);
                                                setPreviewImage('');
                                            }}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Profile Form/View */}
                        {isEditing ? (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name Field */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Full Name
                                        </label>
                                        <input
                                            {...register('name', {
                                                required: 'Name is required',
                                                minLength: {
                                                    value: 2,
                                                    message: 'Name must be at least 2 characters'
                                                }
                                            })}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Enter your full name"
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                                        )}
                                    </div>

                                    {/* Email Field */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Email Address
                                        </label>
                                        <input
                                            {...register('email', {
                                                required: 'Email is required',
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: 'Invalid email address'
                                                }
                                            })}
                                            type="email"
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="your@email.com"
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                                        )}
                                    </div>

                                    {/* Phone Field */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Phone Number
                                        </label>
                                        <input
                                            {...register('phone', {
                                                pattern: {
                                                    value: /^[+]?[0-9\s\-()]{10,}$/,
                                                    message: 'Invalid phone number'
                                                }
                                            })}
                                            type="tel"
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary transition ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="+1 (555) 123-4567"
                                        />
                                        {errors.phone && (
                                            <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                                        )}
                                    </div>

                                    {/* Role Field (Read-only) */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Account Type
                                        </label>
                                        <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-300">
                                            <span className="text-gray-700 capitalize">{profile?.role}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 bg-secondary text-white px-6 py-3 rounded-lg hover:bg-secondary-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        disabled={isLoading}
                                        className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <X size={18} />
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-8">
                                {/* Profile Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Email */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-secondary/10">
                                                <Mail className="text-secondary" size={18} />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Email Address
                                            </span>
                                        </div>
                                        <p className="text-gray-800 text-base font-medium">{profile?.email}</p>
                                    </div>

                                    {/* Phone */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-secondary/10">
                                                <Phone className="text-secondary" size={18} />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Phone Number
                                            </span>
                                        </div>
                                        <p className="text-gray-800 text-base font-medium">
                                            {profile?.phone || 'Not provided'}
                                        </p>
                                    </div>

                                    {/* Account Type */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <User className="text-primary" size={18} />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Account Type
                                            </span>
                                        </div>
                                        <p className="text-gray-800 text-base font-medium capitalize">{profile?.role}</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-4 pt-4">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="w-full bg-secondary text-white px-6 py-3 rounded-lg hover:bg-secondary-dark transition flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
                                    >
                                        <Edit2 size={18} />
                                        Edit Profile Information
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => window.location.href = '/reset-password'}
                                            className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-3"
                                        >
                                            <Key size={18} />
                                            Change Password
                                        </button>
                                        <button
                                            className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-3">
                                            <Shield size={18} />
                                            Security Settings
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Note */}
                    <div className="px-6 md:px-8 py-4 bg-gray-50 border-t border-gray-200">
                        <p className="text-sm text-gray-600 text-center">
                            Last updated: {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityProfile;