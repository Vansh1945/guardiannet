import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { User, Camera, Lock } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../Context/AuthContext";

const AdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { API } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found. Please log in.");
        }

        const response = await axios.get(
          `${API}/profile/get-profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data?.success && response.data.user) {
          setProfile(response.data.user);
          reset(response.data.user);
        } else {
          throw new Error("Invalid response from server.");
        }
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || "Failed to load profile.";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [reset]);

  // Handle profile update
  const onSubmit = async (data) => {
    try {
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const response = await axios.put(
        `${API}/profile/update-profile`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data?.success && response.data.user) {
        setProfile(response.data.user);
        setIsEditing(false);
        toast.success("Profile updated successfully");
      } else {
        throw new Error("Invalid response from server.");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Profile update failed.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Update error:", err);
    }
  };

  // Handle profile picture change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file (JPEG, PNG).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB.");
        return;
      }
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // Upload profile picture
  const uploadProfilePicture = async () => {
    if (!selectedFile) {
      toast.error("No file selected.");
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", selectedFile);

    try {
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }

      const response = await axios.post(
        `${API}/profile/picture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data?.success && response.data.profilePicture) {
        setProfile((prev) => ({
          ...prev,
          profilePicture: response.data.profilePicture,
        }));
        setSelectedFile(null);
        setPreviewImage("");
        toast.success("Profile picture updated successfully");
      } else {
        throw new Error("Invalid response from server.");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Profile picture upload failed.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Upload error:", err);
    }
  };

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  if (loading) {
    return (
      <div className="p-4 mt-10 md:p-10 min-h-screen justify-center ">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8 p-6 mt-10 md:p-10 min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Profile Card */}
        <div className="lg:w-1/3 space-y-6">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col items-center">
                {/* Profile Picture */}
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : profile?.profilePicture ? (
                      <img
                        src={`${API}/${profile.profilePicture}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/default-profile.png";
                          console.error(
                            "Failed to load profile picture:",
                            profile.profilePicture
                          );
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
                <h2 className="text-2xl font-bold text-gray-800">
                  {profile?.name || "N/A"}
                </h2>
                <p className="text-gray-600 capitalize">
                  {profile?.role || "N/A"}
                </p>
              </div>

              {isEditing ? (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="mt-6 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      {...register("name", { required: "Name is required" })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue={profile?.name}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue={profile?.email}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      {...register("phone", {
                        pattern: {
                          value: /^\+?[1-9]\d{1,14}$/,
                          message: "Invalid phone number",
                        },
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      defaultValue={profile?.phone}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.phone.message}
                      </p>
                    )}
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
                      onClick={() => {
                        setIsEditing(false);
                        reset(profile);
                      }}
                      className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Email
                    </h3>
                    <p className="mt-1 text-gray-800">
                      {profile?.email || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Phone
                    </h3>
                    <p className="mt-1 text-gray-800">
                      {profile?.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Account Type
                    </h3>
                    <p className="mt-1 text-gray-800 capitalize">
                      {profile?.role || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => window.location.href = "/reset-password"}
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

      </div>
    </div>
  );
};

export default AdminProfile;