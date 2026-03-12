import { Link } from "react-router-dom";

interface TitleCategoryProps {
  title: string;
  link: string;
  viewAll?: boolean;
  dot?: boolean;
}

function TitleCategory({
  title,
  link,
  viewAll = true,
  dot = true,
}: TitleCategoryProps) {
  return (
    <div className="title-category">
      <div className="flex gap-2">
        {dot && <div className="title-dot"></div>}
        <div>{title}</div>
      </div>
      {viewAll && (
        <Link to={link} className="view-all">
          Xem tất cả
        </Link>
      )}
    </div>
  );
}

export default TitleCategory;
