import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  AlertCircle, 
  Shield, 
  UserCheck, 
  Car,
  Clock,
  Lock,
  Siren,
  UserX,
  QrCode,
  ClipboardList
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useAuth } from "../../Context/AuthContext";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement
);

// Mock data to use when backend is not available
const mockDashboardData = {
  stats: [
    { title: "Active Alerts", value: "5", change: "+2 today" },
    { title: "Visitors Today", value: "24", change: "8 expected" },
    { title: "Vehicles Logged", value: "18", change: "3 deliveries" },
    { title: "Staff On Duty", value: "7", change: "2 on patrol" }
  ],
  visitorChart: {
    hours: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
    counts: [2, 8, 12, 6, 4, 1]
  },
  recentActivities: [
    { id: 1, type: "unauthorized", message: "Unauthorized entry attempt", location: "North Gate", timestamp: new Date() },
    { id: 2, type: "visit", message: "Visitor checked in", location: "Main Entrance", timestamp: new Date(Date.now() - 25*60*1000) }
  ],
  activeAlerts: [
    { id: 1, message: "Fire alarm triggered", location: "East Wing", priority: "high", timestamp: new Date(Date.now() - 2*60*1000) }
  ],
  currentShift: {
    startTime: "7:00 AM",
    endTime: "3:00 PM",
    teamMembers: ["Rajesh", "Amit", "Priya"],
    assignedZones: ["North Gate", "East Wing"]
  }
};

