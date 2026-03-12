import type { Screen } from "../../../../types";
import ScreenItem from "./ScreenItem";

interface ScreenTableProps {
    screens: Screen[];
    theaterId: string | undefined;
    isScreenBusy: (id: number) => boolean;
    handleDelete: (id: number) => void;
    loading: boolean;
}

function ScreenTable({
    screens,
    theaterId,
    isScreenBusy,
    handleDelete,
    loading,
}: ScreenTableProps) {
    return (
        <div className="table-responsive">
            <table className="table table-theater table-dark table-borderless align-middle mb-0">
                <thead>
                    <tr className="text-uppercase">
                        <th>ID</th>
                        <th>Tên phòng</th>
                        <th>Loại phòng</th>
                        <th>Sức chứa (Ghế)</th>
                        <th>Cấu hình (R x C)</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td
                                colSpan={7}
                                className="text-center py-5 text-white"
                            >
                                Đang tải...
                            </td>
                        </tr>
                    ) : screens.length === 0 ? (
                        <tr>
                            <td
                                colSpan={7}
                                className="text-center py-5 text-secondary"
                            >
                                Chưa có phòng chiếu nào.
                            </td>
                        </tr>
                    ) : (
                        screens.map((item) => (
                            <ScreenItem
                                key={item.id}
                                item={item}
                                theaterId={theaterId}
                                isBusy={isScreenBusy(item.id)}
                                handleDelete={handleDelete}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default ScreenTable;
