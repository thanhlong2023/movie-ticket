import Spinner from "react-bootstrap/Spinner";

function LoadingScreen() {
  return (
    <div className="background-loading">
      <div className="loading-screen flex h-100">
        <Spinner animation="border" variant="danger" />
      </div>
    </div>
  );
}

export default LoadingScreen;