const SecurityDashboard = () => {
  const [dashboardData, setDashboardData] = useState(mockDashboardData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useBackend, setUseBackend] = useState(false);
  
    const { API } = useAuth();
  const authToken = localStorage.getItem('token');

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${authToken}` }
  });

  // Fetch dashboard data from your backend
  const fetchDashboardData = async () => {
    if (!useBackend) {
      setDashboardData(mockDashboardData);
      return;
    }

    try {
      setLoading(true);
      
      
      setDashboardData(mockDashboardData);
      
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
      setDashboardData(mockDashboardData); // Fallback to mock data
    } finally {
      setLoading(false);
    }
  };

 

  const handleLockdown = async () => {
    toast.info("Gate lockdown initiated (demo)");
  };

  const reportIncident = async () => {
    toast.info("Incident reporting would open a form (demo)");
  };

  const logUnauthorizedEntry = async () => {
    toast.success('Unauthorized entry logged (demo)');
  };

  const openScanner = () => {
    toast.info("QR scanner would open (demo)");
  };

  const acknowledgeAlert = async (alertId) => {
    toast.success(`Alert ${alertId} acknowledged (demo)`);
  };

  // Quick actions
  const quickActions = [
    { title: "Gate Lockdown", icon: <Lock size={20} />, action: handleLockdown, color: "bg-red-500 hover:bg-red-600" },
    { title: "Report Incident", icon: <Siren size={20} />, action: reportIncident, color: "bg-yellow-500 hover:bg-yellow-600" },
    { title: "Unauthorized Entry", icon: <UserX size={20} />, action: logUnauthorizedEntry, color: "bg-secondary hover:bg-secondary-dark" },
    { title: "Scan QR Code", icon: <QrCode size={20} />, action: openScanner, color: "bg-primary hover:bg-primary-dark" }
  ];

  // Chart options
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [useBackend]);

  if (loading) {
    return (
      <div className="p-6 bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-primary-dark">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="mt-12">
        {/* Demo mode toggle */}
        <div className="mb-4 p-2 bg-blue-50 rounded-lg flex justify-between items-center">
          <span className="text-sm text-blue-700">
            {useBackend ? "Using backend data" : "Using demo data"}
          </span>
          <button
            onClick={() => setUseBackend(!useBackend)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
          >
            {useBackend ? "Switch to Demo" : "Connect to Backend"}
          </button>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary-dark">Security Dashboard</h1>
          <div className="text-sm text-gray-500 flex items-center">
            <Clock className="mr-2" size={16} />
            Current time: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Emergency Alert Banner */}
        {dashboardData.activeAlerts?.find(a => a.priority === 'high') && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-lg flex items-center">
            <Siren className="mr-3 animate-pulse" />
            <div>
              <p className="font-bold">Emergency Alert: {dashboardData.activeAlerts.find(a => a.priority === 'high').message}</p>
              <p className="text-sm">
                {new Date(dashboardData.activeAlerts.find(a => a.priority === 'high').timestamp).toLocaleTimeString()} • 
                Priority: High
              </p>
            </div>
            <button 
              onClick={() => acknowledgeAlert(dashboardData.activeAlerts.find(a => a.priority === 'high').id)}
              className="ml-auto bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
            >
              Acknowledge
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardData.stats?.map((stat, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-primary-dark mt-2">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                </div>
                <div className="p-3 bg-primary-light/10 rounded-lg">
                  {stat.title.includes('Alert') ? <AlertCircle className="text-red-500" /> :
                   stat.title.includes('Visitor') ? <UserCheck className="text-secondary" /> :
                   stat.title.includes('Vehicle') ? <Car className="text-primary-light" /> :
                   <Shield className="text-primary" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visitors Chart */}
            {dashboardData.visitorChart && (
              <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-primary-dark">Hourly Visitor Traffic</h2>
                  <button className="text-xs text-secondary flex items-center">
                    View logs <ClipboardList size={14} className="ml-1" />
                  </button>
                </div>
                <div className="h-64">
                  <Bar 
                    data={{
                      labels: dashboardData.visitorChart.hours,
                      datasets: [{
                        label: 'Visitors',
                        data: dashboardData.visitorChart.counts,
                        backgroundColor: '#3498DB',
                        borderRadius: 4,
                      }]
                    }} 
                    options={barOptions} 
                  />
                </div>
              </div>
            )}

            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:shadow-xl">
              <h2 className="text-lg font-semibold text-primary-dark mb-4">Recent Security Events</h2>
              <div className="space-y-4">
                {dashboardData.recentActivities?.map(activity => (
                  <div key={activity.id} className="flex items-start pb-3 border-b border-gray-100 last:border-0">
                    <div className={`p-2 rounded-full mr-3 ${
                      activity.type === 'unauthorized' ? "bg-red-100 text-red-500" : "bg-primary-light/10 text-primary"
                    }`}>
                      <AlertCircle size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary-dark">{activity.message}</p>
                      <p className="text-xs text-gray-500">
                        {activity.location} • {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:shadow-xl">
              <h2 className="text-lg font-semibold text-primary-dark mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`p-4 rounded-lg flex flex-col items-center text-center text-white ${action.color} transition-colors`}
                  >
                    <div className="p-2 bg-white/20 rounded-full mb-2">
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium">{action.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Alerts */}
            <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:shadow-xl">
              <h2 className="text-lg font-semibold text-primary-dark mb-4">
                Active Alerts ({dashboardData.activeAlerts?.length || 0})
              </h2>
              <div className="space-y-3">
                {dashboardData.activeAlerts?.map(alert => (
                  <div 
                    key={alert.id} 
                    className={`p-3 rounded-lg border-l-4 ${
                      alert.priority === 'high' ? 'bg-red-50 border-red-500' :
                      alert.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                      'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <p className="text-sm font-medium text-primary-dark">{alert.message}</p>
                    <p className="text-xs text-gray-500 mb-2">
                      {alert.location} • {new Date(alert.timestamp).toLocaleTimeString()} • Priority: {alert.priority}
                    </p>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs bg-secondary text-white px-3 py-1 rounded"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shift Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:shadow-xl">
              <h2 className="text-lg font-semibold text-primary-dark mb-4">Current Shift</h2>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Duration:</span>
                <span className="text-sm font-medium">
                  {dashboardData.currentShift?.startTime || 'N/A'} - {dashboardData.currentShift?.endTime || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Team:</span>
                <span className="text-sm font-medium">
                  {dashboardData.currentShift?.teamMembers?.join(', ') || 'Not assigned'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Zone:</span>
                <span className="text-sm font-medium">
                  {dashboardData.currentShift?.assignedZones?.join(', ') || 'Not assigned'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;