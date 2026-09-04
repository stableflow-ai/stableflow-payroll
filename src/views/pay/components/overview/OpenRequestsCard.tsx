import { Link } from "react-router-dom";
import { Icon2Right } from "@/components/icons/to-right";
import { Card } from "@/components/ui/card/Card";
import { formatDate } from "@/utils";
import type { EmployeeOpenRequest } from "@/hooks/use-employee-overview-api";
import { OVERVIEW_PENDING_COLOR } from "./config";

export function OpenRequestsCard(props: { requests: EmployeeOpenRequest[] }) {
  const { requests } = props;

  return (
    <Card className="flex min-h-[454px] flex-col">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-montserrat text-base font-medium capitalize text-black">
          Open Requests
        </h2>
        <Link
          to="/pay/request"
          className="inline-flex shrink-0 items-center gap-1 font-montserrat text-xs text-[#606060]"
        >
          View All
          <Icon2Right className="h-2 w-[11.5px]" />
        </Link>
      </div>
      <div className="mt-5 flex flex-col">
        {requests.length === 0 ? (
          <p className="py-8 text-center font-montserrat text-sm text-[#909090]">No open requests</p>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className="flex items-start justify-between gap-3 border-b border-black/10 py-4 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate font-montserrat text-sm font-medium text-black">
                  {request.name}
                </p>
                <p className="mt-1 font-montserrat text-xs font-medium text-[#aaa]">
                  {formatDate(request.createdAt)}
                </p>
              </div>
              <span
                className="shrink-0 font-montserrat text-xs font-medium"
                style={{ color: OVERVIEW_PENDING_COLOR }}
              >
                Pending
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
