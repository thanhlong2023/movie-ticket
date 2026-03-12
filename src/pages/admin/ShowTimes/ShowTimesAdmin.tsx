import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useConfirm } from "../../../hook/useConfirm";
import { useAppDispatch, useAppSelector } from "../../../hook/hook";
import { showNotification } from "../../../features/notificationSlice";
import {
    fetchShowtimes,
    deleteShowtime,
} from "../../../features/showtimeSlice";
import { fetchMovies } from "../../../features/movieSlice";
import { fetchScreens } from "../../../features/screenSlice";
import { fetchTheaters } from "../../../features/theatersSlice";
import { getRegionIcon, getRegionName } from "../../../constants/regions";

import type { EnrichedShowtime, GroupedByScreen } from "./types";
import { isShowtimeDeletable } from "./utils";
import ShowtimeFilters from "./components/ShowtimeFilters";
import TheaterShowtimeGroup from "./components/TheaterShowtimeGroup";

const ShowTimesAdmin = () => {
    const confirm = useConfirm();
    const dispatch = useAppDispatch();
    const [searchParams, setSearchParams] = useSearchParams();

    const { showtimes, loading: stLoading } = useAppSelector(
        (state) => state.showtimes
    );
    const { movies, loading: mLoading } = useAppSelector(
        (state) => state.movies
    );
    const { screens, loading: sLoading } = useAppSelector(
        (state) => state.screens
    );
    const { theaters, loading: tLoading } = useAppSelector(
        (state) => state.theaters
    );

    const loading = stLoading || mLoading || sLoading || tLoading;

    const getTodayString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const [filterDate, setFilterDate] = useState(
        searchParams.get("date") || getTodayString()
    );
    const [filterRegion, setFilterRegion] = useState(
        searchParams.get("region") || "all"
    );
    const [filterTheater, setFilterTheater] = useState(
        searchParams.get("theaterId") || "all"
    );

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    useEffect(() => {
        dispatch(fetchShowtimes());
        dispatch(fetchMovies());
        dispatch(fetchScreens());
        dispatch(fetchTheaters());
    }, [dispatch]);

    useEffect(() => {
        setSelectedIds([]);
    }, [filterDate, filterRegion, filterTheater]);

    const availableTheaters = useMemo(() => {
        return theaters.filter(
            (t) => filterRegion === "all" || t.region === filterRegion
        );
    }, [theaters, filterRegion]);

    useEffect(() => {
        if (filterTheater !== "all") {
            const exists = availableTheaters.find(
                (t) => t.id.toString() === filterTheater
            );
            if (!exists) setFilterTheater("all");
        }
    }, [filterRegion, availableTheaters, filterTheater]);

    useEffect(() => {
        setSearchParams({
            date: filterDate,
            region: filterRegion,
            theaterId: filterTheater,
        });
    }, [filterDate, filterRegion, filterTheater, setSearchParams]);

    const enrichedShowtimes: EnrichedShowtime[] = useMemo(() => {
        if (
            !showtimes.length ||
            !movies.length ||
            !screens.length ||
            !theaters.length
        )
            return [];

        return showtimes.map((item) => {
            const movie = movies.find((m) => m.id == item.movieId);
            const screen = screens.find((s) => s.id == item.screenId);
            const theater = theaters.find(
                (t) =>
                    t.id == item.theaterId ||
                    (screen && t.id == screen.theaterId)
            );
            return { ...item, movie, screen, theater };
        });
    }, [showtimes, movies, screens, theaters]);

    const filteredShowtimes = useMemo(() => {
        const selectedDateObj = new Date(filterDate);
        const nextDay = new Date(selectedDateObj);
        nextDay.setDate(nextDay.getDate() + 1);

        const filtered = enrichedShowtimes.filter((item: EnrichedShowtime) => {
            if (filterRegion !== "all" && item.theater?.region !== filterRegion)
                return false;

            if (
                filterTheater !== "all" &&
                item.theater?.id.toString() !== filterTheater
            )
                return false;

            if (!item.startTime) return false;
            const startTime = new Date(item.startTime);
            const endTime = new Date(item.endTime);

            return (
                item.startTime.startsWith(filterDate) ||
                (startTime < nextDay && endTime > selectedDateObj)
            );
        });

        return filtered.sort(
            (a: EnrichedShowtime, b: EnrichedShowtime) =>
                new Date(a.startTime).getTime() -
                new Date(b.startTime).getTime()
        );
    }, [enrichedShowtimes, filterDate, filterRegion, filterTheater]);

    const allDeletableIds = useMemo(() => {
        return filteredShowtimes
            .filter((st) => isShowtimeDeletable(st.startTime))
            .map((st) => st.id);
    }, [filteredShowtimes]);

    const isAllSelected =
        allDeletableIds.length > 0 &&
        allDeletableIds.every((id) => selectedIds.includes(id));

    const handleDelete = async (id: number) => {
        const confirmed = await confirm({
            title: "Xóa suất chiếu",
            message: "Bạn có chắc chắn muốn xóa suất chiếu này?",
            confirmText: "Xóa",
            cancelText: "Hủy",
        });

        if (confirmed) {
            await dispatch(deleteShowtime(id))
                .unwrap()
                .then(() => {
                    dispatch(
                        showNotification({
                            message: "Xóa suất chiếu thành công!",
                            type: "success",
                        })
                    );
                    setFilterDate(getTodayString());
                    setFilterRegion("all");
                    setFilterTheater("all");
                })
                .catch((error) => {
                    console.error("Error deleting showtime:", error);
                    dispatch(
                        showNotification({
                            message: "Xóa thất bại",
                            type: "danger",
                        })
                    );
                });
        }
    };

    const handleSelect = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleSelectMany = (ids: number[], checked: boolean) => {
        if (checked) {
            const toAdd = ids.filter((id) => !selectedIds.includes(id));
            setSelectedIds((prev) => [...prev, ...toAdd]);
        } else {
            setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        }
    };

    const handleSelectAll = (checked: boolean) => {
        handleSelectMany(allDeletableIds, checked);
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;

        const confirmed = await confirm({
            title: "Xóa nhiều suất chiếu",
            message: `Bạn có chắc chắn muốn xóa ${selectedIds.length} suất chiếu đã chọn?`,
            confirmText: "Xóa tất cả",
            cancelText: "Hủy",
        });

        if (confirmed) {
            let successCount = 0;
            await Promise.all(
                selectedIds.map(async (id) => {
                    try {
                        await dispatch(deleteShowtime(id)).unwrap();
                        successCount++;
                    } catch (e) {
                        console.error(`Failed to delete ${id}`, e);
                    }
                })
            );

            dispatch(
                showNotification({
                    message: `Đã xóa thành công ${successCount}/${selectedIds.length} suất chiếu!`,
                    type: "success",
                })
            );

            setSelectedIds([]);
            setFilterDate(getTodayString());
            setFilterRegion("all");
            setFilterTheater("all");
        }
    };

    const groupedData = useMemo(() => {
        const grouped: GroupedByScreen = {};

        availableTheaters
            .filter(
                (t) =>
                    filterTheater === "all" || t.id.toString() === filterTheater
            )
            .forEach((theater) => {
                const region = theater.region || "other";
                if (!grouped[region]) {
                    grouped[region] = { theaters: {} };
                }

                grouped[region].theaters[theater.id] = {
                    theater,
                    screens: {},
                };

                screens
                    .filter((s) => s.theaterId === theater.id)
                    .forEach((screen) => {
                        grouped[region].theaters[theater.id].screens[
                            screen.id
                        ] = {
                            screen,
                            showtimes: [],
                        };
                    });
            });

        filteredShowtimes.forEach((st: EnrichedShowtime) => {
            const region = st.theater?.region || "other";
            const theaterId = st.theaterId || st.theater?.id;
            const screenId = st.screenId;

            if (!theaterId || !screenId) return;

            if (grouped[region]?.theaters[theaterId]?.screens[screenId]) {
                grouped[region].theaters[theaterId].screens[
                    screenId
                ].showtimes.push(st);
            }
        });
        return grouped;
    }, [availableTheaters, screens, filterTheater, filteredShowtimes]);

    const regionKeys = Object.keys(groupedData).sort();
    const totalShowtimes = filteredShowtimes.length;

    return (
        <div className="container-fluid px-0">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="text-white fw-bold mb-1">
                        Quản lý Lịch chiếu
                    </h2>
                    <p className="text-secondary m-0">
                        Quản lý theo Rạp → Phòng chiếu → Suất chiếu
                    </p>
                </div>
                <div className="d-flex gap-2">
                    {selectedIds.length > 0 && (
                        <button
                            className="btn btn-danger animate__animated animate__fadeIn"
                            onClick={handleDeleteSelected}
                        >
                            <i className="bi bi-trash me-2"></i>
                            Xóa {selectedIds.length} mục
                        </button>
                    )}
                    <Link
                        to="/admin/show-times/new"
                        className="btn btn-red-shadow px-4"
                    >
                        <i className="bi bi-plus-lg me-2"></i>Tạo Lịch Chiếu
                    </Link>
                </div>
            </div>

            <ShowtimeFilters
                filterDate={filterDate}
                setFilterDate={setFilterDate}
                filterRegion={filterRegion}
                setFilterRegion={setFilterRegion}
                filterTheater={filterTheater}
                setFilterTheater={setFilterTheater}
                availableTheaters={availableTheaters}
                totalShowtimes={totalShowtimes}
                isAllSelected={isAllSelected}
                allDeletableCount={allDeletableIds.length}
                handleSelectAll={handleSelectAll}
            />

            {loading ? (
                <div className="text-center py-5 text-white">
                    <div
                        className="spinner-border text-danger"
                        role="status"
                    ></div>
                    <p className="mt-3">Đang tải...</p>
                </div>
            ) : regionKeys.length === 0 ? (
                <div className="card">
                    <div className="card-body text-center py-5">
                        <i
                            className="bi bi-building text-secondary"
                            style={{ fontSize: "3rem" }}
                        ></i>
                        <h5 className="text-white mt-3">
                            Không có suất chiếu nào
                        </h5>
                        <p className="text-secondary">
                            Vui lòng chọn ngày khác hoặc tạo lịch chiếu mới
                        </p>
                    </div>
                </div>
            ) : (
                <div className="d-flex flex-column gap-4">
                    {regionKeys.map((region) => (
                        <div key={region} className="region-group">
                            <h5 className="text-warning fw-bold mb-3 d-flex align-items-center">
                                {getRegionIcon(region)} {getRegionName(region)}
                            </h5>

                            <div className="d-flex flex-column gap-3">
                                {Object.values(
                                    groupedData[region].theaters
                                ).map((item) => (
                                    <TheaterShowtimeGroup
                                        key={item.theater.id}
                                        theater={item.theater}
                                        screensData={item.screens}
                                        onDelete={handleDelete}
                                        filterDate={filterDate}
                                        selectedIds={selectedIds}
                                        onSelect={handleSelect}
                                        onSelectMany={handleSelectMany}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ShowTimesAdmin;
