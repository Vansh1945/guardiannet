import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  QrCode, CheckCircle, XCircle, Camera, User, Smartphone, Home, AlertCircle,
  Search, Clock, LogOut, List, Info, Loader2, Image as ImageIcon, Shield
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
  const [validationErrors, setValidationErrors] = useState({});
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

  // Validation functions
  const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const validateFlatNo = (flatNo) => {
    return flatNo.trim().length > 0;
  };

  const validateName = (name) => {
    return name.trim().length >= 2;
  };

  // Validate visitor details
  const validateVisitorDetails = () => {
    const errors = {};

    if (!validateName(visitorDetails.name)) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!validatePhone(visitorDetails.phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!validateFlatNo(visitorDetails.flat_no)) {
      errors.flat_no = 'Please enter a flat number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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
        toast.error(response.data.message || 'Failed to load visitor logs', {
          position: 'top-right',
          autoClose: 5000,
        });
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
    setLoading(true);
    try {
      const response = await axios.get(`${API}/visitor/pending`, getAuthHeaders());
      if (response.data.success) {
        setPendingApprovals(response.data.data || []);
      } else {
        toast.error(response.data.message || 'Failed to load pending approvals', {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load pending approvals', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
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

  // Auto-refresh data when tab changes or actions are performed
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchVisitorLogs();
    } else if (activeTab === 'approvals') {
      fetchPendingApprovals();
    }
  }, [activeTab]);

  // Auto-refresh logs every 30 seconds when on logs tab
  useEffect(() => {
    let interval;
    if (activeTab === 'logs') {
      interval = setInterval(() => {
        fetchVisitorLogs();
      }, 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  // Auto-refresh approvals every 30 seconds when on approvals tab
  useEffect(() => {
    let interval;
    if (activeTab === 'approvals') {
      interval = setInterval(() => {
        fetchPendingApprovals();
      }, 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  // Capture image from webcam
  const captureImage = () => {
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        toast.error('Failed to capture image', {
          position: 'top-right',
          autoClose: 3000,
        });
        return;
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
    setValidationErrors({});

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

    if (!validateVisitorDetails()) {
      toast.error('Please fix the errors in the form', {
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
      formData.append('name', visitorDetails.name.trim());
      formData.append('phone', visitorDetails.phone);
      formData.append('flat_no', visitorDetails.flat_no.toUpperCase());
      formData.append('purpose', visitorDetails.purpose.trim() || 'Guest');

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
      fetchPendingApprovals(); // Auto-refresh approvals after sending
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
    setValidationErrors({});

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

      // Auto-refresh logs after exit
      if (activeTab === 'logs') {
        fetchVisitorLogs();
      }

      // Update scan result if in scan tab
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

      // Auto-refresh both approvals and logs
      fetchPendingApprovals();
      fetchVisitorLogs();

      // If in scan tab, show camera for the approved visitor
      if (activeTab === 'scan') {
        setShowCamera(true);
      }
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

      // Auto-refresh both approvals and logs
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
    setValidationErrors({});
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

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
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

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    setShowCamera(true);
  };

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
              <h1 className="text-2xl md:text-3xl font-bold text-primary">Security Visitor Management</h1>
              <p className="text-gray-600 text-sm md:text-base mt-1">Record visitor entries, exits, and manage approvals</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex flex-wrap border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('scan');
                resetForm();
              }}
              className={`flex-1 min-w-[150px] py-3 text-center font-medium flex items-center justify-center gap-2 text-sm md:text-base ${activeTab === 'scan'
                  ? 'text-secondary border-b-2 border-secondary'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <QrCode size={18} /> Scan Visitor
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 min-w-[150px] py-3 text-center font-medium flex items-center justify-center gap-2 text-sm md:text-base ${activeTab === 'logs'
                  ? 'text-secondary border-b-2 border-secondary'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <List size={18} /> Visitor Logs
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex-1 min-w-[150px] py-3 text-center font-medium flex items-center justify-center gap-2 text-sm md:text-base ${activeTab === 'approvals'
                  ? 'text-secondary border-b-2 border-secondary'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <CheckCircle size={18} /> Pending Approvals
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4 md:p-6 lg:p-8">
            {activeTab === 'scan' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {/* Left: QR Scanner and Manual Input */}
                  <div className="space-y-6">
                    {/* QR Code Scanner Section */}
                    <div className="bg-gray-50 rounded-xl p-4 md:p-5">
                      <h2 className="text-lg md:text-xl font-semibold text-primary mb-4 flex items-center gap-2">
                        <QrCode size={20} /> QR Code Scanner
                      </h2>

                      {/* QR Code Input */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter QR Code Data
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={qrCode}
                            onChange={(e) => setQrCode(e.target.value)}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition text-sm"
                            placeholder="Enter QR code (e.g., VISITOR-A101-uuid)"
                            disabled={loading}
                          />
                          <button
                            onClick={handleScan}
                            disabled={loading || !qrCode.trim()}
                            className={`px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm min-w-[100px] ${loading || !qrCode.trim()
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-secondary text-white hover:bg-secondary-dark'
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
                          className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm ${isScanningQR
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-secondary text-white hover:bg-secondary-dark'
                            }`}
                        >
                          {isScanningQR ? 'Stop Camera' : 'Use Webcam Scanner'}
                          <Camera size={16} />
                        </button>
                      </div>

                      {isScanningQR && (
                        <div className="mt-4 border-2 border-gray-300 rounded-lg overflow-hidden">
                          <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            className="w-full h-auto max-h-[300px] object-contain"
                          />
                          <canvas ref={canvasRef} className="hidden" />
                        </div>
                      )}
                    </div>

                    {/* Manual Search Section */}
                    <div className="bg-gray-50 rounded-xl p-4 md:p-5" ref={searchRef}>
                      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                        <Search size={18} /> Search by Name
                      </h3>
                      <div className="relative">
                        <div className="flex flex-col sm:flex-row gap-2 mb-2">
                          <div className="flex-1 relative">
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
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition text-sm"
                              placeholder="Type to search visitor name"
                              disabled={loading}
                            />
                            {showSuggestions && (
                              <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {suggestionsLoading ? (
                                  <li className="px-4 py-3 text-center text-sm text-gray-500 flex items-center justify-center">
                                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                    Loading...
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
                                      className="px-4 py-2.5 cursor-pointer hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0"
                                    >
                                      {suggestion.name}
                                    </li>
                                  ))
                                ) : (
                                  <li className="px-4 py-3 text-sm text-gray-500 text-center">
                                    No matching visitors found
                                  </li>
                                )}
                              </ul>
                            )}
                          </div>
                          <button
                            onClick={() => handleManualSearch()}
                            disabled={loading || !manualName.trim()}
                            className={`px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm min-w-[100px] ${loading || !manualName.trim()
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-secondary text-white hover:bg-secondary-dark'
                              }`}
                          >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Search'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Results and Camera */}
                  <div className="space-y-6">
                    {/* Error Display */}
                    {error && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                        <div className="flex items-start">
                          <AlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" size={20} />
                          <div>
                            <h3 className="font-medium text-red-800 text-sm">Error</h3>
                            <p className="text-red-700 text-sm mt-1">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scan Result Display */}
                    {scanResult && !isUnregisteredFlow && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 md:p-5">
                        <div className="flex items-start gap-3 mb-4">
                          <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={24} />
                          <div>
                            <h3 className="font-semibold text-green-800 text-lg">Valid Visitor</h3>
                            <p className="text-green-700 text-sm mt-1">QR code scanned successfully</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded-lg border border-green-100">
                            <div className="flex items-center gap-2 mb-1">
                              <User size={16} className="text-gray-500" />
                              <span className="text-xs font-medium text-gray-500 uppercase">Name</span>
                            </div>
                            <p className="font-medium text-gray-800">{visitorDetails.name}</p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-green-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Smartphone size={16} className="text-gray-500" />
                              <span className="text-xs font-medium text-gray-500 uppercase">Phone</span>
                            </div>
                            <p className="font-medium text-gray-800">{visitorDetails.phone}</p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-green-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Home size={16} className="text-gray-500" />
                              <span className="text-xs font-medium text-gray-500 uppercase">Flat</span>
                            </div>
                            <p className="font-medium text-gray-800">{visitorDetails.flat_no}</p>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-green-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock size={16} className="text-gray-500" />
                              <span className="text-xs font-medium text-gray-500 uppercase">Status</span>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${visitorDetails.entry_status === 'checked_in'
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
                              }`}>
                              {visitorDetails.entry_status.replace('_', ' ')}
                            </span>
                          </div>

                          {visitorDetails.purpose && (
                            <div className="bg-white p-3 rounded-lg border border-green-100 sm:col-span-2">
                              <div className="flex items-center gap-2 mb-1">
                                <Info size={16} className="text-gray-500" />
                                <span className="text-xs font-medium text-gray-500 uppercase">Purpose</span>
                              </div>
                              <p className="font-medium text-gray-800">{visitorDetails.purpose}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mt-4 pt-4 border-t border-green-200">
                          <div>
                            {visitorDetails.qr_code && (
                              <a
                                href={`${API}/visitor/qr/${visitorDetails.qr_code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-secondary hover:text-secondary-dark text-sm flex items-center gap-1"
                              >
                                <ImageIcon size={14} /> View QR Code
                              </a>
                            )}
                          </div>

                          {['granted', 'checked_in'].includes(visitorDetails.entry_status) && (
                            <button
                              onClick={() => handleExitVisitor(visitorDetails._id)}
                              className="px-4 py-2.5 bg-secondary text-white rounded-lg hover:bg-secondary-dark flex items-center gap-2 text-sm"
                              disabled={loading}
                            >
                              <LogOut size={16} /> Mark Exit
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Camera Section */}
                    {(showCamera || isUnregisteredFlow) && (
                      <div className="bg-gray-50 rounded-xl p-4 md:p-5">
                        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                          <Camera size={18} /> Capture Visitor Image
                        </h3>

                        <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-black">
                          {capturedImage ? (
                            <img
                              src={capturedImage}
                              alt="Captured visitor"
                              className="w-full h-64 object-contain"
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

                        <div className="flex flex-col sm:flex-row gap-3 mt-4">
                          {!capturedImage ? (
                            <button
                              onClick={captureImage}
                              className="flex-1 bg-secondary hover:bg-secondary-dark text-white py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm"
                              disabled={loading}
                            >
                              <Camera size={16} /> Capture Image
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={handleRetakePhoto}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm"
                                disabled={loading}
                              >
                                Retake Photo
                              </button>

                              {isUnregisteredFlow && (
                                <button
                                  onClick={handleSendForApproval}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm"
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

                    {/* Unregistered Visitor Form */}
                    {isUnregisteredFlow && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 md:p-5">
                        <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-2">
                          <Info size={18} /> Unregistered Visitor Details
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Visitor Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={visitorDetails.name}
                              onChange={handleVisitorDetailChange}
                              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-sm ${validationErrors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                              placeholder="Enter visitor name"
                            />
                            {validationErrors.name && (
                              <p className="mt-1 text-xs text-red-600">{validationErrors.name}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              value={visitorDetails.phone}
                              onChange={handleVisitorDetailChange}
                              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-sm ${validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                                }`}
                              placeholder="Enter 10-digit phone number"
                            />
                            {validationErrors.phone && (
                              <p className="mt-1 text-xs text-red-600">{validationErrors.phone}</p>
                            )}
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
                              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-sm ${validationErrors.flat_no ? 'border-red-500' : 'border-gray-300'
                                }`}
                              placeholder="Enter flat number (e.g., A101)"
                            />
                            {validationErrors.flat_no && (
                              <p className="mt-1 text-xs text-red-600">{validationErrors.flat_no}</p>
                            )}
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
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary transition text-sm"
                              placeholder="Enter purpose (e.g., Guest, Delivery)"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                    <List size={20} /> Visitor Logs
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">View and manage visitor entry/exit logs</p>
                </div>

                {logsLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin h-12 w-12 text-secondary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
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
                            <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                              <div className="flex flex-col items-center justify-center">
                                <List size={48} className="text-gray-300 mb-3" />
                                <p className="text-gray-500">No visitor logs found</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          visitorLogs.map((visitor) => (
                            <tr key={visitor._id} className="hover:bg-gray-50">
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-secondary/10 rounded-full flex items-center justify-center">
                                    <User className="text-secondary" size={16} />
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
                                  className={`px-3 py-1 text-xs font-medium rounded-full ${visitor.entry_status === 'checked_in'
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
                                <div className="flex flex-col sm:flex-row gap-2">
                                  {['checked_in', 'granted'].includes(visitor.entry_status) && (
                                    <button
                                      onClick={() => handleExitVisitor(visitor._id)}
                                      className="text-secondary hover:text-secondary-dark flex items-center gap-1 text-sm"
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
                                      className="text-primary hover:text-primary-dark flex items-center gap-1 text-sm"
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
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                    <CheckCircle size={20} /> Pending Approvals
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">Approve or deny visitor access requests</p>
                </div>

                {pendingApprovals.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-500">No pending approvals</h3>
                    <p className="text-gray-400 text-sm mt-1">All visitor requests have been processed</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {pendingApprovals.map((visitor) => (
                      <div key={visitor._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          {visitor.image && (
                            <div className="flex-shrink-0">
                              <img
                                src={visitor.image}
                                alt="Visitor"
                                className="h-20 w-20 md:h-24 md:w-24 object-cover rounded-lg bg-gray-100"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-semibold text-lg text-gray-800">{visitor.name}</h3>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                {visitor.entry_status.replace('_', ' ')}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                              <div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="text-sm font-medium">{visitor.phone}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Flat</p>
                                <p className="text-sm font-medium">{visitor.flat_no}</p>
                              </div>
                              <div className="sm:col-span-2">
                                <p className="text-xs text-gray-500">Purpose</p>
                                <p className="text-sm font-medium">{visitor.purpose || 'Not specified'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
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
    </div>
  );
};

export default SecurityVisitorManagement;