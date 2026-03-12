import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./auth.css";

interface LoginModalProps {
  onClose: () => void;
  onSwitchToRegister: () => void;
  redirectTo?: string | null;
}

const LoginModal: React.FC<LoginModalProps> = ({
  onClose,
  onSwitchToRegister,
  redirectTo,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    // ... validation logic (keep same)
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Email không hợp lệ";
    if (!password) newErrors.password = "Vui lòng nhập mật khẩu";
    else if (password.length < 6)
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const user = await login(email, password);
        onClose();
        if (user && typeof redirectTo === "string") {
          navigate(redirectTo);
        }
      } catch {
        setErrors({ email: "Email hoặc mật khẩu không đúng" });
      }
    }
  };

  return (
    <div className="modal-layout" id="ContainerLogRegis">
      <div className="blur" onClick={onClose}></div>

      <div className="login-container" id="ContainerLogin">
        <div className="couple">
          <h2 className="text-white">Đăng nhập</h2>
          <span className="close" onClick={onClose}>
            X
          </span>
        </div>

        <form className="login-box" onSubmit={handleSubmit}>
          <label htmlFor="emailLogin" className="text-white">
            Email
          </label>
          <input
            type="email"
            id="emailLogin"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <p className="text-danger">{errors.email}</p>}

          <label htmlFor="passwordLogin" className="text-white">
            Mật khẩu
          </label>
          <div className="input-with-toggle">
            <input
              type={showPassword ? "text" : "password"}
              id="passwordLogin"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
            </button>
          </div>
          {errors.password && <p className="text-danger">{errors.password}</p>}

          <div className="forgot-password">
            <a href="#">Quên mật khẩu?</a>
          </div>

          <button type="submit" className="btn-red-gradient">
            Đăng nhập
          </button>

          <div className="link text-white">
            Bạn chưa có tài khoản?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSwitchToRegister();
              }}
            >
              Đăng ký
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
