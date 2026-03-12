import { Link } from "react-router-dom";

interface ButtonAdminProps {
    path: string;
    title: string;
}

function ButtonAdmin({ path, title }: ButtonAdminProps) {
    return (
        <Link to={path} className="btn btn-red-shadow text-light">
            <i className="bi bi-plus-lg me-2"></i>
            {title}
        </Link>
    );
}

export default ButtonAdmin;
