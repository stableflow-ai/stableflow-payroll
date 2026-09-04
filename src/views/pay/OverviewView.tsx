import { isEmployee } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import { EmployeeOverviewView } from "./components/overview/EmployeeOverviewView";
import { PayPlaceholderView } from "./PayPlaceholderView";

export function OverviewView() {
  const user = useAuthStore((state) => state.user);
  if (isEmployee(user)) return <EmployeeOverviewView />;
  return <PayPlaceholderView />;
}
