import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../../services/api";
import { useAppDispatch } from "../../../hook/hook";
import {
  createPromotion,
  updatePromotion,
} from "../../../features/promotionSlice";
import { showNotification } from "../../../features/notificationSlice";

interface PromotionFormData {
  title: string;
  date: string;
  description: string;
  image: string;
}

const PromotionsForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditMode = !!id;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PromotionFormData>();
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get(`/promotions/${id}`);
      const data = res.data;
      setValue("title", data.title);
      setValue("date", data.date);
      setValue("description", data.description);
      if (data.img && Array.isArray(data.img)) {
        setValue("image", data.img[0]);
      }
    } catch (error) {
      console.error(error);
    }
  }, [id, setValue]);

  useEffect(() => {
    if (isEditMode) {
      loadData();
    }
  }, [isEditMode, loadData]);

  const onSubmit = async (data: PromotionFormData) => {
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
        img: [data.image],
        userId: user.id,
      };

      if (isEditMode) {
        await dispatch(
          updatePromotion({ id: Number(id), data: payload })
        ).unwrap();
      } else {
        await dispatch(createPromotion(payload)).unwrap();
      }
      navigate("/admin/promotions");
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
            {isEditMode ? "Cập Nhật Khuyến Mãi" : "Thêm Khuyến Mãi Mới"}
          </h2>
        </div>
        <button
          onClick={() => navigate("/admin/promotions")}
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
                  <label className="form-label">Tên chương trình KM</label>
                  <input
                    {...register("title", {
                      required: "Nhập tên chương trình",
                    })}
                    className="form-control form-control-lg fw-bold"
                  />
                  {errors.title && (
                    <span className="text-danger small">
                      {errors.title.message as string}
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label">Thời gian áp dụng</label>
                  <input
                    type="date"
                    {...register("date", { required: true })}
                    className="form-control"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Banner URL</label>
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
                    rows={8}
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

export default PromotionsForm;
