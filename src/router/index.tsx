import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginView } from "@/views/auth/LoginView";
import { RegisterView } from "@/views/auth/RegisterView";
import { HowItWorksView } from "@/views/how-it-works/HowItWorksView";
import { HomeView } from "@/views/home/HomeView";
import { BatchPayoutView } from "@/views/pay/BatchPayoutView";
import { PayPlaceholderView } from "@/views/pay/PayPlaceholderView";
import { RequestPaymentView } from "@/views/pay/RequestPaymentView";
import { SinglePayoutView } from "@/views/pay/SinglePayoutView";
import { AppLayout } from "@/layouts/AppLayout";
import { PayLayout } from "@/layouts/PayLayout";
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
        element: <AppLayout />,
        children: [
          {
            path: "/",
            element: <HomeView />,
          },
          {
            element: <PayLayout />,
            children: [
              { path: "/pay", element: <SinglePayoutView /> },
              { path: "/pay/batch", element: <BatchPayoutView /> },
              { path: "/pay/request", element: <RequestPaymentView /> },
              { path: "/pay/pending", element: <PayPlaceholderView /> },
              { path: "/pay/history", element: <PayPlaceholderView /> },
            ],
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
