import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginView } from "@/views/auth/LoginView";
import { RegisterView } from "@/views/auth/RegisterView";
import { HowItWorksView } from "@/views/how-it-works/HowItWorksView";
import { HomeView } from "@/views/home/HomeView";
import { AppLayout } from "@/layouts/AppLayout";
import { ResetPasswordView } from "@/views/auth/ResetPasswordView";
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
    path: "/reset-password",
    element: <ResetPasswordView />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: "/",
            element: <HomeView />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
