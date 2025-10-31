import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Clock, LogIn, LogOut, User, Home, Eye, EyeOff } from 'lucide-react';
import { useAuth } from "../../Context/AuthContext";

const ResidentLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [selectedPid, setSelectedPid] = useState('');
  const [pidOptions, setPidOptions] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    limit: 50
  });
  const [showFilters, setShowFilters] = useState(false);
    const { API } = useAuth();

  // Fetch user profile to get PIDs
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/profile/get-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setUserProfile(data.user);
        
        // Build PID options array
        const options = [
          {
            value: data.user.permanentId,
            label: `${data.user.name} (Primary - ${data.user.permanentId})`,
            isPrimary: true
          }
        ];
        
        if (data.user.familyMembers && data.user.familyMembers.length > 0) {
          data.user.familyMembers.forEach(member => {
            options.push({
              value: member.permanentId,
              label: `${member.name} (${member.relation} - ${member.permanentId})`,
              isPrimary: false
            });
          });
        }
        
        setPidOptions(options);
        setSelectedPid(data.user.permanentId); // Default to primary resident
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    }
  };

  // Fetch logs based on selected PID and filters
  const fetchLogs = async (pid = selectedPid) => {
    if (!pid) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        ...filters,
        ...(filters.type && { type: filters.type }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        limit: filters.limit.toString()
      });
      
      const response = await fetch(`${API}/profile/logs/${pid}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
      } else {
        setError(data.message || 'Failed to fetch logs');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (selectedPid) {
      fetchLogs();
    }
  }, [selectedPid, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      startDate: '',
      endDate: '',
      limit: 50
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getLogIcon = (type) => {
    return type === 'entry' ? (
      <LogIn className="w-5 h-5 text-green-600" />
    ) : (
      <LogOut className="w-5 h-5 text-red-600" />
    );
  };

  const getLogColor = (type) => {
    return type === 'entry' ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50';
  };



  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Entry/Exit Logs</h1>
          
          {/* PID Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Person
            </label>
            <select
              value={selectedPid}
              onChange={(e) => setSelectedPid(e.target.value)}
              className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {pidOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            
           

            <div className="text-sm text-gray-600">
              Total Logs: {logs.length}
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="entry">Entry</option>
                    <option value="exit">Exit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limit
                  </label>
                  <select
                    value={filters.limit}
                    onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Logs List */}
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No logs found</h3>
              <p className="text-gray-500">
                {selectedPid ? 'No entry/exit logs found for the selected person.' : 'Please select a person to view logs.'}
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log._id}
                className={`bg-white rounded-lg shadow-sm border-l-4 ${getLogColor(log.type)} p-6 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getLogIcon(log.type)}
                    <div>
                      <h3 className="font-semibold text-gray-800 capitalize">
                        {log.type} - {log.personName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        PID: {log.permanentId}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">
                      {formatDate(log.timestamp)}
                    </p>
                   
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Flat: {log.flatNo}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {log.isFamilyMember ? 'Family Member' : 'Primary Resident'}
                    </span>
                  </div>
                  
                  {log.verifiedBy && (
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        Verified by: {log.verifiedBy.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>


      </div>
    </div>
  );
};

export default ResidentLogsView;