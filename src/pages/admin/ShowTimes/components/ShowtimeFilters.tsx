import { REGIONS } from "../../../../constants/regions";
import type { TheaterType as Theater } from "../../../../types";

interface ShowtimeFiltersProps {
    filterDate: string;
    setFilterDate: (date: string) => void;
    filterRegion: string;
    setFilterRegion: (region: string) => void;
    filterTheater: string;
    setFilterTheater: (theaterId: string) => void;
    availableTheaters: Theater[];
    totalShowtimes: number;
    // Selection Props
    isAllSelected: boolean;
    allDeletableCount: number;
    handleSelectAll: (checked: boolean) => void;
}

const ShowtimeFilters = ({
    filterDate,
    setFilterDate,
    filterRegion,
    setFilterRegion,
    filterTheater,
    setFilterTheater,
    availableTheaters,
    totalShowtimes,
    isAllSelected,
    allDeletableCount,
    handleSelectAll,
}: ShowtimeFiltersProps) => {
    return (
        <div className="card mb-4">
            <div className="card-body p-3">
                <div className="row g-3 align-items-center">
                    <div className="col-auto">
                        <label className="form-label mb-0 text-white">
                            <i className="bi bi-calendar3 me-2"></i>Ngày:
                        </label>
                    </div>
                    <div className="col-auto">
                        <input
                            type="date"
                            className="form-control bg-dark text-white border-secondary"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                    </div>

                    {/* Global Select All */}
                    <div className="col-auto ms-3 border-start ps-3 border-secondary">
                        <div className="form-check">
                            <input
                                className="form-check-input bg-dark border-secondary"
                                type="checkbox"
                                id="selectAll"
                                checked={isAllSelected}
                                disabled={allDeletableCount === 0}
                                onChange={(e) =>
                                    handleSelectAll(e.target.checked)
                                }
                                style={{ cursor: "pointer" }}
                            />
                            <label
                                className="form-check-label text-white"
                                htmlFor="selectAll"
                                style={{ cursor: "pointer" }}
                            >
                                Chọn tất cả ({allDeletableCount})
                            </label>
                        </div>
                    </div>

                    <div className="col-auto ms-auto">
                        <label className="form-label mb-0 text-white">
                            <i className="bi bi-geo-alt me-2"></i>Khu vực:
                        </label>
                    </div>
                    <div className="col-auto">
                        <select
                            className="form-select bg-dark text-white border-secondary"
                            value={filterRegion}
                            onChange={(e) => setFilterRegion(e.target.value)}
                        >
                            <option value="all">🌍 Tất cả khu vực</option>
                            {Object.entries(REGIONS).map(([key, value]) => (
                                <option key={key} value={key}>
                                    {value.icon} {value.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Theater Filter */}
                    <div className="col-auto">
                        <label className="form-label mb-0 text-white">
                            <i className="bi bi-building me-2"></i>Rạp:
                        </label>
                    </div>
                    <div className="col-auto">
                        <select
                            className="form-select bg-dark text-white border-secondary"
                            value={filterTheater}
                            onChange={(e) => setFilterTheater(e.target.value)}
                            style={{ maxWidth: "200px" }}
                        >
                            <option value="all">🎬 Tất cả rạp</option>
                            {availableTheaters.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-auto border-start ps-3 border-secondary">
                        <span className="badge bg-info fs-6">
                            {totalShowtimes} suất chiếu
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShowtimeFilters;
