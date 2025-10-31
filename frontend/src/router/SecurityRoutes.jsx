// src/router/SecurityRoutes.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import SecurityLayout from "../components/SecuritySidebar";
import SecurityDashboard from "../pages/Security/SecurityDashboard";
import SecurityVisitorScan  from "../pages/Security/ScanVisitor";
import StaffEntryExit from "../pages/Security/Staff-Worker";
import VehicleEntryExit from "../pages/Security/VehicleEntryExit";
import SecurityProfile from "../pages/Security/SecurityProfile";
import SecurityAlertsDashboard from "../pages/Security/Emergencyhandle";
import SecurityDeliveryManagement from "../pages/Security/ScanDelivery";

const SecurityRoutes = () => {
  return (
    <Routes>
      {/* Use SecurityLayout as parent if you have one */}
      <Route element={<SecurityLayout />}>
        <Route path="security-dashboard" element={<SecurityDashboard />} />
        <Route path="scan-visitor" element={<SecurityVisitorScan  />} />
        <Route path="staff-worker" element={<StaffEntryExit />} />
        <Route path="vehicle-record" element={<VehicleEntryExit />} />
        <Route path="profile" element={<SecurityProfile />} />
        <Route path="emergency" element={<SecurityAlertsDashboard />} />
        <Route path="delivery" element={<SecurityDeliveryManagement />} />


      </Route>
    </Routes>
  );
};

export default SecurityRoutes;