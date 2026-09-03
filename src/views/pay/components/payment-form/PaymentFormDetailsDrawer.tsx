import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE } from "@/components/ui/button/config";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { DRAWER_SIDE } from "@/components/ui/drawer/config";
import { chainDisplayName } from "@/config/chains";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { PaymentFormDetail } from "@/hooks/use-payment-forms-api";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/utils";
import { PayoutRecipientCell } from "../payout-table/PayoutRecipientCell";
import { PaymentFormCategoryTag } from "./PaymentFormCategoryTag";
import {
  PAYMENT_FORM_DETAILS_CATEGORY_MUTED_CLASS,
  PAYMENT_FORM_DETAILS_COLUMNS,
  PAYMENT_FORM_DETAILS_DESKTOP_QUERY,
  PAYMENT_FORM_DETAILS_SUMMARY,
} from "./config";

const DETAILS_GRID =
  "grid min-w-[700px] grid-cols-[1.3fr_1.2fr_1.2fr_0.8fr_0.7fr] items-center gap-x-3";

export function PaymentFormDetailsDrawer(props: {
  open: boolean;
  onClose: () => void;
  detail: PaymentFormDetail | null;
}) {
  const { open, onClose, detail } = props;
  const isDesktop = useMediaQuery(PAYMENT_FORM_DETAILS_DESKTOP_QUERY);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side={isDesktop ? DRAWER_SIDE.Right : DRAWER_SIDE.Bottom}
      title={
        detail ? (
          <>
            <PaymentFormCategoryTag
              category={detail.category}
              className={PAYMENT_FORM_DETAILS_CATEGORY_MUTED_CLASS}
            />
            <span className="min-w-0 truncate">{detail.name}</span>
          </>
        ) : null
      }
      titleClassName="flex min-w-0 flex-1 items-center gap-2"
      headerAction={
        <div className="ml-auto">
          <Button
            size={BUTTON_SIZE.Sm}
            className="h-[30px] w-[84px] rounded-[8px] px-0 text-sm font-semibold"
          >
            Edit
          </Button>
        </div>
      }
      panelClassName={isDesktop ? "w-[min(100%,820px)]" : undefined}
      cardClassName={cn("gap-6 p-10", !isDesktop && "w-full max-h-[90vh] rounded-b-none")}
    >
      {detail ? <PaymentFormDetailsBody detail={detail} /> : null}
    </Drawer>
  );
}

function PaymentFormDetailsBody(props: { detail: PaymentFormDetail }) {
  const { detail } = props;
  const recipientCount = String(detail.recipients.length);
  const nextPayDate = detail.nextPayDate || "-";

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="grid grid-cols-3 gap-4 rounded-[12px] border border-white bg-[#fdfdfd] px-8 py-4 shadow-[0_0_20px_0_rgba(0,0,0,0.06)]">
        <SummaryCell
          label={PAYMENT_FORM_DETAILS_SUMMARY.totalValue}
          value={formatAmount(detail.totalValued, { maxDecimals: 0 })}
        />
        <SummaryCell
          label={PAYMENT_FORM_DETAILS_SUMMARY.recipients}
          value={recipientCount}
        />
        <SummaryCell
          label={PAYMENT_FORM_DETAILS_SUMMARY.nextPayDate}
          value={nextPayDate}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className={cn(DETAILS_GRID, "px-4 pb-2")}>
          {PAYMENT_FORM_DETAILS_COLUMNS.map((column) => (
            <p
              key={column.key}
              className="font-montserrat text-sm font-medium text-[#aaa]"
            >
              {column.label}
            </p>
          ))}
        </div>
        <div className="flex flex-col gap-2.5">
          {detail.recipients.map((row, index) => (
            <div
              key={`${row.address}-${row.amount}-${index}`}
              className={cn(DETAILS_GRID, "h-14 rounded-[12px] bg-[#f6f6f6] px-4")}
            >
              <div className="min-w-0">
                <p className="truncate font-montserrat text-sm font-medium text-black">
                  {row.name}
                </p>
                <p className="truncate font-montserrat text-xs font-medium text-[#aaa]">
                  {row.email}
                </p>
              </div>
              <div className="min-w-0 font-montserrat text-sm font-medium text-black">
                <PayoutRecipientCell address={row.address} />
              </div>
              <p className="truncate font-montserrat text-sm font-medium text-black">
                {row.symbol} · {chainDisplayName(row.network)}
              </p>
              <p className="font-montserrat text-sm font-medium text-black">
                {formatAmount(row.amount, { prefix: "", maxDecimals: 0 })}
              </p>
              <div className="min-w-0">
                <p className="font-montserrat text-sm font-medium text-black">
                  {formatAmount(row.netPay, { prefix: "", maxDecimals: 0 })}
                </p>
                {row.adjustment ? (
                  <p
                    className={cn(
                      "font-montserrat text-xs font-medium",
                      row.adjustment.startsWith("-")
                        ? "text-[#ff5353]"
                        : "text-[#94ba00]",
                    )}
                  >
                    {row.adjustment}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCell(props: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-montserrat text-sm font-medium text-[#aaa]">{props.label}</p>
      <p className="mt-1.5 truncate font-montserrat text-base font-medium text-black">
        {props.value}
      </p>
    </div>
  );
}
