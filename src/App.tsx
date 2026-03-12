import { RouterProvider } from "react-router-dom";
import { router } from "./routes/router";
import { AuthProvider } from "./contexts/AuthContext";
import NotificationContainer from "./components/NotificationContainer";
import ConfirmDialog from "./components/ConfirmDialog";

function App() {
  return (
    <>
      <AuthProvider>
        <RouterProvider router={router} />
        <NotificationContainer />
        <ConfirmDialog />
      </AuthProvider>
    </>
  );
}

export default App;
