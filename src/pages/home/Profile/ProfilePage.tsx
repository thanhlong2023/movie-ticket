import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../../contexts/AuthContext";
import { authService } from "../../../services/authService";
import { toast } from "react-toastify";
import type { User } from "../../../types";

// Helper for Cloudinary Widget
interface CloudinaryWidget {
  open: () => void;
}

interface CloudinaryResult {
  event: string;
  info: {
    secure_url: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface Cloudinary {
  createUploadWidget: (
    options: Record<string, unknown>,
    callback: (error: unknown, result: CloudinaryResult) => void
  ) => CloudinaryWidget;
}

declare global {
  interface Window {
    cloudinary: Cloudinary;
  }
}

function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Partial<User>>({
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      birthDate: "",
      gender: "other",
      address: "",
      avatar: "",
    },
  });

  const avatarUrl = watch("avatar");

  useEffect(() => {
    if (user) {
      setValue("firstName", user.firstName || "");
      setValue("lastName", user.lastName || "");
      setValue("phone", user.phone || user.phoneNumber || "");
      setValue("birthDate", user.birthDate || "");
      setValue("gender", user.gender || "other");
      setValue("address", user.address || "");
      setValue("avatar", user.avatar || "");
    }
  }, [user, setValue]);

  const handleUploadAvatar = () => {
    if (!window.cloudinary) {
      toast.error("Cloudinary widget not loaded");
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: "demo", // Use 'demo' for testing
        uploadPreset: "docs_upload_example_us_preset", // Public preset for demo
        sources: ["local", "url", "camera"],
        multiple: false,
        folder: "user_avatars",
        clientAllowedFormats: ["image"], // Restrict to images
        maxImageFileSize: 2000000, // 2MB limit
      },
      (error: unknown, result: CloudinaryResult) => {
        if (!error && result && result.event === "success") {
          console.log("Upload success:", result.info.secure_url);
          setValue("avatar", result.info.secure_url, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
        } else if (error) {
          console.error("Upload error:", error);
          toast.error("Lỗi upload ảnh. Vui lòng thử URL.");
        }
      }
    );
    widget.open();
  };

  const onSubmit = async (data: Partial<User>) => {
    if (!user) return;
    setLoading(true);
    try {
      await authService.updateProfile(user.id, {
        ...data,
        name: `${data.firstName} ${data.lastName}`,
      });
      // Update context manually or reload
      // The authService updates localStorage, but context state might need refresh.
      // We can force a reload or re-fetch current user.
      // Since context likely reads from localStorage on init or has a setUser, we should ideally use that.
      // But useAuth exposes `login` and `logout`. We can re-call login with the new user object to update state?
      // Or just reload page.

      // Hack/Quick fix for context update:
      // Assuming AuthContext reads from localStorage on mount.
      window.location.reload();

      toast.success("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi cập nhật.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Vui lòng đăng nhập.</div>;

  return (
    <div className="container mt-5 pt-5 mb-5">
      <div className="row">
        {/* Avatar Section */}
        <div className="col-md-4 text-center mb-4">
          <div
            className="rounded-circle overflow-hidden mx-auto mb-3 border border-3 border-danger"
            style={{ width: "200px", height: "200px" }}
          >
            <img
              src={
                avatarUrl ||
                "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"
              }
              alt="Avatar"
              className="w-100 h-100 object-fit-cover"
            />
          </div>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={handleUploadAvatar}
          >
            <i className="bi bi-camera-fill me-2"></i>
            Đổi ảnh đại diện
          </button>

          {/* Fallback URL Input */}
          <div className="mt-3">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Hoặc nhập URL ảnh..."
              value={avatarUrl}
              onChange={(e) => setValue("avatar", e.target.value)}
            />
          </div>
        </div>

        {/* Form Section */}
        <div className="col-md-8">
          <h2 className="mb-4 text-danger fw-bold">Thông tin cá nhân</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Read-only Info */}
            <div className="mb-3">
              <label className="form-label text-muted">Tên tài khoản</label>
              <input
                type="text"
                className="form-control bg-light"
                value={user.userName}
                disabled
              />
            </div>
            <div className="mb-3">
              <label className="form-label text-muted">Email</label>
              <input
                type="email"
                className="form-control bg-light"
                value={user.email}
                disabled
              />
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Họ</label>
                <input
                  type="text"
                  className={`form-control ${
                    errors.firstName ? "is-invalid" : ""
                  }`}
                  {...register("firstName", { required: "Vui lòng nhập họ" })}
                />
                {errors.firstName && (
                  <div className="invalid-feedback">
                    {errors.firstName.message}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Tên</label>
                <input
                  type="text"
                  className={`form-control ${
                    errors.lastName ? "is-invalid" : ""
                  }`}
                  {...register("lastName", { required: "Vui lòng nhập tên" })}
                />
                {errors.lastName && (
                  <div className="invalid-feedback">
                    {errors.lastName.message}
                  </div>
                )}
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Số điện thoại</label>
                <input
                  type="tel"
                  className="form-control"
                  {...register("phone")}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Ngày sinh</label>
                <input
                  type="date"
                  className="form-control"
                  {...register("birthDate")}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Giới tính</label>
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    value="male"
                    {...register("gender")}
                    id="genderMale"
                  />
                  <label className="form-check-label" htmlFor="genderMale">
                    Nam
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    value="female"
                    {...register("gender")}
                    id="genderFemale"
                  />
                  <label className="form-check-label" htmlFor="genderFemale">
                    Nữ
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    value="other"
                    {...register("gender")}
                    id="genderOther"
                  />
                  <label className="form-check-label" htmlFor="genderOther">
                    Khác
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Địa chỉ</label>
              <textarea
                className="form-control"
                rows={2}
                {...register("address")}
              ></textarea>
            </div>

            <div className="d-flex gap-2 justify-content-end mt-4">
              <button
                type="submit"
                className="btn btn-danger px-4 py-2"
                disabled={loading}
              >
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
