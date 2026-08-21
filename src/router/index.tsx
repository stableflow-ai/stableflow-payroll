import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginView } from "@/views/auth/LoginView";
import { RegisterView } from "@/views/auth/RegisterView";
import { HowItWorksView } from "@/views/how-it-works/HowItWorksView";
import { PlaceholderHome } from "@/views/PlaceholderHome";
import { RedirectIfAuthed, RequireAuth } from "./guards";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <RedirectIfAuthed>
        <LoginView />
      </RedirectIfAuthed>
    ),
  },
  {
    path: "/register",
    element: (
      <RedirectIfAuthed>
        <RegisterView />
      </RedirectIfAuthed>
    ),
  },
  {
    path: "/howitworks",
    element: <HowItWorksView />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <PlaceholderHome />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
