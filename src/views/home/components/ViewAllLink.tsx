import { Link } from "react-router-dom";
import { Icon2Right } from "@/components/icons/to-right";

export function ViewAllLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 font-montserrat text-xs text-[#606060]"
    >
      View All
      <Icon2Right />
    </Link>
  );
}
