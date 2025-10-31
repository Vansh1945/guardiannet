import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Camera, Lock, Shield } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from "../../Context/AuthContext";

const SecurityProfile = () => {
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState('');
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const { API } = useAuth();

    useEffect(() => {
        const fetchProfile = async () => {
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
            }
        };

        fetchProfile();
    }, [reset, API]);

    const onSubmit = async (data) => {
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
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const uploadProfilePicture = async () => {
        if (!selectedFile) return;

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
        }
    };

    if (!profile) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl"> {/* Centered container with max width */}
                <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                    <Shield className="text-blue-600" size={28} />
                    Security Profile
                </h1>

                <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
                    <div className="flex flex-col items-center">
                        {/* Profile Picture */}
                        <div className="relative mb-4">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                {previewImage ? (
                                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                ) : profile.profilePicture ? (
                                    <img
                                        src={`${API}/${profile.profilePicture}`}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = '/default-profile.png';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                        <User size={48} className="text-gray-500" />
                                    </div>
                                )}
                            </div>
                            <label
                                htmlFor="profilePicture"
                                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-md"
                            >
                                <Camera size={20} />
                                <input
                                    id="profilePicture"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>

                        {/* Save Picture Button */}
                        {selectedFile && (
                            <button
                                onClick={uploadProfilePicture}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition mb-4 shadow-md"
                            >
                                Save Picture
                            </button>
                        )}

                        {/* Profile Info */}
                        <h2 className="text-2xl font-bold text-gray-800">{profile.name}</h2>
                        <p className="text-gray-600 capitalize">{profile.role}</p>
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    {...register('name', { required: 'Name is required' })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    defaultValue={profile.name}
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Invalid email address'
                                        }
                                    })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    defaultValue={profile.email}
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    {...register('phone')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    defaultValue={profile.phone}
                                />
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
                                >
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="mt-6 space-y-4">
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</h3>
                                <p className="mt-1 text-gray-800">{profile.email}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</h3>
                                <p className="mt-1 text-gray-800">{profile.phone || 'Not provided'}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Type</h3>
                                <p className="mt-1 text-gray-800 capitalize">{profile.role}</p>
                            </div>
                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
                                >
                                    Edit Profile
                                </button>
                                <button
                                    onClick={() => window.location.href = '/reset-password'}
                                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                                >
                                    <Lock size={16} />
                                    Change Password
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecurityProfile;