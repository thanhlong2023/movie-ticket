import { Link } from "react-router-dom";
import type { TheaterType } from "../../../types/theater";

interface TheaterItemProps {
    item: TheaterType;
    handleDelete: (id: number) => void;
    getRegionName?: (slug: string) => string;
}

function TheaterItem({ item, handleDelete, getRegionName }: TheaterItemProps) {
    return (
        <tr key={item.id} className="table-item">
            <td className="text-danger fw-bold">#{item.id}</td>
            <td>
                <div className="fw-bold">{item.name}</div>
            </td>
            <td>
                <span
                    className={`badge ${
                        item.region == "ho-chi-minh"
                            ? "btn-red-shadow"
                            : item.region == "ha-noi"
                            ? "btn-blue-shadow"
                            : "btn-gray-shadow"
                    }`}
                >
                    {getRegionName && item.region
                        ? getRegionName(item.region)
                        : item.region || "Chưa xác định"}
                </span>
            </td>
            <td>{item.address}</td>
            <td>{item.hotline}</td>
            <td className="flex gap-2 justify-content-start">
                <Link
                    to={`/admin/theaters/${item.id}/screens`}
                    className="btn btn-secondary text-white"
                    title="Quản lý phòng chiếu"
                >
                    <i className="bi bi-grid-3x3 me-1"></i> Ghế
                </Link>
                <Link
                    to={`/admin/theaters/${item.id}/edit`}
                    className="btn btn-primary"
                >
                    <i className="bi bi-pencil"></i>
                </Link>
                <button
                    onClick={() => handleDelete(item.id)}
                    className="btn btn-danger"
                >
                    <i className="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    );
}

export default TheaterItem;
