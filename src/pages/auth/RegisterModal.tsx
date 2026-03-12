import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/authService";
import { useAppDispatch } from "../../hook/hook";
import { showNotification } from "../../features/notificationSlice";
import "./auth.css";

interface RegisterModalProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  userName: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  userName?: string;
  phoneNumber?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const RegisterModal: React.FC<RegisterModalProps> = ({
  onClose,
  onSwitchToLogin,
}) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    userName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { register } = useAuth();
  const dispatch = useAppDispatch();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const validateForm = () => {
    // ... (validation logic stays same)
    const newErrors: FormErrors = {};

    if (!formData.firstName) newErrors.firstName = "Vui lòng nhập họ";
    if (!formData.lastName) newErrors.lastName = "Vui lòng nhập tên";
    if (!formData.userName) newErrors.userName = "Vui lòng nhập tên tài khoản";

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Vui lòng nhập số điện thoại";
    } else if (!/^[0-9]{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Số điện thoại không hợp lệ";
    }

    if (!formData.email) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else {
      const pwd = formData.password;
      const hasUpper = /[A-Z]/.test(pwd);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
      if (pwd.length < 8 || !hasUpper || !hasSpecial) {
        newErrors.password = "Mật khẩu phải ít nhất 8 ký tự, có 1 chữ hoa và 1 ký tự đặc biệt";
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        // Check if email already exists
        const emailExists = await authService.checkEmailExists(formData.email);
        if (emailExists) {
          setErrors((prev) => ({
            ...prev,
            email: "Email đã tồn tại. Vui lòng dùng email khác.",
          }));
          return;
        }

        // Transform formData to match RegisterData type
        const { confirmPassword, ...registerData } = formData;

        await register(registerData);
        dispatch(
          showNotification({
            message: "Đăng ký thành công!",
            type: "success",
          })
        );
        onSwitchToLogin();
      } catch (err: unknown) {
        console.error(err);
        const errorMessage =
          (err as { response?: { data?: string } }).response?.data ||
          "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";
        // Map common errors to fields if possible, or show alert
        if (typeof errorMessage === "string") {
          dispatch(
            showNotification({
              message: errorMessage,
              type: "danger",
            })
          );
        } else {
          dispatch(
            showNotification({
              message: "Đăng ký thất bại.",
              type: "danger",
            })
          );
        }
      }
    }
  };

  return (
    <div className="modal-layout" id="ContainerLogRegis">
      <div className="blur" onClick={onClose}></div>

      <div className="login-container text-white" id="ContainerRegister">
        <div className="couple">
          <h2>Đăng ký</h2>
          <span className="close" onClick={onClose}>
            X
          </span>
        </div>

        <form className="login-box" onSubmit={handleSubmit}>
          <label>Họ và tên</label>
          <div className="couple">
            <div>
              <input
                type="text"
                placeholder="Họ"
                id="firstName"
                value={formData.firstName}
                onChange={handleChange}
              />
              {errors.firstName && (
                <p className="text-danger">{errors.firstName}</p>
              )}
            </div>
            <div>
              <input
                type="text"
                placeholder="Tên"
                id="lastName"
                value={formData.lastName}
                onChange={handleChange}
              />
              {errors.lastName && (
                <p className="text-danger">{errors.lastName}</p>
              )}
            </div>
          </div>

          <label>Tên tài khoản</label>
          <input
            type="text"
            placeholder="Tên tài khoản"
            id="userName"
            value={formData.userName}
            onChange={handleChange}
          />
          {errors.userName && <p className="text-danger">{errors.userName}</p>}

          <label>Số điện thoại</label>
          <div className="couple">
            <div>
              <input
                type="tel"
                placeholder="Số điện thoại"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
              {errors.phoneNumber && (
                <p className="text-danger">{errors.phoneNumber}</p>
              )}
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                id="email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <p className="text-danger">{errors.email}</p>}
            </div>
          </div>

          <label>Mật khẩu</label>
          <div className="couple">
            <div className="input-with-toggle">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                id="password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
              </button>
              {errors.password && (
                <p className="text-danger">{errors.password}</p>
              )}
            </div>
            <div className="input-with-toggle">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Xác nhận mật khẩu"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
                onClick={() => setShowConfirmPassword((s) => !s)}
              >
                {showConfirmPassword ? <i className="bi bi-eye-slash"></i> : <i className="bi bi-eye"></i>}
              </button>
              {errors.confirmPassword && (
                <p className="text-danger">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <button type="submit" className="btn-red-gradient">
            Đăng ký
          </button>

          <div className="link">
            Bạn đã có tài khoản?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSwitchToLogin();
              }}
            >
              Đăng nhập
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;
