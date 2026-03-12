import { useState, useEffect } from "react";
import HomeNavLink from "../../components/HomeNavLink";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";

interface HomeHeaderProps {
  onRegisterClick: () => void;
  onLoginClick: () => void;
  isScrolled?: boolean;
}

function HomeHeader({
  onLoginClick,
  onRegisterClick,
  isScrolled = false,
}: HomeHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  // Auto-close menu on route change
  useEffect(() => {
    if (menuOpen) {
      setMenuOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Auto-close menu when resizing to desktop view (>1000px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1000 && menuOpen) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [menuOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (dropdownOpen && !target.closest(".dropdown-user")) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  return (
    <>
      <div className={`home-header ${isScrolled ? "glass-effect" : ""}`}>
        <div className="home-header-content flex align-items-center">
          {/* Logo & Text Container */}
          <div
            className="d-flex align-items-center gap-3 logo-container"
            onClick={() => navigate("/home")}
            style={{ cursor: "pointer", zIndex: 1000 }}
          >
            <img
              src="/public/logos/Logo_của_Trung_tâm_Chiếu_phim_Quốc_gia.png"
              alt="NCC Logo"
              style={{
                width: "60px",
                height: "auto",
                objectFit: "contain",
              }}
            />
            <div className="logo-text-container">
              <div className="logo-title-vn">TRUNG TÂM CHIẾU PHIM QUỐC GIA</div>
              <div className="logo-title-en">National Cinema Center</div>
            </div>
          </div>

          {/* Desktop Nav - Centered */}
          <nav
            className={`home-nav-links flex align-items-baseline desktop-only`}
            style={{ margin: "0 auto" }}
          >
            <HomeNavLink to={"/home"} content={"Trang chủ"} end />
            <HomeNavLink to={"/home/calendar"} content={"Lịch chiếu"} />
            <HomeNavLink to={"/home/news"} content={"Tin tức"} />
            <HomeNavLink to={"/home/promotions"} content={"Khuyến mãi"} />
            <HomeNavLink to={"/home/ticket-price"} content={"Giá vé"} />
            <HomeNavLink
              to={"/home/festival"}
              content={"Liên hoan phim, Tuần phim"}
            />
            {isAdmin && <HomeNavLink to={"/admin"} content={"Admin"} />}
          </nav>

          {/* Hamburger Icon (Mobile Only) */}
          <div
            className="menu-icon mobile-only"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ zIndex: 1000, marginLeft: "auto", display: "none" }}
          >
            <span
              style={{
                transform: menuOpen ? "rotate(45deg) translate(5px, 6px)" : "",
              }}
            ></span>
            <span style={{ opacity: menuOpen ? 0 : 1 }}></span>
            <span
              style={{
                transform: menuOpen
                  ? "rotate(-45deg) translate(5px, -6px)"
                  : "",
              }}
            ></span>
          </div>

          {/* Desktop User/Auth */}
          <div className="desktop-auth" style={{ display: "none" }}>
            {" "}
            {/* Handled via CSS media query usually, but simple approach: */}
            {/* This part needs to be hidden on mobile if we moved it into the overlay. 
                  But wait, the original code had it visible on desktop. 
                  I'll add a class desktop-only to the original block. 
                */}
          </div>

          {user ? (
            <div className="dropdown-user desktop-only">
              <button
                className="btn-user d-flex align-items-center gap-2"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="rounded-circle object-fit-cover"
                    style={{ width: "30px", height: "30px" }}
                  />
                ) : (
                  <i className="fa-solid fa-user"></i>
                )}
                {user.firstName} {user.lastName}
                <i className="fa-solid fa-caret-down"></i>
              </button>
              {dropdownOpen && (
                <div className="dropdown-content">
                  <Link
                    to="/home/profile"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    Thông tin cá nhân
                  </Link>
                  <Link
                    to="/home/my-tickets"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    Vé của tôi
                  </Link>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                  >
                    Đăng xuất
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="home-auth-buttons desktop-only">
              <button className="btn-register" onClick={onRegisterClick}>
                Đăng ký
              </button>
              <button className="btn-login" onClick={onLoginClick}>
                Đăng nhập
              </button>
            </div>
          )}
        </div>

        {/* Mobile Overlay Menu */}
        {menuOpen && (
          <div className="mobile-menu-overlay">
            <div className="mobile-menu-links">
              <HomeNavLink
                to={"/home"}
                content={"Trang chủ"}
                end
                onClick={() => setMenuOpen(false)}
              />
              <HomeNavLink
                to={"/home/calendar"}
                content={"Lịch chiếu"}
                onClick={() => setMenuOpen(false)}
              />
              <HomeNavLink
                to={"/home/news"}
                content={"Tin tức"}
                onClick={() => setMenuOpen(false)}
              />
              <HomeNavLink
                to={"/home/promotions"}
                content={"Khuyến mãi"}
                onClick={() => setMenuOpen(false)}
              />
              <HomeNavLink
                to={"/home/ticket-price"}
                content={"Giá vé"}
                onClick={() => setMenuOpen(false)}
              />
              <HomeNavLink
                to={"/home/festival"}
                content={"Liên hoan phim, Tuần phim"}
                onClick={() => setMenuOpen(false)}
              />
              {isAdmin && (
                <HomeNavLink
                  to={"/admin"}
                  content={"Admin"}
                  onClick={() => setMenuOpen(false)}
                />
              )}
            </div>

            {!user ? (
              <div className="mobile-auth-buttons">
                <button
                  className="btn-register"
                  onClick={() => {
                    setMenuOpen(false);
                    onRegisterClick();
                  }}
                >
                  Đăng ký
                </button>
                <button
                  className="btn-login"
                  onClick={() => {
                    setMenuOpen(false);
                    onLoginClick();
                  }}
                >
                  Đăng nhập
                </button>
              </div>
            ) : (
              <div
                className="mobile-menu-links"
                style={{
                  marginTop: "20px",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  paddingTop: "20px",
                }}
              >
                <span style={{ color: "#ef4444", fontWeight: 600 }}>
                  Xin chào, {user.firstName}
                </span>
                <Link
                  to="/home/my-tickets"
                  onClick={() => setMenuOpen(false)}
                  style={{ color: "white", textDecoration: "none" }}
                >
                  Vé của tôi
                </Link>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  Đăng xuất
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default HomeHeader;
