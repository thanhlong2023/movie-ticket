import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PaginationControls from "../../../../components/PaginationControls";
import type {
    TheaterType as Theater,
    ScreenType as Screen,
} from "../../../../types";
import type { EnrichedShowtime } from "../types";
import { formatTime, getScreenTypeColor, isShowtimeDeletable } from "../utils";

interface TheaterShowtimeGroupProps {
    theater: Theater;
    screensData: {
        [screenId: number]: {
            screen: Screen;
            showtimes: EnrichedShowtime[];
        };
    };
    onDelete: (id: number) => void;
    filterDate: string;
    selectedIds: number[];
    onSelect: (id: number) => void;
    onSelectMany: (ids: number[], checked: boolean) => void;
}

const TheaterShowtimeGroup = ({
    theater,
    screensData,
    onDelete,
    filterDate,
    selectedIds,
    onSelect,
    onSelectMany,
}: TheaterShowtimeGroupProps) => {
    const navigate = useNavigate();
    const screenIds = Object.keys(screensData);

    // Find the maximum number of showtimes in any screen to determine total pages
    const maxShowtimes = useMemo(() => {
        if (screenIds.length === 0) return 0;
        return Math.max(
            ...Object.values(screensData).map((d) => d.showtimes.length)
        );
    }, [screensData, screenIds]);

    // Collect all deletable showtimes for this theater
    const theaterDeletableIds = useMemo(() => {
        const ids: number[] = [];
        Object.values(screensData).forEach((s) => {
            s.showtimes.forEach((st) => {
                if (isShowtimeDeletable(st.startTime)) ids.push(st.id);
            });
        });
        return ids;
    }, [screensData]);

    const isTheaterSelected =
        theaterDeletableIds.length > 0 &&
        theaterDeletableIds.every((id) => selectedIds.includes(id));

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; // 5 showtimes per room per page

    return (
        <div className="card">
            {/* Theater Header */}
            <div className="card-header d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                    {theaterDeletableIds.length > 0 && (
                        <input
                            type="checkbox"
                            className="form-check-input bg-dark border-secondary me-3 p-2"
                            checked={isTheaterSelected}
                            onChange={(e) =>
                                onSelectMany(
                                    theaterDeletableIds,
                                    e.target.checked
                                )
                            }
                            title="Chọn tất cả rạp này"
                            style={{ cursor: "pointer" }}
                        />
                    )}
                    <i className="bi bi-building me-2 text-danger fs-5"></i>
                    <h5 className="mb-0 text-white fw-bold">{theater.name}</h5>
                    <span className="badge bg-secondary ms-2">
                        {screenIds.length} phòng
                    </span>
                </div>
                <div className="text-secondary small">
                    Trang {currentPage} (5 suất/phòng)
                </div>
            </div>

            {/* Screens Grid */}
            <div className="card-body">
                {screenIds.length === 0 ? (
                    <div className="text-center text-secondary py-3">
                        <i className="bi bi-display me-2"></i>Chưa có phòng
                        chiếu
                    </div>
                ) : (
                    <>
                        <div className="row g-3">
                            {screenIds.map((screenId) => {
                                const screenData =
                                    screensData[Number(screenId)];
                                const screen = screenData.screen;
                                const allShowtimes = screenData.showtimes;

                                // Collect deletable IDs for this screen
                                const screenDeletableIds = allShowtimes
                                    .filter((st) =>
                                        isShowtimeDeletable(st.startTime)
                                    )
                                    .map((st) => st.id);
                                const isScreenSelected =
                                    screenDeletableIds.length > 0 &&
                                    screenDeletableIds.every((id) =>
                                        selectedIds.includes(id)
                                    );

                                // Sort showtimes by start time
                                allShowtimes.sort(
                                    (a, b) =>
                                        new Date(a.startTime).getTime() -
                                        new Date(b.startTime).getTime()
                                );

                                // Slice showtimes for current page
                                const indexOfLastItem =
                                    currentPage * itemsPerPage;
                                const indexOfFirstItem =
                                    indexOfLastItem - itemsPerPage;
                                const currentShowtimes = allShowtimes.slice(
                                    indexOfFirstItem,
                                    indexOfLastItem
                                );

                                return (
                                    <div
                                        key={screenId}
                                        className="col-md-6 col-lg-4"
                                    >
                                        <div
                                            className="p-3 rounded h-100"
                                            style={{
                                                background:
                                                    "rgba(255,255,255,0.03)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                            }}
                                        >
                                            {/* Screen Header */}
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div className="d-flex align-items-center">
                                                    {screenDeletableIds.length >
                                                        0 && (
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input bg-dark border-secondary me-2"
                                                            checked={
                                                                isScreenSelected
                                                            }
                                                            onChange={(e) =>
                                                                onSelectMany(
                                                                    screenDeletableIds,
                                                                    e.target
                                                                        .checked
                                                                )
                                                            }
                                                            title="Chọn tất cả phòng này"
                                                            style={{
                                                                cursor: "pointer",
                                                            }}
                                                        />
                                                    )}
                                                    <i className="bi bi-display me-2 text-info"></i>
                                                    <span className="text-white fw-bold">
                                                        {screen.name}
                                                    </span>
                                                    <span
                                                        className={`badge ${getScreenTypeColor(
                                                            screen.type
                                                        )} ms-2`}
                                                    >
                                                        {screen.type}
                                                    </span>
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <small className="text-secondary">
                                                        {allShowtimes.length}{" "}
                                                        suất
                                                    </small>
                                                    <button
                                                        className="btn btn-outline-success btn-sm py-0 px-1"
                                                        onClick={() => {
                                                            const lastShowtime =
                                                                allShowtimes.length >
                                                                0
                                                                    ? [
                                                                          ...allShowtimes,
                                                                      ].sort(
                                                                          (
                                                                              a,
                                                                              b
                                                                          ) =>
                                                                              new Date(
                                                                                  b.endTime
                                                                              ).getTime() -
                                                                              new Date(
                                                                                  a.endTime
                                                                              ).getTime()
                                                                      )[0]
                                                                    : null;
                                                            const params =
                                                                new URLSearchParams(
                                                                    {
                                                                        theaterId:
                                                                            String(
                                                                                theater.id
                                                                            ),
                                                                        screenId:
                                                                            String(
                                                                                screen.id
                                                                            ),
                                                                        date: filterDate,
                                                                    }
                                                                );
                                                            if (lastShowtime)
                                                                params.set(
                                                                    "lastEndTime",
                                                                    lastShowtime.endTime
                                                                );
                                                            navigate(
                                                                `/admin/show-times/new?${params.toString()}`
                                                            );
                                                        }}
                                                        title="Thêm suất chiếu"
                                                    >
                                                        <i className="bi bi-plus-lg"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Showtimes List */}
                                            {currentShowtimes.length === 0 ? (
                                                <div
                                                    className="text-center text-secondary py-3 small rounded"
                                                    style={{
                                                        border:
                                                            allShowtimes.length ===
                                                            0
                                                                ? "1px dashed rgba(255,255,255,0.2)"
                                                                : "none",
                                                        cursor:
                                                            allShowtimes.length ===
                                                            0
                                                                ? "pointer"
                                                                : "default",
                                                        opacity: 0.7,
                                                    }}
                                                    onClick={() => {
                                                        if (
                                                            allShowtimes.length ===
                                                            0
                                                        ) {
                                                            navigate(
                                                                `/admin/show-times/new?theaterId=${theater.id}&screenId=${screen.id}&date=${filterDate}`
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {allShowtimes.length ===
                                                    0 ? (
                                                        <>
                                                            <i className="bi bi-plus-circle me-2"></i>
                                                            Thêm suất chiếu
                                                        </>
                                                    ) : (
                                                        <span className="text-secondary opacity-50 fst-italic">
                                                            ...hết danh sách
                                                            trang này...
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="d-flex flex-column gap-2">
                                                    {currentShowtimes.map(
                                                        (st) => {
                                                            const isDeletable =
                                                                isShowtimeDeletable(
                                                                    st.startTime
                                                                );
                                                            const isSelected =
                                                                selectedIds.includes(
                                                                    st.id
                                                                );
                                                            // Visual feedback: History is faded, Active is bright
                                                            const isPast =
                                                                isDeletable;

                                                            return (
                                                                <div
                                                                    key={st.id}
                                                                    className={`d-flex align-items-center justify-content-between p-2 rounded ${
                                                                        isPast
                                                                            ? "opacity-75"
                                                                            : "opacity-100"
                                                                    }`}
                                                                    style={{
                                                                        background:
                                                                            isSelected
                                                                                ? "rgba(220, 53, 69, 0.25)" // Highlight when selected
                                                                                : isPast
                                                                                ? "rgba(128, 128, 128, 0.1)"
                                                                                : "rgba(255, 255, 255, 0.1)", // Standard Red tint for Active
                                                                        border: isSelected
                                                                            ? "1px solid #dc3545" // Red border when selected
                                                                            : isPast
                                                                            ? "1px solid rgba(128, 128, 128, 0.2)"
                                                                            : "1px solid rgba(229, 9, 20, 0.2)",
                                                                        transition:
                                                                            "all 0.2s",
                                                                    }}
                                                                >
                                                                    <div className="d-flex align-items-center flex-grow-1">
                                                                        {isDeletable && (
                                                                            <div className="me-2">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    className="form-check-input bg-dark border-secondary"
                                                                                    checked={
                                                                                        isSelected
                                                                                    }
                                                                                    onChange={() =>
                                                                                        onSelect(
                                                                                            st.id
                                                                                        )
                                                                                    }
                                                                                    style={{
                                                                                        cursor: "pointer",
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        <div
                                                                            className={`fw-bold me-2 ${
                                                                                isPast
                                                                                    ? "text-secondary"
                                                                                    : "text-warning"
                                                                            }`}
                                                                            style={{
                                                                                minWidth:
                                                                                    "50px",
                                                                            }}
                                                                        >
                                                                            {formatTime(
                                                                                st.startTime
                                                                            )}
                                                                        </div>
                                                                        <div className="d-flex align-items-center">
                                                                            {st
                                                                                .movie
                                                                                ?.image && (
                                                                                <img
                                                                                    src={
                                                                                        st
                                                                                            .movie
                                                                                            .image
                                                                                    }
                                                                                    alt=""
                                                                                    width="25"
                                                                                    height="35"
                                                                                    className={`rounded me-2 object-fit-cover ${
                                                                                        isPast
                                                                                            ? "grayscale"
                                                                                            : ""
                                                                                    }`}
                                                                                    style={
                                                                                        isPast
                                                                                            ? {
                                                                                                  filter: "grayscale(100%)",
                                                                                              }
                                                                                            : {}
                                                                                    }
                                                                                />
                                                                            )}
                                                                            <div
                                                                                className={`small text-truncate ${
                                                                                    isPast
                                                                                        ? "text-secondary"
                                                                                        : "text-white"
                                                                                }`}
                                                                                style={{
                                                                                    maxWidth:
                                                                                        "120px",
                                                                                }}
                                                                                title={
                                                                                    st
                                                                                        .movie
                                                                                        ?.title
                                                                                }
                                                                            >
                                                                                {
                                                                                    st
                                                                                        .movie
                                                                                        ?.title
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="btn-group btn-group-sm">
                                                                        {isDeletable ? (
                                                                            <button
                                                                                className="btn btn-outline-danger py-0 px-2"
                                                                                onClick={() =>
                                                                                    onDelete(
                                                                                        st.id
                                                                                    )
                                                                                }
                                                                                title="Xóa"
                                                                            >
                                                                                <i className="bi bi-trash"></i>
                                                                            </button>
                                                                        ) : (
                                                                            // Restore "Old Interface" look - Disabled Delete Button
                                                                            <button
                                                                                className="btn btn-outline-secondary py-0 px-2 opacity-50"
                                                                                disabled
                                                                                style={{
                                                                                    cursor: "not-allowed",
                                                                                }}
                                                                                title="Không thể sửa/xóa khi đã lên lịch"
                                                                            >
                                                                                <i className="bi bi-trash"></i>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Synchronized Pagination */}
                        {maxShowtimes > itemsPerPage && (
                            <div className="mt-3">
                                <PaginationControls
                                    currentPage={currentPage}
                                    totalItems={maxShowtimes}
                                    pageSize={itemsPerPage}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TheaterShowtimeGroup;
