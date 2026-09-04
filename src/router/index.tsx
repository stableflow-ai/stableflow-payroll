import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginView } from "@/views/auth/LoginView";
import { RegisterView } from "@/views/auth/RegisterView";
import { HowItWorksView } from "@/views/how-it-works/HowItWorksView";
import { HomeView } from "@/views/home/HomeView";
import { AnalyticsView } from "@/views/analytics/AnalyticsView";
import { BatchPayoutView } from "@/views/pay/BatchPayoutView";
import { PayrollView } from "@/views/payroll";
import { ReimbursementView } from "@/views/reimbursement";
import { BonusView } from "@/views/bonus";
import { PendingPayoutsView } from "@/views/pay/PendingPayoutsView";
import { RequestPayView } from "@/views/pay/RequestPayView";
import { RequestPaymentView } from "@/views/pay/RequestPaymentView";
import { PayoutResultView } from "@/views/pay/PayoutResultView";
import { PayPlaceholderView } from "@/views/pay/PayPlaceholderView";
import { SinglePayoutView } from "@/views/pay/SinglePayoutView";
import { TransactionHistoryView } from "@/views/pay/TransactionHistoryView";
import { AppLayout } from "@/layouts/AppLayout";
import { PartnerLayout } from "@/layouts/PartnerLayout";
import { PayLayout } from "@/layouts/PayLayout";
import { ApiKeysView } from "@/views/partner/ApiKeysView";
import { PartnerPlaceholderView } from "@/views/partner/PartnerPlaceholderView";
import { PartnerRegistrationView } from "@/views/partner/PartnerRegistrationView";
import { ReportsView } from "@/views/partner/ReportsView";
import { RedirectIfAuthed, RequireAuth, RequirePartner } from "./guards";

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
    element: <AppLayout />,
    children: [
      // {
      //   path: "/p/:id",
      //   element: <RequestPayView />,
      // },
      {
        element: <RequireAuth />,
        children: [
          // {
          //   path: "/",
          //   element: <HomeView />,
          // },
          // {
          //   path: "/analytics",
          //   element: <AnalyticsView />,
          // },
          {
            path: "/",
            element: <Navigate to="/pay" replace />,
          },
          {
            element: <PayLayout />,
            children: [
              { path: "/pay", element: <SinglePayoutView /> },
              { path: "/pay/form", element: <PayPlaceholderView /> },
              { path: "/pay/overview", element: <PayPlaceholderView /> },
              { path: "/pay/result", element: <PayoutResultView /> },
              { path: "/pay/payroll", element: <PayrollView /> },
              { path: "/pay/batch", element: <BatchPayoutView /> },
              { path: "/pay/reimbursement", element: <ReimbursementView /> },
              { path: "/pay/bonus", element: <BonusView /> },
              { path: "/pay/team", element: <PayPlaceholderView /> },
              { path: "/pay/setting", element: <PayPlaceholderView /> },
              { path: "/pay/request", element: <RequestPaymentView /> },
              { path: "/pay/pending", element: <PendingPayoutsView /> },
              { path: "/pay/history", element: <TransactionHistoryView /> },
            ],
          },
          // {
          //   element: <PartnerLayout />,
          //   children: [
          //     { path: "/partner", element: <PartnerRegistrationView /> },
          //     {
          //       element: <RequirePartner />,
          //       children: [
          //         { path: "/partner/api-keys", element: <ApiKeysView /> },
          //         { path: "/partner/reports", element: <ReportsView /> },
          //       ],
          //     },
          //     { path: "/partner/support", element: <PartnerPlaceholderView /> },
          //     { path: "/partner/terms", element: <PartnerPlaceholderView /> },
          //     { path: "/partner/docs", element: <PartnerPlaceholderView /> },
          //   ],
          // },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/pay" replace />,
  },
]);
