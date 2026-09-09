import type { ReactNode } from "react";
import { Icon2Right } from "@/components/icons/to-right";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/Table";
import { txExplorerUrl } from "@/config/chains";
import { cn } from "@/lib/utils";
import { formatAmount, formatDate } from "@/utils";
import type { HistoryItem } from "@/types/history";
import { HistoryAddressCell } from "./HistoryAddressCell";
import { HistoryAssetCell } from "./HistoryAssetCell";
import { HISTORY_TABLE_COLUMNS, HISTORY_TABLE_COLUMNS_MEMBER } from "./config";
import { historyAmountDisplay, historyStatusClass, historyStatusLabel, historyTypeLabel } from "./utils";

export function HistoryTable(props: {
  rows: HistoryItem[];
  empty: string;
  showType?: boolean;
  toolbar?: ReactNode;
  footer?: ReactNode;
}) {
  const { rows, empty, showType = false, toolbar, footer } = props;

  return (
    <Table
      columns={showType ? HISTORY_TABLE_COLUMNS_MEMBER : HISTORY_TABLE_COLUMNS}
      toolbar={toolbar}
      footer={footer}
    >
      <TableHeader>
        {showType ? <TableHead>Type</TableHead> : null}
        <TableHead>Amount</TableHead>
        <TableHead>Source</TableHead>
        <TableHead />
        <TableHead>Received</TableHead>
        <TableHead>Destination</TableHead>
        <TableHead>From</TableHead>
        <TableHead>To</TableHead>
        <TableHead>Time</TableHead>
        <TableHead>Status</TableHead>
      </TableHeader>
      {rows.length === 0 ? (
        <p className="py-8 text-center font-montserrat text-sm font-medium text-[#aaa]">{empty}</p>
      ) : (
        <TableBody>
          {rows.map((row) => {
            const amount = showType
              ? historyAmountDisplay(row.amount, row.type)
              : {
                  text: formatAmount(row.amount, { prefix: "", showDust: true }),
                  className: "",
                };
            return (
              <TableRow key={row.id}>
                {showType ? <TableCell>{historyTypeLabel(row.type)}</TableCell> : null}
                <TableCell>
                  <span className={cn(amount.className)}>{amount.text}</span>
                </TableCell>
                <TableCell>
                  <HistoryAssetCell symbol={row.token} network={row.network} />
                </TableCell>
                <TableCell>
                  <Icon2Right className="h-2 w-3 shrink-0 text-black" />
                </TableCell>
                <TableCell>
                  {formatAmount(row.destinationAmount, { prefix: "", showDust: true })}
                </TableCell>
                <TableCell>
                  <HistoryAssetCell
                    symbol={row.destinationToken}
                    network={row.destinationNetwork}
                  />
                </TableCell>
                <TableCell>
                  {row.payer.trim() ? (
                    <HistoryAddressCell
                      address={row.payer}
                      href={txExplorerUrl(row.network, row.txHash)}
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {row.recipient.trim() ? (
                    <HistoryAddressCell
                      address={row.recipient}
                      href={txExplorerUrl(row.destinationNetwork, row.destinationTxHash)}
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>{formatDate(row.submittedAt) || "-"}</TableCell>
                <TableCell>
                  <span className={cn("font-montserrat text-sm font-medium", historyStatusClass(row.status))}>
                    {historyStatusLabel(row.status)}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      )}
    </Table>
  );
}
