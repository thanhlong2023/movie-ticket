import { Button } from "react-bootstrap";
import "./NotFound.css";
import { useNavigate } from "react-router";

function PageNotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-container flex">
      <div className="text-center flex flex-column gap-1">
        <div className="notfound-box flex gap-4">
          <h1>4</h1>
          <h1>0</h1>
          <h1>4</h1>
        </div>
        <h2 className="mb-4">Oops, This Page Not Found!</h2>
        <Button variant="danger" onClick={() => navigate("/")}>
          Go Home
        </Button>
      </div>
    </div>
  );
}

export default PageNotFound;
