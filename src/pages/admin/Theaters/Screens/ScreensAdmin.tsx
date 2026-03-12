import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../../../services/api";
import { useConfirm } from "../../../../hook/useConfirm";
import { useAppDispatch } from "../../../../hook/hook";
import { showNotification } from "../../../../features/notificationSlice";
import type { TheaterType } from "../../../../types/theater";
import type { Showtime } from "../../../../types/showtime";
import type { Screen } from "../../../../types";
import ScreenTable from "./ScreenTable";
import "../TheatersAdmin.css";

export const ScreensAdmin = () => {
    const { theaterId } = useParams();
    const navigate = useNavigate();
    const confirm = useConfirm();
    const dispatch = useAppDispatch();
    const [screens, setScreens] = useState<Screen[]>([]);
    const [theater, setTheater] = useState<TheaterType | null>(null);
    const [activeShowtimes, setActiveShowtimes] = useState<Showtime[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [theaterRes, screensRes, showtimesRes] =
                    await Promise.all([
                        api.get(`/theaters/${theaterId}`),
                        api.get(`/theaters/${theaterId}/screens`),
                        api.get(`/showtimes`),
                    ]);

                setTheater(theaterRes.data);
                setScreens(screensRes.data);

                const allShowtimes: Showtime[] = showtimesRes.data;
                const now = new Date();
                const active = allShowtimes.filter((st) => {
                    if (Number(st.theaterId) !== Number(theaterId))
                        return false;
                    const endTime = new Date(st.endTime);
                    return endTime > now;
                });
                setActiveShowtimes(active);
            } catch (error) {
                console.error("Error loading data:", error);
                dispatch(
                    showNotification({
                        message: "Không tìm thấy dữ liệu rạp",
                        type: "danger",
                    })
                );
                navigate("/admin/theaters");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [theaterId, dispatch, navigate]);

    const isScreenBusy = (screenId: number) => {
        return activeShowtimes.some((st) => st.screenId === screenId);
    };

    const handleDelete = async (id: number) => {
        if (isScreenBusy(id)) {
            dispatch(
                showNotification({
                    message: "Phòng đang có lịch chiếu, không thể xóa!",
                    type: "warning",
                })
            );
            return;
        }

        const confirmed = await confirm({
            title: "Xóa phòng chiếu",
            message: "Bạn chắc chắn muốn xóa phòng chiếu này?",
            confirmText: "Xóa",
            cancelText: "Hủy",
        });

        if (confirmed) {
            try {
                await api.delete(`/screens/${id}`);
                setScreens(screens.filter((s) => s.id !== id));
                dispatch(
                    showNotification({
                        message: "Xóa phòng chiếu thành công!",
                        type: "success",
                    })
                );
            } catch (error) {
                console.error(error);
                dispatch(
                    showNotification({
                        message: "Xóa thất bại",
                        type: "danger",
                    })
                );
            }
        }
    };

    return (
        <div className="container-fluid px-0">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <div className="flex gap-2 mb-1">
                        <Link
                            to="/admin/theaters"
                            className="text-secondary btn btn-outline-secondary"
                        >
                            <i className="bi bi-arrow-left"></i> Rạp chiếu
                        </Link>

                        <h2 className="text-white fw-bold m-0">
                            {theater?.name} - Danh sách Phòng
                        </h2>
                    </div>
                </div>
                <Link
                    to={`/admin/theaters/${theaterId}/screens/new`}
                    className="btn btn-red-shadow text-light"
                >
                    <i className="bi bi-plus-lg me-2"></i>Thêm Rạp Mới
                </Link>
            </div>

            <div className="card">
                <div className="card-body p-0">
                    <ScreenTable
                        screens={screens}
                        theaterId={theaterId}
                        isScreenBusy={isScreenBusy}
                        handleDelete={handleDelete}
                        loading={loading}
                    />
                </div>
            </div>
        </div>
    );
};
