import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginView } from "@/views/auth/LoginView";
import { RegisterView } from "@/views/auth/RegisterView";
import { InviteRegisterView } from "@/views/auth/InviteRegisterView";
import { HowItWorksView } from "@/views/how-it-works/HowItWorksView";
import { PayrollView } from "@/views/payroll";
import { ExpenseView } from "@/views/expense";
import { BonusView } from "@/views/bonus";
import { RequestPaymentView } from "@/views/pay/RequestPaymentView";
import { RequestsView } from "@/views/pay/RequestsView";
import { PayoutResultView } from "@/views/pay/PayoutResultView";
import { PaymentByFormView } from "@/views/pay/PaymentByFormView";
import { SettingView } from "@/views/pay/SettingView";
import { OverviewView } from "@/views/pay/OverviewView";
import { SinglePayoutView } from "@/views/pay/SinglePayoutView";
import { TransactionHistoryView } from "@/views/pay/TransactionHistoryView";
import { TeamView } from "@/views/pay/TeamView";
import { AppLayout } from "@/layouts/AppLayout";
import { PayLayout } from "@/layouts/PayLayout";
import { RedirectEmployeeFromAdminPay, RedirectIfAuthed, RequireAuth } from "./guards";

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
    path: "/invite/:orgId",
    element: (
      <RedirectIfAuthed>
        <InviteRegisterView />
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
      {
        element: <RequireAuth />,
        children: [
          {
            element: <RedirectEmployeeFromAdminPay />,
            children: [
              {
                element: <PayLayout />,
                children: [
                  { path: "/", element: <OverviewView /> },
                  { path: "/pay", element: <SinglePayoutView /> },
                  { path: "/pay/form", element: <PaymentByFormView /> },
                  { path: "/pay/result", element: <PayoutResultView /> },
                  { path: "/pay/payroll", element: <PayrollView /> },
                  { path: "/pay/payroll/history", element: <PayrollView /> },
                  { path: "/pay/payroll/history/:executionId", element: <PayrollView /> },
                  { path: "/pay/expense", element: <ExpenseView /> },
                  { path: "/pay/expense/requests", element: <ExpenseView /> },
                  { path: "/pay/expense/history", element: <ExpenseView /> },
                  { path: "/pay/bonus", element: <BonusView /> },
                  { path: "/pay/bonus/history", element: <BonusView /> },
                  { path: "/team", element: <TeamView /> },
                  { path: "/setting", element: <SettingView /> },
                  { path: "/pay/request", element: <RequestPaymentView /> },
                  { path: "/pay/requests", element: <RequestsView /> },
                  { path: "/history", element: <TransactionHistoryView /> },
                ],
              },
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
