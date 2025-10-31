import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  QrCode, CheckCircle, XCircle, Camera, User, Smartphone, Home, AlertCircle,
  Search, Clock, LogOut, List, Info, Loader2, Image as ImageIcon
} from 'lucide-react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { useAuth } from "../../Context/AuthContext";

// Debounce utility function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

const SecurityVisitorManagement = () => {
  const [activeTab, setActiveTab] = useState('scan');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [visitorDetails, setVisitorDetails] = useState({
    name: '',
    phone: '',
    flat_no: '',
    purpose: ''
  });
  const [manualName, setManualName] = useState('');
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [visitorLogs, setVisitorLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [isUnregisteredFlow, setIsUnregisteredFlow] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const searchRef = useRef(null);
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
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  };

  // Debounced function to fetch name suggestions
  const fetchSuggestions = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setSuggestionsLoading(true);
      try {
        const response = await axios.get(
          `${API}/visitor/search?name=${encodeURIComponent(query)}`,
          getAuthHeaders()
        );

        if (response.data.success) {
          const visitors = response.data.data || [];
          const suggestions = visitors.map((visitor) => ({
            id: visitor._id,
            name: visitor.name,
            qr_code: visitor.qr_code,
          }));
          setSearchSuggestions(suggestions);
          setShowSuggestions(suggestions.length > 0);
        } else {
          setSearchSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSearchSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300),
    [getAuthHeaders]
  );

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSearchSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch visitor logs
  const fetchVisitorLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await axios.get(`${API}/visitor/security/logs`, getAuthHeaders());
      if (response.data.success) {
        setVisitorLogs(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to load visitor logs');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load visitor logs', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLogsLoading(false);
    }
  };

  // Fetch pending approvals
  const fetchPendingApprovals = async () => {
    try {
      const response = await axios.get(`${API}/visitor/pending`, getAuthHeaders());
      if (response.data.success) {
        setPendingApprovals(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Failed to load pending approvals');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load pending approvals', {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  };

  // QR code scanning logic
  const scanQRCode = () => {
    if (!webcamRef.current || !canvasRef.current || !webcamRef.current.video) return;

    const video = webcamRef.current.video;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      setQrCode(code.data);
      setIsScanningQR(false);
      handleScan(code.data);
    }
  };

  useEffect(() => {
    let interval;
    if (isScanningQR) {
      interval = setInterval(scanQRCode, 1000);
    }
    return () => clearInterval(interval);
  }, [isScanningQR]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchVisitorLogs();
    } else if (activeTab === 'approvals') {
      fetchPendingApprovals();
    }
  }, [activeTab]);

  // Capture image from webcam
  const captureImage = () => {
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }
      setCapturedImage(imageSrc);
      setShowCamera(false);
    } catch (err) {
      toast.error('Failed to capture image', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  // Handle QR code scan
  const handleScan = async (code = qrCode) => {
    if (!code.trim()) {
      setError('Please enter a QR code');
      toast.error('Please enter a QR code', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const response = await axios.post(
        `${API}/visitor/scan`,
        { qr_code: code },
        getAuthHeaders()
      );

      if (response.data.success) {
        setScanResult(response.data);
        setVisitorDetails(response.data.data);
        toast.success('QR code scanned successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });
        if (response.data.data.entry_status === 'granted') {
          setShowCamera(true);
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to scan QR code';
      setError(errorMsg);
      toast.error(errorMsg, {
        position: 'top-right',
        autoClose: 5000,
      });
      if (errorMsg.includes('Invalid QR code')) {
        setIsUnregisteredFlow(true);
        setShowCamera(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Convert base64 to blob for file upload
  const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Send unregistered visitor for approval
  const handleSendForApproval = async () => {
    if (!capturedImage) {
      toast.error('Please capture an image first', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    if (!visitorDetails.name || !visitorDetails.phone || !visitorDetails.flat_no) {
      toast.error('Please fill in all required visitor details', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const blob = dataURLtoBlob(capturedImage);
      const imageFile = new File([blob], `visitor_${Date.now()}.jpg`, { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('name', visitorDetails.name);
      formData.append('phone', visitorDetails.phone);
      formData.append('flat_no', visitorDetails.flat_no.toUpperCase());
      formData.append('purpose', visitorDetails.purpose || 'Guest');

      const response = await axios.post(
        `${API}/visitor/capture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.success(response.data.message || 'Visitor details sent for approval', {
        position: 'top-right',
        autoClose: 3000,
      });
      resetForm();
      fetchPendingApprovals();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send for approval', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Search visitor by name
  const handleManualSearch = async (selectedQrCode = null) => {
    const searchValue = selectedQrCode || manualName;
    if (!searchValue.trim()) {
      setError('Please enter or select a name');
      toast.error('Please enter a name', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (selectedQrCode) {
        await handleScan(selectedQrCode);
      } else {
        const response = await axios.get(
          `${API}/visitor/search?name=${encodeURIComponent(searchValue)}`,
          getAuthHeaders()
        );

        if (response.data.success && response.data.data.length > 0) {
          const visitor = response.data.data[0];
          setVisitorDetails(visitor);
          setQrCode(visitor.qr_code);
          setScanResult({ success: true, data: visitor });
          toast.success('Visitor found!', {
            position: 'top-right',
            autoClose: 3000,
          });
          if (visitor.entry_status === 'granted') {
            setShowCamera(true);
          }
        } else {
          toast.info('No visitor found with that name', {
            position: 'top-right',
            autoClose: 3000,
          });
          setIsUnregisteredFlow(true);
          setShowCamera(true);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to search visitor', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
      setShowSuggestions(false);
    }
  };

  // Record visitor exit
  const handleExitVisitor = async (visitorId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/visitor/${visitorId}/exit`, getAuthHeaders());
      toast.success(response.data.message || 'Exit recorded successfully', {
        position: 'top-right',
        autoClose: 3000,
      });
      if (activeTab === 'logs') {
        fetchVisitorLogs();
      }
      if (activeTab === 'scan' && scanResult) {
        setScanResult({
          ...scanResult,
          data: {
            ...scanResult.data,
            entry_status: 'checked_out',
            exit_time: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record exit', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Approve pending visitor
  const handleApproveVisitor = async (visitorId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/visitor/${visitorId}/approve`, getAuthHeaders());
      toast.success(response.data.message || 'Visitor approved successfully', {
        position: 'top-right',
        autoClose: 3000,
      });
      fetchPendingApprovals();
      fetchVisitorLogs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve visitor', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Deny pending visitor
  const handleDenyVisitor = async (visitorId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/visitor/${visitorId}/deny`, getAuthHeaders());
      toast.success(response.data.message || 'Visitor denied successfully', {
        position: 'top-right',
        autoClose: 3000,
      });
      fetchPendingApprovals();
      fetchVisitorLogs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to deny visitor', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form state
  const resetForm = () => {
    setShowCamera(false);
    setCapturedImage(null);
    setQrCode('');
    setManualName('');
    setError(null);
    setScanResult(null);
    setIsScanningQR(false);
    setVisitorDetails({
      name: '',
      phone: '',
      flat_no: '',
      purpose: ''
    });
    setIsUnregisteredFlow(false);
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  // Webcam video constraints
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'environment'
  };

  // Handle visitor detail input changes
  const handleVisitorDetailChange = (e) => {
    const { name, value } = e.target;
    setVisitorDetails((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-10xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-400 text-white p-4 md:p-6">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <QrCode size={28} /> Security Visitor Management
          </h1>
          <p className="mt-1 text-sm md:text-base">Record visitor entries, exits, and manage approvals</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab('scan');
              resetForm();
            }}
            className={`flex-1 py-3 text-center font-medium flex items-center justify-center gap-2 text-sm md:text-base ${
              activeTab === 'scan' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <QrCode size={18} /> Scan Visitor
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-3 text-center font-medium flex items-center justify-center gap-2 text-sm md:text-base ${
              activeTab === 'logs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={18} /> Visitor Logs
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex-1 py-3 text-center font-medium flex items-center justify-center gap-2 text-sm md:text-base ${
              activeTab === 'approvals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckCircle size={18} /> Pending Approvals
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-6">
          {activeTab === 'scan' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: QR Scanner and Manual Input */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <QrCode size={20} /> Visitor Scanner
                  </h2>

                  {/* QR Code Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Enter QR Code Data
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={qrCode}
                        onChange={(e) => setQrCode(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Enter QR code (e.g., VISITOR-A101-uuid)"
                        disabled={loading}
                      />
                      <button
                        onClick={handleScan}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm ${
                          loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Scan'}
                      </button>
                    </div>
                  </div>

                  {/* Webcam Scanner Toggle */}
                  <div>
                    <button
                      onClick={() => {
                        setIsScanningQR(!isScanningQR);
                        if (!isScanningQR) {
                          setShowCamera(false);
                          setCapturedImage(null);
                        }
                      }}
                      className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 text-sm ${
                        isScanningQR ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isScanningQR ? 'Stop Camera' : 'Use Webcam Scanner'}
                      <Camera size={16} />
                    </button>
                  </div>

                  {isScanningQR && (
                    <div className="border-2 border-gray-500 rounded-lg overflow-hidden">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        className="w-full h-auto"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                  )}

                  {/* Manual Search */}
                  <div ref={searchRef}>
                    <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                      <Search size={18} /> Search by Name
                    </h3>
                    <div className="relative flex gap-2">
                      <input
                        type="text"
                        value={manualName}
                        onChange={(e) => {
                          const value = e.target.value;
                          setManualName(value);
                          fetchSuggestions(value);
                        }}
                        onFocus={() => {
                          if (searchSuggestions.length > 0) setShowSuggestions(true);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Type to search visitor name"
                        disabled={loading}
                      />
                      <button
                        onClick={() => handleManualSearch()}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm ${
                          loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Search'}
                      </button>
                      {showSuggestions && (
                        <ul className="absolute z-10 top-12 left-0 w-3/4 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto py-1 mt-2">
                          {suggestionsLoading ? (
                            <li className="px-4 py-2 text-center text-sm text-gray-500">
                              Loading... <Loader2 className="animate-spin h-4 w-4 inline mx-2" />
                            </li>
                          ) : searchSuggestions.length > 0 ? (
                            searchSuggestions.map((suggestion) => (
                              <li
                                key={suggestion.id}
                                onClick={() => {
                                  setManualName(suggestion.name);
                                  setShowSuggestions(false);
                                  handleManualSearch(suggestion.qr_code);
                                }}
                                className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                              >
                                {suggestion.name}
                              </li>
                            ))
                          ) : (
                            <li className="px-4 py-2 text-sm text-gray-500">No matching visitors found</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Unregistered Visitor Form */}
                  {isUnregisteredFlow && (
                    <div className="mt-6 p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
                      <h3 className="text-lg font-medium mb-3 flex items-center gap-2 text-yellow-800">
                        <Info size={18} /> Unregistered Visitor Details
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Visitor Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={visitorDetails.name}
                            onChange={handleVisitorDetailChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Enter visitor name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="phone"
                            value={visitorDetails.phone}
                            onChange={handleVisitorDetailChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Enter 10-digit phone number"
                            pattern="\d{10}"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Flat Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="flat_no"
                            value={visitorDetails.flat_no}
                            onChange={handleVisitorDetailChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Enter flat number (e.g., A101)"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Purpose of Visit
                          </label>
                          <input
                            type="text"
                            name="purpose"
                            value={visitorDetails.purpose}
                            onChange={handleVisitorDetailChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Enter purpose (e.g., Guest, Delivery)"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Results and Camera */}
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="text-red-500 mr-2" size={20} />
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    </div>
                  )}

                  {scanResult && !isUnregisteredFlow && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="text-green-500" size={24} />
                        <div className="flex-1">
                          <h3 className="font-medium text-green-800 text-lg">Valid Visitor</h3>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2">
                              <User size={16} className="text-gray-500" />
                              <span className="font-medium text-sm">Name:</span>
                              <span className="text-sm">{visitorDetails.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Smartphone size={16} className="text-gray-500" />
                              <span className="font-medium text-sm">Phone:</span>
                              <span className="text-sm">{visitorDetails.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Home size={16} className="text-gray-500" />
                              <span className="font-medium text-sm">Flat:</span>
                              <span className="text-sm">{visitorDetails.flat_no}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-gray-500" />
                              <span className="font-medium text-sm">Status:</span>
                              <span
                                className={`px-2 py-1 text-xs rounded-full text-sm ${
                                  visitorDetails.entry_status === 'checked_in'
                                    ? 'bg-green-100 text-green-800'
                                    : visitorDetails.entry_status === 'checked_out'
                                    ? 'bg-blue-100 text-blue-800'
                                    : visitorDetails.entry_status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : visitorDetails.entry_status === 'granted'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : visitorDetails.entry_status === 'denied'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {visitorDetails.entry_status.replace('_', ' ')}
                              </span>
                            </div>
                            {visitorDetails.purpose && (
                              <div className="flex items-center gap-2 col-span-2">
                                <Info size={16} className="text-gray-500" />
                                <span className="font-medium text-sm">Purpose:</span>
                                <span className="text-sm">{visitorDetails.purpose}</span>
                              </div>
                            )}
                          </div>
                          {visitorDetails.qr_code && (
                            <div className="mt-2">
                              <a
                                href={`${API}/visitor/qr/${visitorDetails.qr_code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                              >
                                <ImageIcon size={14} /> View QR Code
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      {['granted', 'checked_in'].includes(visitorDetails.entry_status) && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => handleExitVisitor(visitorDetails._id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                            disabled={loading}
                          >
                            <LogOut size={16} /> Mark Exit
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {(showCamera || isUnregisteredFlow) && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Camera size={18} /> Capture Visitor Image
                      </h3>
                      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                        {capturedImage ? (
                          <img
                            src={capturedImage}
                            alt="Captured visitor"
                            className="w-full h-64 object-contain bg-gray-100"
                          />
                        ) : (
                          <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            className="w-full h-64 object-cover"
                          />
                        )}
                      </div>
                      <div className="flex gap-3">
                        {!capturedImage ? (
                          <button
                            onClick={captureImage}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm"
                            disabled={loading}
                          >
                            <Camera size={16} /> Capture Image
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setCapturedImage(null);
                                setShowCamera(true);
                              }}
                              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm"
                              disabled={loading}
                            >
                              Retake
                            </button>
                            {isUnregisteredFlow && (
                              <button
                                onClick={handleSendForApproval}
                                className="flex-1 bg-green-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm"
                                disabled={loading}
                              >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Send for Approval'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <List size={20} /> Visitor Logs
                </h2>
                <button
                  onClick={fetchVisitorLogs}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                  disabled={logsLoading}
                >
                  {logsLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Refresh'}
                </button>
              </div>

              {logsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Visitor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Flat
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entry Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Exit Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {visitorLogs.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-4 text-center text-gray-500 text-sm">
                            No visitor logs found
                          </td>
                        </tr>
                      ) : (
                        visitorLogs.map((visitor) => (
                          <tr key={visitor._id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="text-blue-600" size={16} />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{visitor.name}</div>
                                  <div className="text-xs text-gray-500">{visitor.purpose || 'Guest'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {visitor.phone}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {visitor.flat_no}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full text-sm ${
                                  visitor.entry_status === 'checked_in'
                                    ? 'bg-green-100 text-green-800'
                                    : visitor.entry_status === 'checked_out'
                                    ? 'bg-blue-100 text-blue-800'
                                    : visitor.entry_status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : visitor.entry_status === 'granted'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : visitor.entry_status === 'denied'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {visitor.entry_status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(visitor.entry_time)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(visitor.exit_time)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-3">
                                {['checked_in', 'granted'].includes(visitor.entry_status) && (
                                  <button
                                    onClick={() => handleExitVisitor(visitor._id)}
                                    className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-sm"
                                    disabled={loading}
                                  >
                                    <LogOut size={14} /> Mark Exit
                                  </button>
                                )}
                                {visitor.image && (
                                  <a
                                    href={visitor.image}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 text-sm"
                                  >
                                    <Camera size={14} /> View Image
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'approvals' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <CheckCircle size={20} /> Pending Approvals
                </h2>
                <button
                  onClick={fetchPendingApprovals}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Refresh'}
                </button>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-sm">
                  No pending approvals
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((visitor) => (
                    <div key={visitor._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        {visitor.image && (
                          <div className="flex-shrink-0">
                            <img
                              src={visitor.image}
                              alt="Visitor"
                              className="h-24 w-24 object-contain rounded-lg bg-gray-100"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{visitor.name}</h3>
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            <div>
                              <span className="text-sm text-gray-500">Phone:</span>
                              <p className="text-sm">{visitor.phone}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Flat:</span>
                              <p className="text-sm">{visitor.flat_no}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Purpose:</span>
                              <p className="text-sm">{visitor.purpose || 'Not specified'}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Status:</span>
                              <span className="text-sm px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                                {visitor.entry_status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button
                          onClick={() => handleDenyVisitor(visitor._id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
                          disabled={loading}
                        >
                          <XCircle size={16} /> Deny
                        </button>
                        <button
                          onClick={() => handleApproveVisitor(visitor._id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                          disabled={loading}
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityVisitorManagement;