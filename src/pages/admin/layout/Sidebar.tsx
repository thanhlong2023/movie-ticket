import { NavLink, useNavigate } from "react-router-dom";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen = false }: SidebarProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  const menuItems = [
    { path: "/admin", icon: "📊", label: "Tổng quan" },
    { path: "/admin/movies", icon: "🎬", label: "Quản lý Phim" },
    { path: "/admin/show-times", icon: "📅", label: "Lịch chiếu" },
    { path: "/admin/bookings", icon: "🎟️", label: "Đặt vé" },
    { path: "/admin/users", icon: "👥", label: "Người dùng" },
    { path: "/admin/news", icon: "📰", label: "Tin tức" },
    { path: "/admin/promotions", icon: "🎁", label: "Khuyến mãi" },
    { path: "/admin/festival", icon: "🎞️", label: "Liên hoan phim" },
    { path: "/admin/theaters", icon: "🏢", label: "Rạp chiếu" },
  ];

  return (
    <div className={`admin-sidebar ${isOpen ? "show" : ""}`}>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            end={item.path === "/admin"}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.label}</span>
          </NavLink>
        ))}

        <div
          className="nav-item"
          onClick={handleLogout}
          style={{
            cursor: "pointer",
            marginTop: "auto",
            borderTop: "1px solid #1f2833",
          }}
        >
          <span className="nav-icon">🚪</span>
          <span className="nav-text">Quay Lại</span>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
