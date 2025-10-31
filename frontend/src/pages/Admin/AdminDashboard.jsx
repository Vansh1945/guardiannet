import { 
  AlertCircle, 
  Calendar, 
  Users, 
  Activity, 
  Shield, 
  UserCheck, 
  Car,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const Dashboard = () => {
  // Sample data
  const stats = [
    { title: "Total Alerts", value: "24", icon: <AlertCircle className="text-secondary" />, change: "+2 today" },
    { title: "Upcoming Events", value: "5", icon: <Calendar className="text-primary-light" />, change: "1 new" },
    { title: "Active Staff", value: "18", icon: <Users className="text-secondary-dark" />, change: "2 on leave" },
    { title: "Pending Approvals", value: "7", icon: <UserCheck className="text-primary" />, change: "3 new" }
  ];

  const recentActivities = [
    { id: 1, action: "New visitor registered", time: "10 mins ago", user: "Flat 201" },
    { id: 2, action: "Security alert resolved", time: "25 mins ago", user: "Guard Rajesh" },
    { id: 3, action: "Event created", time: "1 hour ago", user: "Admin" },
    { id: 4, action: "New staff added", time: "2 hours ago", user: "HR Manager" }
  ];

  const quickLinks = [
    { title: "Manage Alerts", icon: <AlertCircle size={20} />, link: "/admin/alerts" },
    { title: "Create Event", icon: <Calendar size={20} />, link: "/admin/events" },
    { title: "Add Staff", icon: <Users size={20} />, link: "/admin/staff" },
    { title: "View Reports", icon: <Activity size={20} />, link: "/admin/reports" }
  ];

  // Visitor data for bar chart
  const visitorData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Visitors',
        data: [12, 19, 8, 15, 12, 18, 10],
        backgroundColor: '#3498DB',
        borderRadius: 4,
      }
    ]
  };

  // Alert data for pie chart
  const alertData = {
    labels: ['Resolved', 'Pending', 'Critical'],
    datasets: [
      {
        data: [5, 3, 2],
        backgroundColor: ['#2ecc71', '#f39c12', '#e74c3c'],
        borderWidth: 0,
      }
    ]
  };

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

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary-dark">Admin Dashboard</h1>
        <div className="text-sm text-gray-500 flex items-center">
          <Clock className="mr-2" size={16} />
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:-translate-y-1 hover:shadow-xl border-l-4 border-secondary"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-primary-dark mt-2">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
              </div>
              <div className="p-3 bg-primary-light/10 rounded-lg">
                {stat.icon}
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
          <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-primary-dark">Daily Visitor Entries</h2>
              <button className="text-xs text-secondary flex items-center">
                View all <ArrowUpRight size={14} className="ml-1" />
              </button>
            </div>
            <div className="h-64">
              <Bar data={visitorData} options={barOptions} />
            </div>
          </div>

          {/* Security Alerts Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-primary-dark">Security Alerts</h2>
              <button className="text-xs text-secondary flex items-center">
                View all <ArrowUpRight size={14} className="ml-1" />
              </button>
            </div>
            <div className="h-64">
              <Pie data={alertData} options={pieOptions} />
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:shadow-xl">
            <h2 className="text-lg font-semibold text-primary-dark mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex items-start pb-3 border-b border-gray-100 last:border-0">
                  <div className="p-2 bg-primary-light/10 rounded-full mr-3">
                    <Activity size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary-dark">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:shadow-xl">
            <h2 className="text-lg font-semibold text-primary-dark mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.link}
                  className="p-3 bg-primary-light/5 rounded-lg flex flex-col items-center text-center hover:bg-primary-light/10 transition-colors"
                >
                  <div className="p-2 bg-primary-light/10 rounded-full mb-2">
                    {link.icon}
                  </div>
                  <span className="text-sm font-medium text-primary-dark">{link.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Approval Requests */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:shadow-xl">
            <h2 className="text-lg font-semibold text-primary-dark mb-4">Approval Requests (3)</h2>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-primary-dark">New Resident Registration</p>
                <p className="text-xs text-gray-500 mb-2">Flat 305 • Waiting 2 days</p>
                <div className="flex space-x-2">
                  <button className="text-xs bg-secondary text-white px-3 py-1 rounded">Approve</button>
                  <button className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded">Reject</button>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-primary-dark">Vehicle Entry Request</p>
                <p className="text-xs text-gray-500 mb-2">Flat 102 • Today</p>
                <div className="flex space-x-2">
                  <button className="text-xs bg-secondary text-white px-3 py-1 rounded">Approve</button>
                  <button className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded">Reject</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;