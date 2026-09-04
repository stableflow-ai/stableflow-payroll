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
import { formatAmount, formatDate } from "@/utils";
import type { HistoryItem } from "@/hooks/use-history-api";
import { HistoryAddressCell } from "./HistoryAddressCell";
import { HistoryAssetCell } from "./HistoryAssetCell";
import { HISTORY_TABLE_COLUMNS } from "./config";

export function HistoryTable(props: {
  rows: HistoryItem[];
  empty: string;
  toolbar?: ReactNode;
  footer?: ReactNode;
}) {
  const { rows, empty, toolbar, footer } = props;

  return (
    <Table columns={HISTORY_TABLE_COLUMNS} toolbar={toolbar} footer={footer}>
      <TableHeader>
        <TableHead>Amount</TableHead>
        <TableHead>Source</TableHead>
        <TableHead />
        <TableHead>Received</TableHead>
        <TableHead>Destination</TableHead>
        <TableHead>From</TableHead>
        <TableHead>To</TableHead>
        <TableHead>Time</TableHead>
      </TableHeader>
      {rows.length === 0 ? (
        <p className="py-8 text-center font-montserrat text-sm font-medium text-[#aaa]">{empty}</p>
      ) : (
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{formatAmount(row.amount, { prefix: "", showDust: true })}</TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  );
}
