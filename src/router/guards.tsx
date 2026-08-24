import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { usePartner } from "@/hooks/use-partner";
import { useAuthStore } from "@/stores/auth";

export function RequireAuth() {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
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

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
