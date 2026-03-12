import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type {
    Movie,
    TheaterType as Theater,
    ScreenType as Screen,
} from "../../../../types";
import type { ShowTimeFormData } from "../types";

interface ShowtimeFormFieldsProps {
    register: UseFormRegister<ShowTimeFormData>;
    errors: FieldErrors<ShowTimeFormData>;
    movies: Movie[];
    theaters: Theater[];
    screens: Screen[];
    selectedTheaterId?: number;
}

const ShowtimeFormFields = ({
    register,
    errors,
    movies,
    theaters,
    screens,
    selectedTheaterId,
}: ShowtimeFormFieldsProps) => {
    return (
        <>
            <h5 className="mb-4 text-danger text-uppercase fw-bold border-bottom border-secondary pb-2">
                Thông tin chiếu
            </h5>

            <div className="col-12">
                <label className="form-label">Chọn phim</label>
                <select
                    {...register("movieId", {
                        required: "Vui lòng chọn phim",
                    })}
                    className="form-select form-select-lg fw-bold"
                >
                    <option value="">-- Chọn phim --</option>
                    {movies.map((movie) => (
                        <option key={movie.id} value={movie.id}>
                            {movie.title} ({movie.duration} phút)
                        </option>
                    ))}
                </select>
                {errors.movieId && (
                    <span className="text-danger small">
                        {errors.movieId.message as string}
                    </span>
                )}
            </div>

            <div className="col-md-6">
                <label className="form-label">Rạp chiếu</label>
                <select
                    {...register("theaterId", {
                        required: "Chọn rạp",
                    })}
                    className="form-select"
                >
                    <option value="">-- Chọn rạp --</option>
                    {theaters.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="col-md-6">
                <label className="form-label">Phòng chiếu (Screen)</label>
                <select
                    {...register("screenId", {
                        required: "Chọn phòng",
                    })}
                    className="form-select"
                    disabled={!selectedTheaterId}
                >
                    <option value="">-- Chọn phòng --</option>
                    {screens.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name} ({s.type}) - {s.capacity} ghế
                        </option>
                    ))}
                </select>
            </div>

            <div className="col-md-6">
                <label className="form-label">Thời gian bắt đầu</label>
                <input
                    type="datetime-local"
                    {...register("startTime", {
                        required: "Vui lòng chọn thời gian bắt đầu",
                        validate: (value) => {
                            const selectedTime = new Date(value);
                            const now = new Date();
                            if (selectedTime < now) {
                                return "Không thể tạo lịch chiếu với thời gian đã qua";
                            }
                            return true;
                        },
                    })}
                    className="form-control"
                />
                {errors.startTime && (
                    <span className="text-danger small d-block mt-1">
                        {errors.startTime.message as string}
                    </span>
                )}
            </div>

            <div className="col-md-6">
                <label className="form-label">
                    Thời gian kết thúc (Tự động)
                </label>
                <input
                    type="datetime-local"
                    {...register("endTime")}
                    className="form-control bg-secondary text-white"
                    readOnly
                />
                <div className="form-text text-secondary">
                    Tính theo thời lượng phim
                </div>
            </div>

            <div className="col-12">
                <h6 className="text-secondary border-bottom border-secondary mb-3 pb-1">
                    Cấu hình giá vé
                </h6>
                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label text-white">
                            Ghế Thường
                        </label>
                        <div className="input-group">
                            <input
                                type="number"
                                {...register("price", {
                                    required: true,
                                    min: 0,
                                })}
                                className="form-control"
                                defaultValue={50000}
                            />
                            <span className="input-group-text bg-secondary text-white border-secondary">
                                VNĐ
                            </span>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label text-warning">
                            Ghế VIP
                        </label>
                        <div className="input-group">
                            <input
                                type="number"
                                {...register("priceVip", {
                                    required: true,
                                    min: 0,
                                })}
                                className="form-control border-warning text-warning fw-bold bg-dark"
                                defaultValue={70000}
                            />
                            <span className="input-group-text bg-warning text-dark border-warning fw-bold">
                                VNĐ
                            </span>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label text-danger">
                            Ghế Đôi
                        </label>
                        <div className="input-group">
                            <input
                                type="number"
                                {...register("priceCouple", {
                                    required: true,
                                    min: 0,
                                })}
                                className="form-control border-danger text-danger fw-bold bg-dark"
                                defaultValue={120000}
                            />
                            <span className="input-group-text bg-danger text-white border-danger fw-bold">
                                VNĐ
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ShowtimeFormFields;
