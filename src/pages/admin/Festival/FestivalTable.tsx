import type { FestivalType } from "../../../types";
import FestivalItem from "./FestivalItem";

interface FestivalTableProps {
  festivals: FestivalType[];
  handleDelete: (id: number) => void;
}

function FestivalTable({ festivals, handleDelete }: FestivalTableProps) {
  return (
    <table className="table table-theater table-dark table-borderless align-middle mb-0">
      <thead>
        <tr className="text-uppercase">
          <th>ID</th>
          <th>Hình ảnh</th>
          <th>Tiêu đề</th>
          <th>Ngày Đăng</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        {festivals.length === 0 ? (
          <tr>
            <td colSpan={6} className="text-center py-5 text-secondary">
              Chưa có liên hoan phim nào.
            </td>
          </tr>
        ) : (
          festivals.map((item) => (
            <FestivalItem
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

export default FestivalTable;
