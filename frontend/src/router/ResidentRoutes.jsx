// src/router/ResidentRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import ResidentLayout from "../components/ResidentSidebar";
import ResidentDashboard from "../pages/Resident/ResidentDashboard";
import ProfileEdit from "../pages/Resident/Profileedit";
import ResidentVisitor from "../pages/Resident/VisitorRegister";
import Delivery from "../pages/Resident/Delivery";
import EmergencyAlert from "../pages/Resident/Emergency";
import ResidentEvents from "../pages/Resident/Events";
import ResidentStaff from "../pages/Resident/ResidentStaff";
import ResidentVehicle from "../pages/Resident/ResidentVechile";
import ResidentLogs from "../pages/Resident/ResidentLogs";

const ResidentRoutes = () => {
  return (
    <Routes>
      <Route element={<ResidentLayout />}>
        <Route path="resident-dashboard" element={<ResidentDashboard />} />
        <Route path="resident-profile" element={<ProfileEdit />} />
        <Route path="resident-visitor" element={<ResidentVisitor />} />
        <Route path="resident-delivery" element={<Delivery />} />
        <Route path="resident-emergency" element={<EmergencyAlert />} />
        <Route path="resident-events" element={<ResidentEvents />} />
        <Route path="resident-staff" element={<ResidentStaff />} />
        <Route path="resident-vehicle" element={<ResidentVehicle />} />
        <Route path="resident-logs" element={<ResidentLogs />} />
      </Route>
    </Routes>
  );
};

export default ResidentRoutes;