function HomeFooter() {
  const links = [
    "Chính sách",
    "Lịch chiếu",
    "Tin tức",
    "Giá vé",
    "Hỏi đáp",
    "Liên hệ",
  ];

  return (
    <footer className="footer-content w-100">
      <nav className="footer-links">
        {links.map((label) => (
          <a key={label} href="#">
            {label}
          </a>
        ))}
      </nav>

      <div className="footer-socials">
        <div className="boba">
          <a href="#" aria-label="Facebook">
            <img src="/public/logos/logo-fb.png" alt="Facebook" />
          </a>
          <a href="#" aria-label="Zalo">
            <img src="/public/logos/logo-zalo.png" alt="Zalo" />
          </a>
          <a href="#" aria-label="YouTube">
            <img src="/public/logos/logo-yt.png" alt="YouTube" />
          </a>
        </div>
        <div className="footer-apps">
          <a
            href="#"
            aria-label="Tải trên Google Play"
            className="footer-badge"
          >
            <img src="/public/logos/logo-play.png" alt="Tải trên Google Play" />
          </a>
          <a href="#" aria-label="Tải trên App Store" className="footer-badge">
            <img src="/public/logos/logo-app.png" alt="Tải trên App Store" />
          </a>
          <a
            href="#"
            aria-label="Đã thông báo Bộ Công Thương"
            className="footer-badge footer-badge--bct"
          >
            <img
              src="/public/logos/logo-ct.png"
              alt="Đã thông báo Bộ Công Thương"
            />
          </a>
        </div>
      </div>

      <div className="footer-text">
        <p>Cơ quan chủ quản: BỘ VĂN HÓA, THỂ THAO VÀ DU LỊCH</p>
        <p>Bản quyền thuộc Trung tâm Chiếu phim Quốc gia.</p>
        <p>
          Giấy phép số: 224/GP- TTĐT ngày 31/8/2010 - Chịu trách nhiệm: Vũ Đức
          Tùng - Giám đốc.
        </p>
        <p>
          Địa chỉ: 87 Láng Hạ, Quận Ba Đình, Tp. Hà Nội - Điện thoại:
          024.35141791
        </p>
        <p>© 2023 By NCC - All rights reserved.</p>
      </div>
    </footer>
  );
}

export default HomeFooter;
