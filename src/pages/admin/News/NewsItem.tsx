import { Link } from "react-router-dom";
import type { NewsType } from "../../../types";

interface NewsItemProps {
  item: NewsType;
  handleDelete: (id: number) => void;
}

function NewsItem({ item, handleDelete }: NewsItemProps) {
  return (
    <tr key={item.id} className="table-item">
      <td className="text-danger fw-bold">#{item.id}</td>
      <td>
        <div className="fw-bold">
          <img
            src={
              item.img && item.img.length > 0
                ? item.img[0]
                : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-ANBloN9DDMIAMyBSEjFg0huLp1IkwS4C1A&s"
            }
            alt=""
            width="80"
            height="50"
            className="rounded object-fit-cover"
          />
        </div>
      </td>
      <td>{item.title}</td>
      <td>{item.date}</td>
      <td>
        <Link
          to={`/admin/news/${item.id}/edit`}
          className="btn btn-outline-primary btn-sm me-2"
        >
          <i className="bi bi-pencil"></i>
        </Link>
        <button
          onClick={() => handleDelete(item.id)}
          className="btn btn-outline-danger btn-sm"
        >
          <i className="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  );
}

export default NewsItem;
