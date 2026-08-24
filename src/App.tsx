import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
/** Hydrates the session and registers HTTP 401 → logout. */
import "@/stores/auth";
import { useProfileQuery } from "@/hooks/use-auth-api";
import { router } from "./router";

function SessionBootstrap() {
  useProfileQuery();
  return null;
}

export default function App() {
  return (
    <>
      <SessionBootstrap />
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar
        theme="light"
        toastStyle={{ backgroundColor: "transparent", boxShadow: "none" }}
        newestOnTop
        rtl={false}
        pauseOnFocusLoss
        closeButton={false}
      />
    </>
  );
}
