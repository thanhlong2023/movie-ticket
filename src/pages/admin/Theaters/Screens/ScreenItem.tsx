import { Link } from "react-router-dom";
import type { Screen } from "../../../../types";

interface ScreenItemProps {
    item: Screen;
    theaterId: string | undefined;
    isBusy: boolean;
    handleDelete: (id: number) => void;
}

function ScreenItem({
    item,
    theaterId,
    isBusy,
    handleDelete,
}: ScreenItemProps) {
    return (
        <tr key={item.id} className="table-item">
            <td className="text-secondary">#{item.id}</td>
            <td>
                <div className="fw-bold text-white">{item.name}</div>
            </td>
            <td>
                <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                    {item.type}
                </span>
            </td>
            <td className="text-white fw-bold">{item.capacity}</td>
            <td className="text-secondary font-monospace">
                {item.rows || "?"} x {item.cols || "?"}
            </td>
            <td>
                {isBusy ? (
                    <span className="badge bg-warning text-dark">
                        <i className="bi bi-clock-history me-1"></i> Đang có
                        lịch
                    </span>
                ) : (
                    <span className="badge bg-success bg-opacity-10 text-success">
                        Sẵn sàng
                    </span>
                )}
            </td>
            <td>
                {isBusy ? (
                    <div className="d-flex gap-2">
                        <Link
                            to={`/admin/theaters/${theaterId}/screens/${item.id}/edit?view=true`}
                            className="btn btn-outline-info"
                            title="Xem cấu hình"
                        >
                            <i className="bi bi-eye"></i>
                        </Link>
                        <button
                            className="btn btn-secondary"
                            disabled
                            title="Phòng đang có lịch chiếu"
                        >
                            <i className="bi bi-gear"></i> Cấu hình
                        </button>
                        <button
                            className="btn btn-secondary"
                            disabled
                            title="Phòng đang có lịch chiếu"
                        >
                            <i className="bi bi-trash"></i>
                        </button>
                    </div>
                ) : (
                    <div className="d-flex gap-2">
                        <Link
                            to={`/admin/theaters/${theaterId}/screens/${item.id}/edit?view=true`}
                            className="btn btn-outline-info"
                            title="Xem cấu hình"
                        >
                            <i className="bi bi-eye"></i>
                        </Link>
                        <Link
                            to={`/admin/theaters/${theaterId}/screens/${item.id}/edit`}
                            className="btn btn-outline-primary"
                            title="Sửa cấu hình"
                        >
                            <i className="bi bi-gear"></i> Cấu hình
                        </Link>
                        <button
                            onClick={() => handleDelete(item.id)}
                            className="btn btn-outline-danger"
                            title="Xóa"
                        >
                            <i className="bi bi-trash"></i>
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
}

export default ScreenItem;
