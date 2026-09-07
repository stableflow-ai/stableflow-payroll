import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { isUser } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import {
  loginPathWithReturnTo,
  postAuthPath,
  returnToFromSearch,
} from "@/views/auth/return-to";
import {
  isAdminOnlyPayPath,
  PAY_EMPLOYEE_ONLY_PATHS,
} from "@/views/pay/config";

export function RequireAuth() {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    const dest = `${location.pathname}${location.search}`;
    return <Navigate to={loginPathWithReturnTo(dest)} replace />;
  }

  return <Outlet />;
}

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const [params] = useSearchParams();

  if (user) {
    return <Navigate to={postAuthPath(user, returnToFromSearch(params.toString()))} replace />;
  }

  return children;
}

export function RedirectEmployeeFromAdminPay() {
  const user = useAuthStore((state) => state.user);
  const { pathname } = useLocation();

  if (isUser(user) && isAdminOnlyPayPath(pathname)) {
    return <Navigate to="/" replace />;
  }

  if (
    !isUser(user) &&
    PAY_EMPLOYEE_ONLY_PATHS.some((path) => path === pathname)
  ) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
