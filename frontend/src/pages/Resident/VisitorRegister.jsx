import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  QrCode,
  UserPlus,
  Users,
  MessageSquare,
  Smartphone,
  Calendar,
  Search,
  Home,
  User,
  ArrowRightCircle,
  ArrowLeftCircle,
  Download,
  Edit,
  Save,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Share2,
  History,
  Menu,
  ChevronDown,
  Filter,
  Phone,
  MoreVertical
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import QRCode from "qrcode";
import { useAuth } from "../../Context/AuthContext";

const ResidentVisitorManagement = () => {
  const [activeTab, setActiveTab] = useState("invite");
  const [visitors, setVisitors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [residentData, setResidentData] = useState(null);
  const [errors, setErrors] = useState({});
  const [editingVisitor, setEditingVisitor] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    purpose: "Guest"
  });
  const [selectedVisitorLogs, setSelectedVisitorLogs] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileActionMenu, setMobileActionMenu] = useState(null);
  const navigate = useNavigate();
  const { API } = useAuth();

  const [visitorForm, setVisitorForm] = useState({
    name: "",
    phone: "",
    purpose: "Guest",
    expectedArrival: new Date()
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to continue", { autoClose: 3000 });
      navigate("/login");
      return null;
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Fetch resident data and visitors
  useEffect(() => {
    const fetchData = async () => {
      const headers = getAuthHeaders();
      if (!headers) return;

      setIsLoading(true);
      try {
        // Fetch resident profile
        const residentRes = await axios.get(`${API}/profile/get-profile`, headers);
        setResidentData(residentRes.data.data || residentRes.data.user || residentRes.data);

        // Fetch visitor logs
        const visitorsRes = await axios.get(`${API}/visitor/my-visitors`, headers);
        setVisitors(visitorsRes.data.visitors || visitorsRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(error.response?.data?.message || "Failed to load data");
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!visitorForm.name.trim()) {
      newErrors.name = "Name is required";
    } else if (visitorForm.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if (!visitorForm.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(visitorForm.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone number must be 10 digits";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInviteVisitor = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors", { autoClose: 3000 });
      return;
    }

    const toastId = toast.loading("Inviting visitor...");
    setIsSending(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const payload = {
        name: visitorForm.name.trim(),
        phone: visitorForm.phone.replace(/\D/g, ""),
        purpose: visitorForm.purpose,
        flat_no: residentData.flat_no,
        expected_arrival: visitorForm.expectedArrival
      };

      const response = await axios.post(`${API}/visitor/invite`, payload, headers);
      const inviteData = response.data.data;

      setQrData(inviteData);
      setVisitorForm({
        name: "",
        phone: "",
        purpose: "Guest",
        expectedArrival: new Date()
      });
      
      // Refresh visitor list
      const visitorsRes = await axios.get(`${API}/visitor/my-visitors`, headers);
      setVisitors(visitorsRes.data.visitors || []);

      toast.update(toastId, {
        render: "Visitor invited and SMS sent successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error inviting visitor:", error);
      toast.update(toastId, {
        render: error.response?.data?.message || "Failed to invite visitor",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsSending(false);
    }
  };

  const resendVisitorSMS = async (visitorId) => {
    if (!visitorId) {
      toast.error("Invalid visitor ID");
      return;
    }

    const toastId = toast.loading("Resending SMS...");
    setIsSending(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.post(`${API}/visitor/${visitorId}/resend-sms`, {}, headers);
      
      toast.update(toastId, {
        render: "SMS resent successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error resending SMS:", error);
      toast.update(toastId, {
        render: error.response?.data?.message || "Failed to resend SMS",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsSending(false);
    }
  };

  const downloadQRCode = async (visitorId) => {
    const toastId = toast.loading("Preparing QR code download...");
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      // First check if we already have the visitor data
      const existingVisitor = visitors.find(v => v._id === visitorId);
      
      if (existingVisitor?.qr_code) {
        // Use existing data if available
        await generateAndDownloadQR(existingVisitor);
      } else {
        // Fallback to API request if needed
        const visitorRes = await axios.get(`${API}/visitor/${visitorId}`, headers);
        const visitor = visitorRes.data.data || visitorRes.data;
        await generateAndDownloadQR(visitor);
      }
      
      toast.update(toastId, {
        render: "QR code downloaded successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast.update(toastId, {
        render: error.response?.data?.message || error.message || "Failed to download QR code",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const generateAndDownloadQR = async (visitor) => {
    if (!visitor?.qr_code) {
      throw new Error("No QR code available for this visitor");
    }

    const canvas = document.createElement("canvas");
    await QRCode.toCanvas(canvas, visitor.qr_code, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const link = document.createElement('a');
    link.download = `visitor-pass-${visitor.name || visitor._id}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const approveVisitor = async (visitorId) => {
    const toastId = toast.loading("Approving visitor...");
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.get(`${API}/visitor/${visitorId}/approve`, headers);
      
      // Refresh visitor list
      const visitorsRes = await axios.get(`${API}/visitor/my-visitors`, headers);
      setVisitors(visitorsRes.data.visitors || []);

      toast.update(toastId, {
        render: "Visitor approved successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error approving visitor:", error);
      toast.update(toastId, {
        render: error.response?.data?.message || "Failed to approve visitor",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const denyVisitor = async (visitorId) => {
    const toastId = toast.loading("Denying visitor...");
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.get(`${API}/visitor/${visitorId}/deny`, headers);
      
      // Refresh visitor list
      const visitorsRes = await axios.get(`${API}/visitor/my-visitors`, headers);
      setVisitors(visitorsRes.data.visitors || []);

      toast.update(toastId, {
        render: "Visitor denied successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error denying visitor:", error);
      toast.update(toastId, {
        render: error.response?.data?.message || "Failed to deny visitor",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const exitVisitor = async (visitorId) => {
    const toastId = toast.loading("Recording exit...");
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      await axios.get(`${API}/visitor/${visitorId}/exit`, headers);
      
      // Refresh visitor list
      const visitorsRes = await axios.get(`${API}/visitor/my-visitors`, headers);
      setVisitors(visitorsRes.data.visitors || []);

      toast.update(toastId, {
        render: "Visitor exit recorded",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error recording exit:", error);
      toast.update(toastId, {
        render: error.response?.data?.message || "Failed to record exit",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const startEditing = (visitor) => {
    setEditingVisitor(visitor._id);
    setEditForm({
      name: visitor.name,
      phone: visitor.phone,
      purpose: visitor.purpose || "Guest"
    });
    setMobileActionMenu(null);
  };

  const cancelEditing = () => {
    setEditingVisitor(null);
    setEditForm({ name: "", phone: "", purpose: "Guest" });
    setMobileActionMenu(null);
  };

  const updateVisitor = async () => {
    if (!editingVisitor) return;

    const toastId = toast.loading("Updating visitor...");
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.put(
        `${API}/visitor/${editingVisitor}`,
        editForm,
        headers
      );

      // Update local visitors list
      setVisitors(visitors.map(v => 
        v._id === editingVisitor ? { ...v, ...response.data.data } : v
      ));

      setEditingVisitor(null);
      
      toast.update(toastId, {
        render: "Visitor updated successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error updating visitor:", error);
      toast.update(toastId, {
        render: error.response?.data?.message || "Failed to update visitor",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const viewVisitorLogs = async (visitorId) => {
    const toastId = toast.loading("Loading visitor logs...");
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.get(`${API}/visitor/${visitorId}/logs`, headers);
      setSelectedVisitorLogs(response.data.data);
      setMobileActionMenu(null);
      
      toast.dismiss(toastId);
    } catch (error) {
      console.error("Error fetching visitor logs:", error);
      toast.update(toastId, {
        render: error.response?.data?.message || "Failed to load visitor logs",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const filteredVisitors = visitors.filter((visitor) => {
    if (!visitor) return false;

    const matchesSearch =
      visitor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.phone?.includes(searchTerm);

    const matchesDate =
      !selectedDate ||
      (visitor.createdAt &&
        new Date(visitor.createdAt).toDateString() === selectedDate.toDateString());

    return matchesSearch && matchesDate;
  });

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    try {
      const date = new Date(timeString);
      // Check if the date is valid
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (error) {
      return "-";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "-";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "checked_in":
      case "granted":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "checked_out":
        return "bg-blue-100 text-blue-800";
      case "denied":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "checked_in":
        return "Checked In";
      case "granted":
        return "Approved";
      case "pending":
        return "Pending";
      case "checked_out":
        return "Checked Out";
      case "denied":
        return "Denied";
      default:
        return status || "Unknown";
    }
  };

  const getActionText = (action) => {
    switch (action?.toLowerCase()) {
      case "entry":
        return "Entry";
      case "exit":
        return "Exit";
      default:
        return action || "Unknown";
    }
  };

  const getRoleText = (role) => {
    switch (role?.toLowerCase()) {
      case "resident":
        return "Resident";
      case "security":
        return "Security";
      case "admin":
        return "Admin";
      default:
        return role || "Unknown";
    }
  };

  const shareVisitorPass = async (visitorId) => {
    const toastId = toast.loading("Preparing visitor pass...");
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      // First get the visitor data
      const visitorRes = await axios.get(`${API}/visitor/${visitorId}`, headers);
      const visitor = visitorRes.data.data || visitorRes.data;

      if (!visitor.qr_code) {
        throw new Error("No QR code available for this visitor");
      }

      // Generate QR code data URL
      const qrDataUrl = await QRCode.toDataURL(visitor.qr_code, {
        width: 400,
        margin: 2
      });

      // Create share text
      const shareText = `Visitor Pass for ${visitor.name}\n\n` +
        `Flat: ${visitor.flat_no}\n` +
        `Purpose: ${visitor.purpose || "Not specified"}\n` +
        `Status: ${getStatusText(visitor.entry_status)}\n\n` +
        `Scan the QR code for entry`;

      if (navigator.share) {
        // Use Web Share API if available
        await navigator.share({
          title: `Visitor Pass - ${visitor.name}`,
          text: shareText,
          files: [await (await fetch(qrDataUrl)).blob()]
        });
      } else {
        // Fallback to email
        const mailtoLink = `mailto:?subject=Visitor Pass - ${visitor.name}&body=${encodeURIComponent(shareText)}`;
        window.open(mailtoLink);
      }
      
      toast.update(toastId, {
        render: "Visitor pass shared successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error sharing visitor pass:", error);
        toast.update(toastId, {
          render: error.response?.data?.message || error.message || "Failed to share visitor pass",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    }
  };

  // Mobile Actions Dropdown Component
  const MobileActionsDropdown = ({ visitor }) => (
    <div className="relative">
      <button
        onClick={() => setMobileActionMenu(mobileActionMenu === visitor._id ? null : visitor._id)}
        className="p-2 rounded-lg hover:bg-gray-100"
      >
        <MoreVertical size={20} />
      </button>
      
      {mobileActionMenu === visitor._id && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-2">
          <button
            onClick={() => startEditing(visitor)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <Edit size={16} /> Edit Visitor
          </button>
          
          {visitor.qr_code && (
            <button
              onClick={() => downloadQRCode(visitor._id)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Download size={16} /> Download QR
            </button>
          )}
          
          <button
            onClick={() => viewVisitorLogs(visitor._id)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <History size={16} /> View Logs
          </button>
          
          {visitor.is_pre_registered && (
            <button
              onClick={() => resendVisitorSMS(visitor._id)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <MessageSquare size={16} /> Resend SMS
            </button>
          )}
          
          {visitor.entry_status === "pending" && (
            <>
              <div className="border-t my-1"></div>
              <button
                onClick={() => approveVisitor(visitor._id)}
                className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-gray-50 flex items-center gap-2"
              >
                <CheckCircle size={16} /> Approve
              </button>
              <button
                onClick={() => denyVisitor(visitor._id)}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
              >
                <XCircle size={16} /> Deny
              </button>
            </>
          )}
          
          {["granted", "checked_in"].includes(visitor.entry_status) && (
            <button
              onClick={() => exitVisitor(visitor._id)}
              className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-gray-50 flex items-center gap-2"
            >
              <ArrowLeftCircle size={16} /> Record Exit
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Visitor Management</h1>
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  {residentData ? (
                    <>
                      Resident: {residentData.name} • Flat {residentData.flat_no}
                    </>
                  ) : (
                    "Loading resident information..."
                  )}
                </p>
              </div>
              
            </div>
          </div>
        </div>

        {/* Tabs - Mobile Responsive */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4 md:mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("invite")}
              className={`flex-1 py-3 px-2 md:py-4 md:px-6 text-center font-medium flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base ${
                activeTab === "invite"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <UserPlus size={16} className="md:size-5" />
              <span className="hidden xs:inline">Invite Visitor</span>
              <span className="xs:hidden">Invite</span>
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`flex-1 py-3 px-2 md:py-4 md:px-6 text-center font-medium flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base ${
                activeTab === "logs"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users size={16} className="md:size-5" />
              <span className="hidden sm:inline">My Visitors</span>
              <span className="sm:hidden">Visitors</span>
              <span className="ml-1 bg-blue-100 text-blue-600 text-xs rounded-full px-2 py-0.5">
                {visitors.length}
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {activeTab === "invite" && (
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Invite Form */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg md:text-xl font-bold text-gray-800">Invite New Visitor</h2>
                    <div className="text-xs md:text-sm text-gray-500">
                      All fields marked * are required
                    </div>
                  </div>
                  
                  <form onSubmit={handleInviteVisitor} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Visitor Name *
                      </label>
                      <input
                        type="text"
                        value={visitorForm.name}
                        onChange={(e) => setVisitorForm({ ...visitorForm, name: e.target.value })}
                        className={`w-full px-3 md:px-4 py-2 md:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-base ${
                          errors.name ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Enter visitor's full name"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="text-gray-400" size={18} />
                        </div>
                        <input
                          type="tel"
                          value={visitorForm.phone}
                          onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })}
                          className={`w-full pl-10 pr-4 py-2 md:py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-base ${
                            errors.phone ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder="10-digit phone number"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Purpose of Visit
                        </label>
                        <select
                          value={visitorForm.purpose}
                          onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                          className="w-full px-3 md:px-4 py-2 md:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm md:text-base"
                        >
                          <option value="Guest">Guest</option>
                          <option value="Delivery">Delivery</option>
                          <option value="Service">Service</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Business">Business</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expected Arrival
                        </label>
                        <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-300 rounded-lg">
                          <Calendar className="text-gray-400 flex-shrink-0" size={18} />
                          <DatePicker
                            selected={visitorForm.expectedArrival}
                            onChange={(date) => setVisitorForm({...visitorForm, expectedArrival: date})}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="MMM d, h:mm aa"
                            className="w-full focus:outline-none text-sm md:text-base"
                            popperPlacement="bottom-start"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isSending}
                      className="w-full py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-md bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white disabled:opacity-70 disabled:cursor-not-allowed text-sm md:text-base font-medium"
                    >
                      {isSending ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        <>
                          <QrCode size={18} /> Generate Visitor Pass
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* QR Code Section */}
                <div className="flex flex-col items-center justify-center">
                  {qrData ? (
                    <div className="text-center w-full max-w-md mx-auto">
                      <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Visitor Pass Created</h3>
                        <div className="flex justify-center mb-4">
                          <QRCode 
                            value={qrData.qr_code || qrData.qr_code_data || ""} 
                            size={window.innerWidth < 768 ? 180 : 224}
                            level="H"
                            includeMargin={true}
                          />
                        </div>
                        <div className="mt-4 space-y-2 text-sm md:text-base">
                          <p className="font-semibold text-gray-800">
                            {qrData.visitor?.name || qrData.name || "Unknown"}
                          </p>
                          <p className="text-gray-600 flex items-center justify-center gap-2">
                            <Smartphone size={16} /> {qrData.visitor?.phone || qrData.phone || "-"}
                          </p>
                          <p className="text-gray-500">
                            Purpose: {qrData.visitor?.purpose || qrData.purpose || "Not specified"}
                          </p>
                          {qrData.visitor?.expected_arrival && (
                            <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                              <Clock size={14} />
                              Expected: {formatDateTime(qrData.visitor.expected_arrival)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-2 justify-center">
                        <button
                          onClick={() => resendVisitorSMS(qrData.visitor?._id || qrData._id)}
                          disabled={isSending}
                          className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 md:px-4 rounded-lg transition flex items-center justify-center gap-2 shadow disabled:opacity-70 text-sm"
                        >
                          <MessageSquare size={16} /> Resend SMS
                        </button>
                        <button
                          onClick={() => downloadQRCode(qrData.visitor?._id || qrData._id)}
                          className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 md:px-4 rounded-lg transition flex items-center justify-center gap-2 shadow text-sm"
                        >
                          <Download size={16} /> Download QR
                        </button>
                        <button
                          onClick={() => shareVisitorPass(qrData.visitor?._id || qrData._id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 md:px-4 rounded-lg transition flex items-center justify-center gap-2 shadow text-sm"
                        >
                          <Share2 size={16} /> Share
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 p-6 md:p-8 border-2 border-dashed border-gray-300 rounded-xl w-full">
                      <QrCode size={window.innerWidth < 768 ? 48 : 64} className="mx-auto text-gray-300 mb-3 md:mb-4" />
                      <h3 className="text-base md:text-lg font-medium text-gray-600">Visitor QR Pass</h3>
                      <p className="mt-2 text-sm md:text-base">Fill the form to generate a visitor pass QR code</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="p-4 md:p-6">
              {/* Header with Search and Filters */}
              <div className="flex flex-col space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">My Visitor History</h2>
                  <div className="flex items-center gap-2">
                   
                    <button
                      onClick={() => setShowMobileFilters(!showMobileFilters)}
                      className="md:hidden p-2 rounded-lg bg-gray-50 hover:bg-gray-100"
                    >
                      <Filter size={20} />
                    </button>
                  </div>
                </div>

                {/* Mobile Filters */}
                {showMobileFilters && (
                  <div className="md:hidden bg-gray-50 p-4 rounded-lg space-y-3 animate-slideDown">
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        placeholder="Search visitors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2.5 border border-gray-300 rounded-lg">
                      <Calendar className="text-gray-400" size={18} />
                      <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        placeholderText="Filter by date"
                        className="w-full focus:outline-none text-sm"
                        dateFormat="MMM d, yyyy"
                        isClearable
                      />
                    </div>
                  </div>
                )}

                {/* Desktop Search and Filters */}
                <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Search by name or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-300 rounded-lg">
                      <Calendar className="text-gray-400" size={18} />
                      <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        placeholderText="Filter by date"
                        className="w-40 focus:outline-none"
                        dateFormat="MMMM d, yyyy"
                        isClearable
                      />
                    </div>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedDate(null);
                      }}
                      className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredVisitors.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-lg font-medium text-gray-600 mb-2">No visitors found</p>
                  <p className="text-gray-500">
                    {searchTerm || selectedDate
                      ? "Try adjusting your search or filters"
                      : "Start by inviting your first visitor"}
                  </p>
                  {!searchTerm && !selectedDate && (
                    <button
                      onClick={() => setActiveTab("invite")}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
                    >
                      <UserPlus size={16} /> Invite Visitor
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Visitor Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Visit Information
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Timings
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredVisitors.map((visitor) => (
                          <tr key={visitor._id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              {editingVisitor === visitor._id ? (
                                <input
                                  type="text"
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                  className="w-full p-2 border rounded"
                                />
                              ) : (
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="text-blue-600" size={18} />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{visitor.name || "Unknown"}</div>
                                    <div className="text-sm text-gray-500">{visitor.phone || "-"}</div>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {editingVisitor === visitor._id ? (
                                <select
                                  value={editForm.purpose}
                                  onChange={(e) => setEditForm({...editForm, purpose: e.target.value})}
                                  className="w-full p-2 border rounded"
                                >
                                  <option value="Guest">Guest</option>
                                  <option value="Delivery">Delivery</option>
                                  <option value="Service">Service</option>
                                  <option value="Maintenance">Maintenance</option>
                                  <option value="Business">Business</option>
                                  <option value="Other">Other</option>
                                </select>
                              ) : (
                                <>
                                  <div className="text-sm text-gray-900 font-medium">{visitor.purpose || "Not specified"}</div>
                                  <div className="mt-1 flex gap-1">
                                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                                      visitor.is_pre_registered ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                                    }`}>
                                      {visitor.is_pre_registered ? "Pre-registered" : "Walk-in"}
                                    </span>
                                    {visitor.expected_arrival && (
                                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800 items-center gap-1">
                                        <Clock size={12} /> {formatTime(visitor.expected_arrival)}
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                  visitor.entry_status
                                )}`}
                              >
                                {getStatusText(visitor.entry_status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {visitor.entry_time ? (
                                  <>
                                    <div className="flex items-center gap-1">
                                      <ArrowRightCircle size={14} className="text-green-500" />
                                      {formatTime(visitor.entry_time)}
                                    </div>
                                    {visitor.exit_time && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <ArrowLeftCircle size={14} className="text-blue-500" />
                                        {formatTime(visitor.exit_time)}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="text-gray-400">No entry recorded</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {editingVisitor === visitor._id ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={updateVisitor}
                                    className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm px-3 py-1 bg-green-50 rounded-lg"
                                  >
                                    <Save size={16} /> Save
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm px-3 py-1 bg-red-50 rounded-lg"
                                  >
                                    <X size={16} /> Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => startEditing(visitor)}
                                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                                    >
                                      <Edit size={16} /> Edit
                                    </button>
                                    {visitor.qr_code && (
                                      <button
                                        onClick={() => downloadQRCode(visitor._id)}
                                        className="text-purple-600 hover:text-purple-800 flex items-center gap-1 text-sm"
                                      >
                                        <Download size={16} /> QR
                                      </button>
                                    )}
                                    <button
                                      onClick={() => viewVisitorLogs(visitor._id)}
                                      className="text-gray-600 hover:text-gray-800 flex items-center gap-1 text-sm"
                                    >
                                      <History size={16} /> Logs
                                    </button>
                                  </div>
                                  {visitor.is_pre_registered && (
                                    <button
                                      onClick={() => resendVisitorSMS(visitor._id)}
                                      className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm"
                                      disabled={isSending}
                                    >
                                      <MessageSquare size={16} /> Resend SMS
                                    </button>
                                  )}
                                  {visitor.entry_status === "pending" && (
                                    <div className="flex gap-2 mt-1">
                                      <button
                                        onClick={() => approveVisitor(visitor._id)}
                                        className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm"
                                      >
                                        <CheckCircle size={16} /> Approve
                                      </button>
                                      <button
                                        onClick={() => denyVisitor(visitor._id)}
                                        className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
                                      >
                                        <XCircle size={16} /> Deny
                                      </button>
                                    </div>
                                  )}
                                  {["granted", "checked_in"].includes(visitor.entry_status) && (
                                    <button
                                      onClick={() => exitVisitor(visitor._id)}
                                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                                    >
                                      <ArrowLeftCircle size={16} /> Record Exit
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile/Tablet Card View */}
                  <div className="lg:hidden space-y-4">
                    {filteredVisitors.map((visitor) => (
                      <div key={visitor._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
                        {/* Visitor Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="text-blue-600" size={20} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{visitor.name || "Unknown"}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Phone size={14} className="text-gray-400" />
                                <span className="text-sm text-gray-600">{visitor.phone || "-"}</span>
                              </div>
                            </div>
                          </div>
                          <MobileActionsDropdown visitor={visitor} />
                        </div>

                        {/* Visitor Details */}
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Purpose</p>
                            <p className="text-sm font-medium text-gray-900">{visitor.purpose || "Not specified"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(visitor.entry_status)}`}>
                              {getStatusText(visitor.entry_status)}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Entry Time</p>
                            <div className="flex items-center gap-1">
                              <ArrowRightCircle size={14} className="text-green-500" />
                              <span className="text-sm">{formatTime(visitor.entry_time) || "-"}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Exit Time</p>
                            <div className="flex items-center gap-1">
                              <ArrowLeftCircle size={14} className="text-blue-500" />
                              <span className="text-sm">{formatTime(visitor.exit_time) || "-"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Type Badge */}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            visitor.is_pre_registered ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {visitor.is_pre_registered ? "Pre-registered" : "Walk-in"}
                          </span>
                          {visitor.expected_arrival && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={12} /> {formatTime(visitor.expected_arrival)}
                            </span>
                          )}
                        </div>

                        {/* Editing Mode */}
                        {editingVisitor === visitor._id && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                className="w-full p-2 border rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Purpose</label>
                              <select
                                value={editForm.purpose}
                                onChange={(e) => setEditForm({...editForm, purpose: e.target.value})}
                                className="w-full p-2 border rounded text-sm"
                              >
                                <option value="Guest">Guest</option>
                                <option value="Delivery">Delivery</option>
                                <option value="Service">Service</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Business">Business</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={updateVisitor}
                                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Results Count */}
                  <div className="mt-6 text-center text-sm text-gray-500">
                    Showing {filteredVisitors.length} of {visitors.length} visitors
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Visitor Logs Modal - Responsive */}
      {selectedVisitorLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md md:max-w-2xl max-h-[90vh] md:max-h-[80vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">Visitor Log History</h3>
                <button
                  onClick={() => setSelectedVisitorLogs(null)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-3">
                {selectedVisitorLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No log history available</p>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {selectedVisitorLogs.map((log, index) => (
                      <div key={index} className="py-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 text-sm md:text-base">
                              {getActionText(log.action)} • {getRoleText(log.role)}
                            </p>
                            <p className="text-xs md:text-sm text-gray-500 mt-1">
                              {formatDateTime(log.timestamp)}
                            </p>
                            {log.performed_by?.name && (
                              <p className="text-xs md:text-sm text-gray-600 mt-1">
                                By: {log.performed_by.name}
                              </p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ml-2 ${
                            log.action === 'entry' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {getActionText(log.action)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentVisitorManagement;