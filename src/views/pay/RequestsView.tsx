import { useMemo } from "react";
import { useRequestPaymentsQuery } from "@/hooks/use-request-payment";
import { RequestsTable } from "./components/request/RequestsTable";
import { toReceivedPaymentView } from "./request-utils";

export function RequestsView() {
  const listQuery = useRequestPaymentsQuery();
  const rows = useMemo(
    () => (listQuery.data ?? []).map(toReceivedPaymentView),
    [listQuery.data],
  );

  return (
    <RequestsTable
      rows={rows}
      loading={listQuery.isPending}
      error={
        listQuery.isError
          ? listQuery.error instanceof Error
            ? listQuery.error.message
            : "Failed to load requests"
          : null
      }
    />
  );
}
