import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../../services/api";
import { useAppDispatch } from "../../../hook/hook";
import { createTheater, updateTheater } from "../../../features/theatersSlice";
import { showNotification } from "../../../features/notificationSlice";
import type { RegionType, TheaterInput } from "../../../types/theater";

interface TheaterFormData {
    name: string;
    address: string;
    hotline: string;
    region: string;
}

const TheaterForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const isEditMode = !!id;

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<TheaterFormData>();
    const [loading, setLoading] = useState(false);
    const [regions, setRegions] = useState<RegionType[]>([]);

    useEffect(() => {
        const loadRegions = async () => {
            try {
                const res = await api.get<RegionType[]>("/regions");
                setRegions(res.data);
            } catch (error) {
                console.error("Error loading regions:", error);
            }
        };

        const loadData = async () => {
            try {
                const res = await api.get(`/theaters/${id}`);
                const data = res.data;
                setValue("name", data.name);
                setValue("address", data.address);
                setValue("hotline", data.hotline);
                setValue("region", data.region || "");
            } catch (error) {
                console.error(error);
            }
        };

        loadRegions();
        if (isEditMode) {
            loadData();
        }
    }, [id, isEditMode, setValue]);

    const onSubmit = async (data: TheaterFormData) => {
        setLoading(true);
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;

        if (!user?.id) {
            dispatch(
                showNotification({
                    message: "Vui lòng đăng nhập lại",
                    type: "danger",
                })
            );
            return;
        }

        try {
            const payload: TheaterInput = {
                ...data,
                userId: user.id,
            };

            if (!isEditMode) {
                payload.created_at = new Date().toISOString();
            }

            if (isEditMode) {
                await dispatch(
                    updateTheater({ ...payload, id: Number(id) })
                ).unwrap();
            } else {
                await dispatch(createTheater(payload)).unwrap();
            }
            navigate("/admin/theaters");
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
                        {isEditMode ? "Cập Nhật Rạp" : "Thêm Rạp Mới"}
                    </h2>
                </div>
                <button
                    onClick={() => navigate("/admin/theaters")}
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
                                    <label className="form-label">
                                        Tên rạp
                                    </label>
                                    <input
                                        {...register("name", {
                                            required: "Nhập tên rạp",
                                        })}
                                        className="form-control form-control-lg fw-bold"
                                    />
                                    {errors.name && (
                                        <span className="text-danger small">
                                            {errors.name.message as string}
                                        </span>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="form-label">
                                        Khu vực
                                    </label>
                                    <select
                                        {...register("region", {
                                            required: "Chọn khu vực",
                                        })}
                                        className="form-select"
                                    >
                                        <option value="">
                                            -- Chọn khu vực --
                                        </option>
                                        {regions.map((region) => (
                                            <option
                                                key={region.id}
                                                value={region.slug}
                                            >
                                                {region.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.region && (
                                        <span className="text-danger small">
                                            {errors.region.message as string}
                                        </span>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="form-label">
                                        Địa chỉ
                                    </label>
                                    <input
                                        {...register("address", {
                                            required: "Nhập địa chỉ",
                                        })}
                                        className="form-control"
                                    />
                                    {errors.address && (
                                        <span className="text-danger small">
                                            {errors.address.message as string}
                                        </span>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="form-label">
                                        Số điện thoại liên hệ
                                    </label>
                                    <input
                                        {...register("hotline", {
                                            required: "Nhập số điện thoại",
                                        })}
                                        className="form-control"
                                    />
                                    {errors.hotline && (
                                        <span className="text-danger small">
                                            {errors.hotline.message as string}
                                        </span>
                                    )}
                                </div>

                                <div className="d-flex justify-content-end border-top border-secondary pt-4">
                                    <button
                                        type="submit"
                                        className="btn btn-red-shadow px-5 fw-bold text-light"
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

export default TheaterForm;
