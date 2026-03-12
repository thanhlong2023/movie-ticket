import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./AdminLayout.css";
import { cleanupOldShowtimes } from "../../../services/cleanupService";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    cleanupOldShowtimes();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="admin-layout d-flex flex-column">
      <Header onLogoClick={toggleSidebar} />
      <div className="admin-main">
        {/* Overlay for mobile - click to close */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={closeSidebar}></div>
        )}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
