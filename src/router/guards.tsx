import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { usePartnerQuery } from "@/hooks/use-partner-api";
import { hasOrganization, isEmployee } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import {
  CREATE_ORGANIZATION_PATH,
  loginPathWithReturnTo,
  postAuthPath,
  returnToFromSearch,
  safeReturnTo,
} from "@/views/auth/return-to";
import { PAY_ADMIN_ONLY_PATHS } from "@/views/pay/config";

export function RequireAuth() {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    const dest = `${location.pathname}${location.search}`;
    return <Navigate to={loginPathWithReturnTo(dest)} replace />;
  }

  return <Outlet />;
}

export function RequireOrganization() {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (user && !isEmployee(user) && !hasOrganization(user)) {
    const dest = `${location.pathname}${location.search}`;
    const returnTo = safeReturnTo(dest);
    const to = returnTo
      ? `${CREATE_ORGANIZATION_PATH}?returnTo=${encodeURIComponent(returnTo)}`
      : CREATE_ORGANIZATION_PATH;
    return <Navigate to={to} replace />;
  }

  return <Outlet />;
}

export function RedirectIfHasOrganization({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isEmployee(user) || hasOrganization(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function RequirePartner() {
  const query = usePartnerQuery();

  if (query.isPending) {
    return <p className="font-montserrat text-sm text-[#909090]">Loading…</p>;
  }

  if (query.isError) {
    return (
      <p className="font-montserrat text-sm text-danger">
        {query.error instanceof Error ? query.error.message : "Failed to load partner"}
      </p>
    );
  }

  if (!query.data?.id) {
    return <Navigate to="/partner" replace />;
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

  if (
    isEmployee(user) &&
    PAY_ADMIN_ONLY_PATHS.some((path) => path === pathname)
  ) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
