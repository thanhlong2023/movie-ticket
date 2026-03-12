import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../hook/hook";
import {
    deleteTheater,
    fetchTheaters,
    fetchRegions,
} from "../../../features/theatersSlice";
import { useConfirm } from "../../../hook/useConfirm";
import TheaterTable from "./TheaterTable";
import "./TheatersAdmin.css";
import api from "../../../services/api";
import { showNotification } from "../../../features/notificationSlice";
import type { Screen, Showtime } from "../../../types";

export const TheatersAdmin = () => {
    const { theaters, regions, loading, error } = useAppSelector(
        (state) => state.theaters
    );
    const dispatch = useAppDispatch();
    const confirm = useConfirm();

    const [searchParams, setSearchParams] = useSearchParams();

    const selectedRegion = searchParams.get("region") || "all";
    const searchKeyword = searchParams.get("search") || "";

    useEffect(() => {
        dispatch(fetchTheaters());
        dispatch(fetchRegions());
    }, [dispatch]);

    const handleDelete = async (id: number) => {
        const theaterToDelete = theaters.find((theater) => theater.id === id);
        if (!theaterToDelete) return;

        try {
            const showtimesRes = await api.get(`/showtimes?theaterId=${id}`);
            const showtimes: Showtime[] = showtimesRes.data;
            const now = new Date();
            const hasActiveShowtimes = showtimes.some(
                (st) => new Date(st.endTime) > now
            );

            if (hasActiveShowtimes) {
                dispatch(
                    showNotification({
                        message:
                            "Rạp đang có lịch chiếu hoạt động, không thể xóa!",
                        type: "warning",
                    })
                );
                return;
            }

            const confirmed = await confirm({
                title: "Xóa rạp chiếu",
                message:
                    "Bạn có chắc chắn muốn xóa rạp này? Hành động này sẽ xóa tất cả phòng chiếu thuộc rạp.",
                confirmText: "Xóa Rạp & Phòng",
                cancelText: "Hủy",
            });

            if (confirmed) {
                const screensRes = await api.get(`/screens?theaterId=${id}`);
                const screens: Screen[] = screensRes.data;

                await Promise.all(
                    screens.map((s) => api.delete(`/screens/${s.id}`))
                );

                await dispatch(deleteTheater(theaterToDelete)).unwrap();
            }
        } catch (error) {
            console.error("Delete failed", error);
            dispatch(
                showNotification({
                    message: "Có lỗi xảy ra khi xóa rạp",
                    type: "danger",
                })
            );
        }
    };

    const filteredTheaters = theaters.filter((theater) => {
        const matchRegion =
            selectedRegion === "all" || theater.region === selectedRegion;

        const matchSearch = theater.name
            .toLowerCase()
            .includes(searchKeyword.toLowerCase());

        return matchRegion && matchSearch;
    });

    const getRegionName = (slug: string) => {
        const region = regions.find((r) => r.slug === slug);
        return region?.name || slug;
    };

    if (loading)
        return (
            <div className="bg-dark p-2 flex text-secondary fw-bold rounded-3">
                Đang tải dữ liệu...
            </div>
        );
    if (error)
        return (
            <div className="bg-dark p-2 flex text-danger fw-bold rounded-3">
                Lỗi tải dữ liệu...
            </div>
        );

    return (
        <div className="stat-card stat-custom">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-start m-0 fs-3">🏢 Quản Lý Rạp Chiếu</h2>
                <Link
                    to="/admin/theaters/new"
                    className="btn btn-red-shadow text-light"
                >
                    <i className="bi bi-plus-lg me-2"></i>Thêm Rạp Mới
                </Link>
            </div>

            <div className="flex gap-3 w-100">
                <input
                    type="text"
                    className="form-control theaters-input"
                    placeholder="Nhập tên rạp..."
                    value={searchKeyword}
                    onChange={(e) => {
                        setSearchParams({
                            region: selectedRegion,
                            search: e.target.value,
                        });
                    }}
                />
                <select
                    className="form-select theaters-select"
                    value={selectedRegion}
                    onChange={(e) => {
                        const value = e.target.value;
                        setSearchParams({
                            region: value,
                            search: "",
                        });
                    }}
                >
                    <option value="all">Tất cả khu vực</option>
                    {regions.map((region) => (
                        <option key={region.id} value={region.slug}>
                            {region.name}
                        </option>
                    ))}
                </select>
            </div>
            <span className="mt-3 flex text-secondary justify-content-end">
                ({filteredTheaters.length} rạp)
            </span>

            <TheaterTable
                theaters={filteredTheaters}
                handleDelete={handleDelete}
                getRegionName={getRegionName}
            />
        </div>
    );
};
