import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../../../services/api";
import { useConfirm } from "../../../../hook/useConfirm";
import { useAppDispatch } from "../../../../hook/hook";
import { showNotification } from "../../../../features/notificationSlice";

import { createScreen, updateScreen } from "../../../../features/screenSlice";

import type { Seat } from "../../../../types";

export const ScreenForm = () => {
    const { theaterId, screenId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isViewMode = searchParams.get("view") === "true";
    const isEditMode = !!screenId;
    const confirm = useConfirm();
    const dispatch = useAppDispatch();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm();
    const [loading, setLoading] = useState(false);

    const [seats, setSeats] = useState<Seat[]>([]);
    const [selectedTool, setSelectedTool] = useState<
        "standard" | "vip" | "couple" | "maintenance" | "hidden"
    >("standard");
    const [isGridDirty, setIsGridDirty] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [existingScreens, setExistingScreens] = useState<any[]>([]);

    const rowsInput = watch("rows");
    const colsInput = watch("cols");

    const generateOrResizeSeats = useCallback(
        (newRows: number, newCols: number, currentSeats: Seat[]) => {
            const updatedSeats: Seat[] = [];
            const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

            for (let r = 0; r < newRows; r++) {
                for (let idx = 1; idx <= newCols; idx++) {
                    const rowLabel =
                        r < rowLabels.length ? rowLabels[r] : `R${r + 1}`;
                    const existing = currentSeats.find(
                        (s) => s.row === rowLabel && s.col === idx
                    );

                    if (existing) {
                        updatedSeats.push(existing);
                    } else {
                        updatedSeats.push({
                            screenId: Number(screenId) || 0,
                            row: rowLabel,
                            col: idx,
                            code: `${rowLabel}${idx}`,
                            type: "standard",
                            status: "active",
                        });
                    }
                }
            }
            setSeats(updatedSeats);
        },
        [screenId]
    );

    const loadData = useCallback(async () => {
        try {
            const screensRes = await api.get(`/theaters/${theaterId}/screens`);
            setExistingScreens(screensRes.data);

            if (isEditMode) {
                const [screenRes, seatsRes] = await Promise.all([
                    api.get(`/screens/${screenId}`),
                    api.get(`/seats?screenId=${screenId}`),
                ]);
                const data = screenRes.data;
                setValue("name", data.name);
                setValue("type", data.type);
                setValue("rows", data.rows || 10);
                setValue("cols", data.cols || 10);

                if (seatsRes.data.length > 0) {
                    setSeats(seatsRes.data);
                } else {
                    const r = data.rows || 10;
                    const c = data.cols || 10;
                    generateOrResizeSeats(r, c, []);
                }
            } else {
                setValue("rows", 10);
                setValue("cols", 10);
                generateOrResizeSeats(10, 10, []);
            }
        } catch (error) {
            console.error(error);
            dispatch(
                showNotification({ message: "Lỗi tải dữ liệu", type: "danger" })
            );
        }
    }, [
        screenId,
        isEditMode,
        theaterId,
        setValue,
        generateOrResizeSeats,
        dispatch,
    ]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleApplyDimensions = async () => {
        const r = Number(rowsInput);
        const c = Number(colsInput);

        if (!r || !c) return;

        if (r > 20 || c > 20) {
            dispatch(
                showNotification({
                    message: "Kích thước tối đa là 20x20",
                    type: "warning",
                })
            );
            return;
        }

        const confirmed = await confirm({
            title: "Áp dụng kích thước mới",
            message:
                "Áp dụng kích thước mới sẽ vẽ lại sơ đồ. Các ghế nằm ngoài vùng mới sẽ bị xóa. Tiếp tục?",
            confirmText: "Tiếp tục",
            cancelText: "Hủy",
        });

        if (!confirmed) return;

        if (isViewMode) return;

        generateOrResizeSeats(r, c, seats);
        setIsGridDirty(true);
    };

    const handleSeatClick = (index: number) => {
        if (isViewMode) return;

        const newSeats = [...seats];
        const seat = newSeats[index];

        if (selectedTool === "maintenance" || selectedTool === "hidden") {
            seat.status =
                seat.status === selectedTool ? "active" : selectedTool;
        } else {
            seat.type = selectedTool;
            seat.status = "active";
        }
        setSeats(newSeats);
        setIsGridDirty(true);
    };

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const onSubmit = async (data: any) => {
        if (!theaterId) return;

        const nameExists = existingScreens.some(
            (s) =>
                s.name.toLowerCase() === data.name.trim().toLowerCase() &&
                Number(s.id) !== Number(screenId)
        );

        if (nameExists) {
            dispatch(
                showNotification({
                    message: "Tên phòng đã tồn tại trong rạp này!",
                    type: "warning",
                })
            );
            return;
        }

        if (Number(data.rows) > 20 || Number(data.cols) > 20) {
            dispatch(
                showNotification({
                    message: "Số hàng và cột tối đa là 20",
                    type: "warning",
                })
            );
            return;
        }

        setLoading(true);
        try {
            const capacity = seats.filter((s) => s.status !== "hidden").length;

            const payload = {
                ...data,
                theaterId: Number(theaterId),
                rows: Number(data.rows),
                cols: Number(data.cols),
                capacity: capacity,
                seats: seats,
            };

            if (isEditMode && screenId) {
                await dispatch(
                    updateScreen({ id: Number(screenId), data: payload })
                ).unwrap();
            } else {
                await dispatch(createScreen(payload)).unwrap();
            }
            navigate(`/admin/theaters/${theaterId}/screens`);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const renderGrid = () => {
        if (!rowsInput || !colsInput || seats.length === 0)
            return (
                <div className="text-secondary p-5 border border-secondary border-dashed rounded">
                    Đang tải sơ đồ ghế...
                </div>
            );

        const r = Number(rowsInput);
        const c = Number(colsInput);

        const grid = [];
        const rowLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        for (let i = 0; i < r; i++) {
            const rowCells = [];
            const currentRowLabel =
                i < rowLabels.length ? rowLabels[i] : `R${i + 1}`;

            rowCells.push(
                <div
                    key={`label-${i}`}
                    className="text-secondary fw-bold me-3"
                    style={{ width: 20 }}
                >
                    {currentRowLabel}
                </div>
            );

            for (let j = 1; j <= c; j++) {
                const seatIdx = seats.findIndex(
                    (s) => s.row === currentRowLabel && s.col === j
                );
                if (seatIdx === -1) {
                    rowCells.push(
                        <div
                            key={`${i}-${j}`}
                            style={{ width: 40, height: 40, margin: 2 }}
                        ></div>
                    );
                    continue;
                }

                const seat = seats[seatIdx];

                let seatClass = "seat-item";

                if (seat.status === "active") {
                    if (seat.type === "standard") seatClass += " seat-standard";
                    if (seat.type === "vip") seatClass += " seat-vip";
                    if (seat.type === "couple") seatClass += " seat-couple";
                } else if (seat.status === "maintenance") {
                    seatClass += " seat-maintenance";
                } else if (seat.status === "hidden") {
                    seatClass += " seat-hidden";
                }

                rowCells.push(
                    <div
                        key={`${i}-${j}`}
                        className={seatClass}
                        onClick={() => handleSeatClick(seatIdx)}
                        title={`${seat.code} - ${seat.type}`}
                    >
                        {seat.status !== "hidden" && seat.code}
                    </div>
                );
            }
            grid.push(
                <div
                    key={i}
                    className="d-flex align-items-center justify-content-center mb-1"
                >
                    {rowCells}
                </div>
            );
        }
        return (
            <div className="p-4 bg-black rounded border border-secondary d-inline-block text-nowrap">
                {grid}
            </div>
        );
    };

    return (
        <div className="container-fluid px-0">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <div className="text-secondary small mb-1 text-uppercase fw-bold">
                        QUẢN LÝ PHÒNG & GHẾ (All-in-One)
                    </div>
                    <h2 className="text-white fw-bold mb-1">
                        {isViewMode
                            ? "Xem Thông Tin Phòng"
                            : isEditMode
                            ? "Chỉnh Sửa Phòng & Sơ Đồ"
                            : "Thêm Phòng Mới"}
                    </h2>
                </div>
                <button
                    onClick={async () => {
                        if (isGridDirty && !isViewMode) {
                            const confirmed = await confirm({
                                title: "Thay đổi chưa lưu",
                                message:
                                    "Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát?",
                                confirmText: "Thoát",
                                cancelText: "Ở lại",
                            });
                            if (!confirmed) return;
                        }
                        navigate(`/admin/theaters/${theaterId}/screens`);
                    }}
                    className="btn btn-outline-secondary px-4"
                >
                    Đóng
                </button>
            </div>

            <div className="row g-4">
                {/* Left Column: Form & Tools */}
                <div className="col-lg-4">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="d-flex flex-column h-100 gap-3"
                    >
                        {/* 1. Basic Info */}
                        <div className="card">
                            <div className="card-header fw-bold text-info">
                                1. Thông tin phòng
                            </div>
                            <div className="card-body">
                                <div className="mb-3">
                                    <label className="form-label">
                                        Tên phòng
                                    </label>
                                    <input
                                        {...register("name", {
                                            required: true,
                                        })}
                                        className={`form-control fw-bold ${
                                            isViewMode ? "bg-dark" : ""
                                        }`}
                                        placeholder="Phòng 01"
                                        disabled={isViewMode}
                                    />
                                    {errors.name && (
                                        <span className="text-danger small">
                                            Tên phòng là bắt buộc
                                        </span>
                                    )}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">
                                        Loại phòng
                                    </label>
                                    <select
                                        {...register("type")}
                                        className={`form-select ${
                                            isViewMode ? "bg-dark" : ""
                                        }`}
                                        disabled={isViewMode}
                                    >
                                        <option value="2D">
                                            2D Tiêu Chuẩn
                                        </option>
                                        <option value="3D">3D (Kính)</option>
                                        <option value="IMAX">IMAX</option>
                                        <option value="4DX">4DX</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 2. Dimensions */}
                        <div className="card">
                            <div className="card-header fw-bold text-info">
                                2. Kích thước lưới
                            </div>
                            <div className="card-body">
                                <div className="row g-2 mb-3">
                                    <div className="col-6">
                                        <label className="small text-secondary">
                                            Hàng (Rows)
                                        </label>
                                        <input
                                            type="number"
                                            max={20}
                                            {...register("rows", { max: 20 })}
                                            className={`form-control text-center fw-bold ${
                                                isViewMode ? "bg-dark" : ""
                                            }`}
                                            disabled={isViewMode}
                                        />
                                    </div>
                                    <div className="col-6">
                                        <label className="small text-secondary">
                                            Ghế/Hàng (Cols)
                                        </label>
                                        <input
                                            type="number"
                                            max={20}
                                            {...register("cols", { max: 20 })}
                                            className={`form-control text-center fw-bold ${
                                                isViewMode ? "bg-dark" : ""
                                            }`}
                                            disabled={isViewMode}
                                        />
                                    </div>
                                </div>
                                {!isViewMode && (
                                    <button
                                        type="button"
                                        onClick={handleApplyDimensions}
                                        className="btn btn-outline-info w-100 fw-bold"
                                    >
                                        Tái tạo ghế
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 3. Seat Tools */}
                        <div className="card flex-grow-1">
                            <div className="card-header fw-bold text-info">
                                3. Công cụ vẽ ghế
                            </div>
                            <div
                                className="card-body p-2 d-flex flex-column gap-2 overflow-auto"
                                style={{ maxHeight: 300 }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setSelectedTool("standard")}
                                    className={`btn text-start ${
                                        selectedTool === "standard"
                                            ? "btn-secondary"
                                            : "btn-outline-secondary text-white"
                                    }`}
                                >
                                    <div
                                        className="d-inline-block seat-item seat-standard me-2 mb-0"
                                        style={{ width: 20, height: 20 }}
                                    ></div>{" "}
                                    Ghế Thường
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedTool("vip")}
                                    className={`btn text-start ${
                                        selectedTool === "vip"
                                            ? "btn-secondary"
                                            : "btn-outline-secondary text-white"
                                    }`}
                                >
                                    <div
                                        className="d-inline-block seat-item seat-vip me-2 mb-0"
                                        style={{ width: 20, height: 20 }}
                                    ></div>{" "}
                                    Ghế VIP
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedTool("couple")}
                                    className={`btn text-start ${
                                        selectedTool === "couple"
                                            ? "btn-secondary"
                                            : "btn-outline-secondary text-white"
                                    }`}
                                >
                                    <div
                                        className="d-inline-block seat-item seat-couple me-2 mb-0"
                                        style={{ width: 20, height: 20 }}
                                    ></div>{" "}
                                    Ghế Đôi
                                </button>
                                <hr className="my-1 border-secondary" />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedTool("maintenance")
                                    }
                                    className={`btn text-start ${
                                        selectedTool === "maintenance"
                                            ? "btn-secondary"
                                            : "btn-outline-secondary text-white"
                                    }`}
                                >
                                    <div
                                        className="d-inline-block seat-item seat-maintenance me-2 mb-0"
                                        style={{ width: 20, height: 20 }}
                                    ></div>{" "}
                                    Bảo trì / Hỏng
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedTool("hidden")}
                                    className={`btn text-start ${
                                        selectedTool === "hidden"
                                            ? "btn-secondary"
                                            : "btn-outline-secondary text-white"
                                    }`}
                                >
                                    <div
                                        className="d-inline-block border border-secondary me-2"
                                        style={{
                                            width: 16,
                                            height: 16,
                                            visibility: "hidden",
                                        }}
                                    ></div>{" "}
                                    Ẩn (Lối đi)
                                </button>
                            </div>
                        </div>

                        {!isViewMode && (
                            <button
                                type="submit"
                                className="btn btn-red-shadow py-3 fw-bold fs-5"
                                disabled={loading}
                            >
                                {loading ? "Đang Lưu..." : "LƯU TOÀN BỘ"}
                            </button>
                        )}
                    </form>
                </div>

                {/* Right Column: Grid Preview */}
                <div className="col-lg-8">
                    <div className="card h-100 bg-darker">
                        <div className="card-header border-secondary d-flex justify-content-between">
                            <span>Sơ đồ hiển thị (Preview)</span>
                            <small className="text-secondary">
                                Click để sửa từng ghế
                            </small>
                        </div>
                        <div className="card-body d-flex flex-column align-items-center justify-content-center bg-black overflow-auto">
                            {/* Màn hình chiếu ở trên */}
                            <div
                                className="w-75 py-2 mb-4 text-center rounded"
                                style={{
                                    background:
                                        "linear-gradient(to bottom, #3b82f6, #1e40af)",
                                    boxShadow:
                                        "0 4px 20px rgba(59, 130, 246, 0.4)",
                                }}
                            >
                                <span
                                    className="text-white fw-bold text-uppercase"
                                    style={{ letterSpacing: "4px" }}
                                >
                                    Màn hình chiếu
                                </span>
                            </div>
                            {renderGrid()}
                        </div>
                        <div className="card-footer border-secondary text-center text-secondary small">
                            <span className="badge bg-secondary me-2">A</span>{" "}
                            Hàng gần màn hình nhất
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
