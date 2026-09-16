import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useEffect } from "react";
import { AUTH_SESSION_STORAGE_NAME } from "@/lib/auth-session";
import { useProfileQuery } from "@/hooks/use-auth-api";
/** Hydrates the session and registers HTTP 401 → logout. */
import { useAuthStore } from "@/stores/auth";
import { router } from "./router";

function SessionBootstrap() {
  useProfileQuery();
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_SESSION_STORAGE_NAME) return;
      useAuthStore.getState().hydrateFromStorage();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}

export default function App() {
  return (
    <>
      <SessionBootstrap />
      <RouterProvider router={router} />
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar
        theme="light"
        toastStyle={{ backgroundColor: "transparent", boxShadow: "none" }}
        newestOnTop={false}
        rtl={false}
        pauseOnFocusLoss
        closeButton={false}
      />
    </>
  );
}
