import type { TheaterType } from "../../../types/theater";
import TheaterItem from "./TheaterItem";

interface TheaterTableProps {
    theaters: TheaterType[];
    handleDelete: (id: number) => void;
    getRegionName?: (slug: string) => string;
}

function TheaterTable({
    theaters,
    handleDelete,
    getRegionName,
}: TheaterTableProps) {
    return (
        <table className="table table-theater table-dark table-borderless align-middle mb-0">
            <thead>
                <tr className="text-uppercase">
                    <th>ID</th>
                    <th>Tên rạp</th>
                    <th>Khu vực</th>
                    <th>Địa chỉ</th>
                    <th>Số điện thoại</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                {theaters.length === 0 ? (
                    <tr>
                        <td
                            colSpan={6}
                            className="text-center py-5 text-secondary"
                        >
                            Chưa có rạp nào.
                        </td>
                    </tr>
                ) : (
                    theaters.map((item) => (
                        <TheaterItem
                            key={item.id}
                            item={item}
                            handleDelete={handleDelete}
                            getRegionName={getRegionName}
                        />
                    ))
                )}
            </tbody>
        </table>
    );
}

export default TheaterTable;
