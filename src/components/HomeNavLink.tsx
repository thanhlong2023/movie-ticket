import { NavLink } from "react-router-dom";

interface HomeNavLinkProps {
  to: string;
  content: string;
  end?: boolean;
  onClick?: () => void;
}

function HomeNavLink({ to, content, end, onClick }: HomeNavLinkProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `nav-link ${isActive ? "link-active" : ""}`}
      onClick={onClick}
    >
      {content}
    </NavLink>
  );
}

export default HomeNavLink;
