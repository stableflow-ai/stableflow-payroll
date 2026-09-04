import { isEmployee } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import { AdminOverviewView } from "./components/overview/AdminOverviewView";
import { EmployeeOverviewView } from "./components/overview/EmployeeOverviewView";

export function OverviewView() {
  const user = useAuthStore((state) => state.user);
  if (isEmployee(user)) return <EmployeeOverviewView />;
  return <AdminOverviewView />;
}
