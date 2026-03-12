import type { Promotion } from "../../../types";
import PromotionsItem from "./PromotionsItem";

interface PromotionsTableProps {
    promotions: Promotion[];
    handleDelete: (id: number) => void;
}

function PromotionsTable({ promotions, handleDelete }: PromotionsTableProps) {
    return (
        <table className="table table-theater table-dark table-borderless align-middle mb-0">
            <thead>
                <tr className="text-uppercase">
                    <th>ID</th>
                    <th>Hình ảnh</th>
                    <th>Tiêu đề</th>
                    <th>Ngày đăng</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                {promotions.length === 0 ? (
                    <tr>
                        <td
                            colSpan={6}
                            className="text-center py-5 text-secondary"
                        >
                            Chưa có khuyến mãi nào.
                        </td>
                    </tr>
                ) : (
                    promotions.map((item) => (
                        <PromotionsItem
                            key={item.id}
                            item={item}
                            handleDelete={handleDelete}
                        />
                    ))
                )}
            </tbody>
        </table>
    );
}

export default PromotionsTable;
