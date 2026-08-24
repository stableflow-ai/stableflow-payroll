import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { usePartner } from "@/hooks/use-partner";
import { useAuthStore } from "@/stores/auth";
import { loginPathWithReturnTo, returnToFromSearch } from "@/views/auth/return-to";

export function RequireAuth() {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    const dest = `${location.pathname}${location.search}`;
    return <Navigate to={loginPathWithReturnTo(dest)} replace />;
  }

  return <Outlet />;
}

export function RequirePartner() {
  const { isPartner } = usePartner();

  if (!isPartner) {
    return <Navigate to="/partner" replace />;
  }

  return <Outlet />;
}

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const [params] = useSearchParams();

  if (user) {
    return <Navigate to={returnToFromSearch(params.toString()) ?? "/"} replace />;
  }

  return children;
}
