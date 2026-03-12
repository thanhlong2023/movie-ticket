import { useNavigate } from "react-router-dom";

interface BoxMovieProps {
  id: number;
  path: string;
  image: string;
  category: string;
  date: string;
  title: string;
  age: string; // bạn đang truyền dạng "T13 - 2D" hoặc "P"...
  mode?: "default" | "compact";
}

function BoxMovie({
  id,
  path,
  image,
  category,
  date,
  title,
  age,
  mode = "default",
}: BoxMovieProps) {
  const navigate = useNavigate();
  const handleClick = () => navigate(path);

  // Compact: chỉ lấy "- P" (hoặc nếu age có T13/T16... thì vẫn dùng)
  const compactAge = (() => {
    const s = (age || "").trim();
    if (!s) return "P";
    // nếu có chữ P ở đâu đó -> dùng P
    if (/\bP\b/i.test(s)) return "P";
    // nếu age là "T13 - 2D" -> lấy phần đầu "T13"
    const first = s.split("-")[0]?.trim();
    return first || "P";
  })();

  return (
    <div
      className={`box-movie d-flex flex-column gap-2 ${
        mode === "compact" ? "box-movie--compact" : ""
      }`}
      onClick={handleClick}
      key={id}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <div className="img-container">
        <img src={image} alt={title} />
        
        {/* Overlay text inside image for carousel */}
        <div className="description-movie">
          <div>{category}</div>
          <div>{new Date(date).toLocaleDateString("vi-VN")}</div>
        </div>
        <div className="title-movie">
          {mode === "compact" ? `${title} - ${compactAge}` : `${title} - ${age}`}
        </div>
      </div>

      {/* External text below image */}
      <div className="description-movie flex gap-3 justify-content-start">
        <div>{category}</div>
        <div>{new Date(date).toLocaleDateString("vi-VN")}</div>
      </div>

      <div className="title-movie">
        {mode === "compact" ? `${title} - ${compactAge}` : `${title} - ${age}`}
      </div>
    </div>
  );
}

export default BoxMovie;
