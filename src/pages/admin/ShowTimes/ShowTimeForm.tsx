import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../../services/api";
import { useAppDispatch } from "../../../hook/hook";
import {
    createShowtime,
    updateShowtime,
} from "../../../features/showtimeSlice";
import { showNotification } from "../../../features/notificationSlice";

import type { Screen, TheaterType as Theater, Movie } from "../../../types";
import type { ShowTimeFormData } from "./types";
import ShowtimeFormFields from "./components/ShowtimeFormFields";

const ShowtimeForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const dispatch = useAppDispatch();
    const isEditMode = !!id;

    const prefilledTheaterId = searchParams.get("theaterId");
    const prefilledScreenId = searchParams.get("screenId");
    const prefilledLastEndTime = searchParams.get("lastEndTime");

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ShowTimeFormData>();
    const [loading, setLoading] = useState(false);

    const [movies, setMovies] = useState<Movie[]>([]);
    const [theaters, setTheaters] = useState<Theater[]>([]);
    const [allScreens, setAllScreens] = useState<Screen[]>([]);
    const [screens, setScreens] = useState<Screen[]>([]);

    const selectedMovieId = watch("movieId");
    const selectedTheaterId = watch("theaterId");
    const startTime = watch("startTime");

    const fetchShowtimeDetail = useCallback(async () => {
        try {
            const res = await api.get(`/showtimes/${id}`);
            const st = res.data;

            setValue("movieId", st.movieId);
            setValue("theaterId", st.theaterId);
            setValue("startTime", st.startTime);
            setValue("endTime", st.endTime);
            setValue("price", st.price);
            setValue("priceVip", st.priceVip || st.price + 20000);
            setValue("priceCouple", st.priceCouple || st.price * 2);

            setTimeout(() => {
                setValue("screenId", st.screenId);
            }, 500);
        } catch (error) {
            console.error(error);
            dispatch(
                showNotification({
                    message: "Không tải được thông tin lịch chiếu",
                    type: "danger",
                })
            );
        }
    }, [id, setValue, dispatch]);

    useEffect(() => {
        fetchInitialData();
        if (isEditMode) {
            fetchShowtimeDetail();
        }
    }, [id, isEditMode, fetchShowtimeDetail]);

    useEffect(() => {
        if (prefilledTheaterId && theaters.length > 0 && !isEditMode) {
            setValue("theaterId", Number(prefilledTheaterId));
        }
    }, [prefilledTheaterId, theaters, isEditMode, setValue]);

    useEffect(() => {
        if (prefilledScreenId && screens.length > 0 && !isEditMode) {
            setValue("screenId", Number(prefilledScreenId));
        }
    }, [prefilledScreenId, screens, isEditMode, setValue]);

    useEffect(() => {
        if (prefilledLastEndTime && !isEditMode) {
            const lastEnd = new Date(prefilledLastEndTime);

            lastEnd.setMinutes(lastEnd.getMinutes() + 15);

            const year = lastEnd.getFullYear();
            const month = String(lastEnd.getMonth() + 1).padStart(2, "0");
            const day = String(lastEnd.getDate()).padStart(2, "0");
            const hours = String(lastEnd.getHours()).padStart(2, "0");
            const minutes = String(lastEnd.getMinutes()).padStart(2, "0");

            const newStartTime = `${year}-${month}-${day}T${hours}:${minutes}`;
            setValue("startTime", newStartTime);
        }
    }, [prefilledLastEndTime, isEditMode, setValue]);

    const fetchInitialData = async () => {
        try {
            const [moviesRes, theatersRes, screensRes] = await Promise.all([
                api.get("/movies"),
                api.get("/theaters"),
                api.get("/screens"),
            ]);
            setMovies(moviesRes.data);
            setTheaters(theatersRes.data);
            setAllScreens(screensRes.data);
        } catch (error) {
            console.error("Error loading data", error);
        }
    };

    useEffect(() => {
        if (selectedTheaterId) {
            const filtered = allScreens.filter(
                (s) => s.theaterId === Number(selectedTheaterId)
            );
            setScreens(filtered);
        } else {
            setScreens([]);
        }
    }, [selectedTheaterId, allScreens]);

    useEffect(() => {
        if (selectedMovieId && startTime) {
            const movie = movies.find((m) => m.id == selectedMovieId);
            if (movie && movie.duration) {
                const start = new Date(startTime);
                const end = new Date(start.getTime() + movie.duration * 60000);

                const tzOffset = start.getTimezoneOffset() * 60000;
                const localISOTime = new Date(end.getTime() - tzOffset)
                    .toISOString()
                    .slice(0, 16);

                setValue("endTime", localISOTime);
            }
        }
    }, [selectedMovieId, startTime, movies, setValue]);

    const BUFFER_MINUTES = 15;

    const checkTimeConflict = async (
        screenId: number,
        startTime: string,
        endTime: string,
        excludeId?: number
    ): Promise<boolean> => {
        try {
            const response = await api.get(`/showtimes?screenId=${screenId}`);
            const existingShowtimes = response.data;

            const bufferMs = BUFFER_MINUTES * 60 * 1000;
            const newStart = new Date(startTime).getTime();
            const newEnd = new Date(endTime).getTime();

            for (const st of existingShowtimes) {
                if (excludeId && st.id === excludeId) continue;

                const existStart = new Date(st.startTime).getTime();
                const existEnd = new Date(st.endTime).getTime();
                if (
                    newStart < existEnd + bufferMs &&
                    newEnd + bufferMs > existStart
                ) {
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error("Error checking conflict:", error);
            return false;
        }
    };

    const onSubmit = async (data: ShowTimeFormData) => {
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
            setLoading(false);
            return;
        }

        try {
            const hasConflict = await checkTimeConflict(
                Number(data.screenId),
                data.startTime,
                data.endTime,
                isEditMode ? Number(id) : undefined
            );

            if (hasConflict) {
                const screen = screens.find(
                    (s) => s.id === Number(data.screenId)
                );
                dispatch(
                    showNotification({
                        message: `Trùng giờ chiếu! Phòng "${
                            screen?.name || data.screenId
                        }" đã có suất chiếu trong khung giờ này.`,
                        type: "danger",
                    })
                );
                setLoading(false);
                return;
            }

            const payload = {
                movieId: Number(data.movieId),
                screenId: Number(data.screenId),
                theaterId: Number(data.theaterId),
                startTime: data.startTime,
                endTime: data.endTime,
                price: Number(data.price),
                priceVip: Number(data.priceVip),
                priceCouple: Number(data.priceCouple),
                userId: user.id,
            };

            if (isEditMode) {
                await dispatch(
                    updateShowtime({ id: Number(id), data: payload })
                ).unwrap();
            } else {
                await dispatch(createShowtime(payload)).unwrap();
                await api.patch(`/movies/${data.movieId}`, {
                    status: "showing",
                });
            }

            const d = new Date();
            const today = `${d.getFullYear()}-${String(
                d.getMonth() + 1
            ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            navigate(`/admin/show-times?date=${today}&region=all`);
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
                        {isEditMode
                            ? "Cập Nhật Lịch Chiếu"
                            : "Tạo Lịch Chiếu Mới"}
                    </h2>
                    <p className="text-secondary m-0">
                        Sắp xếp thời gian chiếu phim
                    </p>
                </div>
                <button
                    onClick={() => navigate("/admin/show-times")}
                    className="btn btn-outline-secondary px-4"
                >
                    <i className="bi bi-x-lg me-2"></i>Đóng
                </button>
            </div>

            <div className="row justify-content-center">
                <div className="col-lg-10">
                    <div className="card">
                        <div className="card-body p-5">
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="row g-4">
                                    <ShowtimeFormFields
                                        register={register}
                                        errors={errors}
                                        movies={movies}
                                        theaters={theaters}
                                        screens={screens}
                                        selectedTheaterId={selectedTheaterId}
                                    />
                                </div>

                                <div className="d-flex justify-content-end mt-5 pt-3 border-top border-secondary">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate("/admin/show-times")
                                        }
                                        className="btn btn-outline-secondary px-4 me-3"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-red-shadow px-5 py-2 fw-bold"
                                        disabled={loading}
                                    >
                                        {loading
                                            ? "Đang xử lý..."
                                            : isEditMode
                                            ? "Cập Nhật"
                                            : "Lưu Lịch Chiếu"}
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

export default ShowtimeForm;
