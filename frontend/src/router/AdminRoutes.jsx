// AdminRoutes.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import Dashboard from "../pages/Admin/AdminDashboard";
import ManageResidents from "../pages/Admin/ManageResidents";
import UserManagement from "../pages/Admin/UsersManagement";
import EmergencyAlertsAdmin from "../pages/Admin/EmergencyView";
import VehicleAdminPanel from "../pages/Admin/VehicleView";
import AdminProfile from "../pages/Admin/Adminprofile";
import EventsManagement from "../pages/Admin/EventsAdd";
import ResidentLogsView from "../pages/Admin/Residentlogs";
import ManageSecurityPage from "../pages/Admin/ManageGuards";

const AdminRoutes = () => {
  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="admin-dashboard" element={<Dashboard />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="manage-residents" element={<ManageResidents />} />
          <Route path="manage-guards" element={<ManageSecurityPage />} />
          <Route path="emergency-view" element={<EmergencyAlertsAdmin />} />
          <Route path="vehicle" element={<VehicleAdminPanel />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="event-add" element={<EventsManagement />} />
          <Route path="resident-logs" element={<ResidentLogsView />} />

        </Routes>
      </div>
    </div>
  );
};

export default AdminRoutes;