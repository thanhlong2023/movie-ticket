import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../../../hook/hook";
import {
  createFestival,
  updateFestival,
  fetchFestivalById,
} from "../../../features/festivalSlice";
import { showNotification } from "../../../features/notificationSlice";

interface FestivalFormData {
  title: string;
  date: string;
  description: string;
  img: string;
}

const FestivalForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditMode = !!id;

  const { festival } = useAppSelector((state) => state.festivals);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FestivalFormData>();

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchFestivalById(Number(id)));
    }
  }, [dispatch, id, isEditMode]);

  useEffect(() => {
    if (festival && isEditMode) {
      setValue("title", festival.title);
      setValue("date", festival.date);
      setValue("description", festival.description);
      setValue("img", festival.img?.[0] || "");
    }
  }, [festival, isEditMode, setValue]);

  const onSubmit = async (data: FestivalFormData) => {
    setSubmitting(true);

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user?.id) {
      dispatch(
        showNotification({
          message: "Vui lòng đăng nhập lại",
          type: "danger",
        })
      );
      setSubmitting(false);
      return;
    }

    const payload = {
      title: data.title,
      date: data.date,
      description: data.description,
      img: data.img ? [data.img] : [],
      userId: user.id,
    };

    try {
      if (isEditMode) {
        await dispatch(
          updateFestival({
            id: Number(id),
            data: payload,
          })
        ).unwrap();
      } else {
        await dispatch(createFestival(payload)).unwrap();
      }

      navigate("/admin/festival");
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="text-white fw-bold mb-1">
            {isEditMode ? "Cập Nhật Sự Kiện" : "Thêm Sự Kiện Mới"}
          </h2>
        </div>
        <button
          onClick={() => navigate("/admin/festival")}
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
                  <label className="form-label">Tên sự kiện</label>
                  <input
                    {...register("title", { required: "Nhập tên sự kiện" })}
                    className="form-control form-control-lg fw-bold"
                  />
                  {errors.title && (
                    <span className="text-danger small">
                      {errors.title.message as string}
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label">Ngày diễn ra</label>
                  <input
                    type="date"
                    {...register("date", { required: true })}
                    className="form-control"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Hình ảnh URL</label>
                  <input
                    {...register("img", { required: true })}
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
                  />
                </div>

                <div className="d-flex justify-content-end border-top border-secondary pt-4">
                  <button
                    type="submit"
                    className="btn btn-red-shadow px-5 fw-bold"
                    disabled={submitting}
                  >
                    {submitting ? "Đang lưu..." : "Hoàn tất"}
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

export default FestivalForm;
