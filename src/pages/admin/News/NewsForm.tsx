import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../../services/api";
import { useAppDispatch } from "../../../hook/hook";
import { createNews, updateNews } from "../../../features/newsSlice";
import { showNotification } from "../../../features/notificationSlice";

interface NewsFormData {
  title: string;
  date: string;
  description: string;
  image: string;
}

const NewsForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditMode = !!id;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NewsFormData>();
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get(`/news/${id}`);
      const data = res.data;
      setValue("title", data.title);
      setValue("date", data.date);
      setValue("description", data.description);
      if (data.img && Array.isArray(data.img)) {
        setValue("image", data.img[0]); // Simple MVP: Handle 1 image as string input
      }
    } catch (error) {
      console.error(error);
    }
  }, [id, setValue]);

  useEffect(() => {
    if (isEditMode) {
      loadData();
    }
  }, [id, isEditMode, loadData]);

  const onSubmit = async (data: NewsFormData) => {
    setLoading(true);
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user?.id) {
      dispatch(
        showNotification({ message: "Vui lòng đăng nhập lại", type: "danger" })
      );
      return;
    }

    try {
      const payload = {
        ...data,
        img: [data.image], // Convert back to array
        userId: user.id,
      };

      if (isEditMode) {
        await dispatch(updateNews({ id: Number(id), data: payload })).unwrap();
      } else {
        await dispatch(createNews(payload)).unwrap();
      }
      navigate("/admin/news");
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="text-white fw-bold mb-1">
            {isEditMode ? "Cập Nhật Tin Tức" : "Thêm Tin Tức Mới"}
          </h2>
        </div>
        <button
          onClick={() => navigate("/admin/news")}
          className="btn btn-outline-secondary px-4"
        >
          Đóng
        </button>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body p-5">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-4">
                  <label className="form-label">Tiêu đề tin tức</label>
                  <input
                    {...register("title", { required: "Nhập tiêu đề" })}
                    className="form-control form-control-lg fw-bold"
                  />
                  {errors.title && (
                    <span className="text-danger small">
                      {errors.title.message as string}
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label">Ngày đăng</label>
                  <input
                    type="date"
                    {...register("date", { required: true })}
                    className="form-control"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Hình ảnh URL</label>
                  <input
                    {...register("image", { required: true })}
                    className="form-control font-monospace text-secondary"
                    placeholder="https://..."
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Nội dung chi tiết</label>
                  <textarea
                    {...register("description", { required: true })}
                    className="form-control"
                    rows={10}
                  ></textarea>
                </div>

                <div className="d-flex justify-content-end border-top border-secondary pt-4">
                  <button
                    type="submit"
                    className="btn btn-red-shadow px-5 fw-bold"
                    disabled={loading}
                  >
                    {loading ? "Đang lưu..." : "Hoàn tất"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsForm;
