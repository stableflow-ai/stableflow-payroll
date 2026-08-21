import { createBrowserRouter, Navigate } from "react-router-dom";
import { PlaceholderHome } from "@/views/PlaceholderHome";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PlaceholderHome />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
