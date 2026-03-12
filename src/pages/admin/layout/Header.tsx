import { useAuth } from "../../../contexts/AuthContext";

const getTodayDate = () => {
  const today = new Date();
  return {
    weekday: today.toLocaleDateString("en-US", { weekday: "long" }),
    day: today.getDate().toString().padStart(2, "0"),
    month: (today.getMonth() + 1).toString().padStart(2, "0"),
    year: today.getFullYear(),
  };
};

interface HeaderProps {
  onLogoClick?: () => void;
}

const Header = ({ onLogoClick }: HeaderProps) => {
  const { user } = useAuth();
  const today = getTodayDate();

  return (
    <div className="admin-header flex justify-content-between">
      <div 
        className="flex gap-2 align-items-baseline" 
        onClick={onLogoClick}
        style={{ cursor: 'pointer' }}
      >
        <i className="fa-solid fa-film fs-3 text-danger"></i>
        <div className="admin-brand fs-3">CINEMA</div>
      </div>
      <div className="flex gap-3">
        <div className="text-end">
          <strong style={{ color: "#ff6b6b" }}>{today.weekday}</strong>
          <div>
            <strong>
              {today.day}/{today.month}/{today.year}
            </strong>
          </div>
        </div>
        <div className="user-avatar flex">
          {user?.name?.charAt(0).toUpperCase() || "A"}
        </div>
      </div>
    </div>
  );
};

export default Header;
