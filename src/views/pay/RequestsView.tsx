import { useEffect, useMemo, useState } from "react";
import { Pagination } from "@/components/ui/pagination/Pagination";
import { usePaymentRequestsQuery } from "@/hooks/use-request-payment";
import { RequestsTable } from "./components/request/RequestsTable";
import { REQUESTS_PAGE_SIZE } from "./config";
import { toReceivedPaymentView } from "./request-utils";

export function RequestsView() {
  const [page, setPage] = useState(1);
  const listQuery = usePaymentRequestsQuery({
    page,
    pageSize: REQUESTS_PAGE_SIZE,
  });
  const rows = useMemo(
    () => (listQuery.data?.list ?? []).map(toReceivedPaymentView),
    [listQuery.data],
  );
  const totalPage = Math.max(1, listQuery.data?.totalPage ?? 1);
  const safePage = Math.min(page, totalPage);

  useEffect(() => {
    if (page > totalPage) setPage(totalPage);
  }, [page, totalPage]);

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
      footer={
        <div className="mt-4 flex justify-center sm:justify-end">
          <Pagination page={safePage} totalPage={totalPage} onPageChange={setPage} />
        </div>
      }
    />
  );
}
