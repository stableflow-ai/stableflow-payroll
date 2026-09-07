import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { DRAWER_SIDE } from "@/components/ui/drawer/config";
import { InputNumber } from "@/components/ui/input-number/InputNumber";
import { chainDisplayName } from "@/config/chains";
import { useMediaQuery } from "@/hooks/use-media-query";
import useToast from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatAmount, formatDate, DATE_FORMAT } from "@/utils";
import {
  PAYABLE_TYPE,
  effectiveNetPay,
  payableAdjustments,
  payableKeyId,
  type Payable,
} from "@/types/payable";
import { AMOUNT_MAX_DECIMALS } from "../../config";
import { parsePositiveDecimal } from "../../utils";
import { PayoutRecipientCell } from "../payout-table/PayoutRecipientCell";
import { PaymentFormCategoryTag } from "./PaymentFormCategoryTag";
import { sumPayableNetPay } from "./utils";
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
  detail: Payable | null;
  netPayById: Record<number, string>;
  onSaveNetPay: (next: Record<number, string>) => void;
}) {
  const { open, onClose, detail, netPayById, onSaveNetPay } = props;
  const isDesktop = useMediaQuery(PAYMENT_FORM_DETAILS_DESKTOP_QUERY);
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<number, string>>({});
  const detailKey = detail ? payableKeyId(detail.key) : "";

  useEffect(() => {
    setEditing(false);
    setDraft({});
  }, [open, detailKey]);

  function handleClose() {
    setEditing(false);
    setDraft({});
    onClose();
  }

  function handleHeaderAction() {
    if (!detail) return;
    if (!editing) {
      const next: Record<number, string> = {};
      for (const item of detail.items) {
        next[item.id] = effectiveNetPay(item, netPayById);
      }
      setDraft(next);
      setEditing(true);
      return;
    }
    const parsedById: Record<number, string> = {};
    for (const item of detail.items) {
      const parsed = parsePositiveDecimal(draft[item.id] ?? "", AMOUNT_MAX_DECIMALS);
      if (!parsed) {
        toast.fail({ title: "Enter a valid net pay" });
        return;
      }
      parsedById[item.id] = parsed;
    }
    const adjustments = payableAdjustments(detail.items, parsedById) ?? [];
    const next: Record<number, string> = {};
    for (const row of adjustments) {
      next[row.item_id] = row.net_pay;
    }
    onSaveNetPay(next);
    setEditing(false);
    setDraft({});
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      side={isDesktop ? DRAWER_SIDE.Right : DRAWER_SIDE.Bottom}
      title={
        detail ? (
          <>
            <PaymentFormCategoryTag
              category={detail.type}
              className={PAYMENT_FORM_DETAILS_CATEGORY_MUTED_CLASS}
            />
            <span className="min-w-0 truncate">{detail.title}</span>
          </>
        ) : null
      }
      titleClassName="flex min-w-0 flex-1 items-center gap-2"
      headerAction={
        detail ? (
          <div className="ml-auto">
            <Button
              size="sm"
              className="h-[30px] w-[84px] rounded-[8px] text-sm"
              onClick={handleHeaderAction}
            >
              {editing ? "Save" : "Edit"}
            </Button>
          </div>
        ) : null
      }
      panelClassName={isDesktop ? "w-[min(100%,820px)]" : undefined}
      cardClassName={cn("gap-6 p-10", !isDesktop && "w-full max-h-[90vh] rounded-b-none")}
    >
      {detail ? (
        <PaymentFormDetailsBody
          detail={detail}
          netPayById={netPayById}
          editing={editing}
          draft={draft}
          onDraftChange={(id, value) => setDraft((prev) => ({ ...prev, [id]: value }))}
        />
      ) : null}
    </Drawer>
  );
}

function PaymentFormDetailsBody(props: {
  detail: Payable;
  netPayById: Record<number, string>;
  editing: boolean;
  draft: Record<number, string>;
  onDraftChange: (id: number, value: string) => void;
}) {
  const { detail, netPayById, editing, draft, onDraftChange } = props;
  const recipientCount = String(detail.items.length);
  const isPayroll = detail.type === PAYABLE_TYPE.Payroll;
  const nextPayDate = formatDate(detail.paymentDate, DATE_FORMAT.MonthDayYear) || detail.paymentDate || "-";
  const totalValued = formatAmount(sumPayableNetPay(detail, netPayById), {
    prefix: "",
    maxDecimals: AMOUNT_MAX_DECIMALS,
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div
        className={cn(
          "grid gap-4 rounded-[12px] border border-white bg-[#fdfdfd] px-8 py-4 shadow-[0_0_20px_0_rgba(0,0,0,0.06)]",
          isPayroll ? "grid-cols-3" : "grid-cols-2",
        )}
      >
        <SummaryCell
          label={PAYMENT_FORM_DETAILS_SUMMARY.totalValue}
          value={totalValued}
        />
        <SummaryCell
          label={PAYMENT_FORM_DETAILS_SUMMARY.recipients}
          value={recipientCount}
        />
        {isPayroll ? (
          <SummaryCell
            label={PAYMENT_FORM_DETAILS_SUMMARY.nextPayDate}
            value={nextPayDate}
          />
        ) : null}
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
          {detail.items.map((row) => {
            const netPay = effectiveNetPay(row, netPayById);
            return (
              <div
                key={row.id}
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
                  {formatAmount(row.amount, { prefix: "", maxDecimals: AMOUNT_MAX_DECIMALS })}
                </p>
                {editing ? (
                  <InputNumber
                    value={draft[row.id] ?? ""}
                    decimals={AMOUNT_MAX_DECIMALS}
                    onNumberChange={(value) => onDraftChange(row.id, value)}
                    className="h-9 min-w-0 w-full rounded-[6px] border border-[#e3e3e3] bg-white px-2 font-montserrat text-sm font-medium text-black outline-none"
                  />
                ) : (
                  <p className="font-montserrat text-sm font-medium text-black">
                    {formatAmount(netPay, { prefix: "", maxDecimals: AMOUNT_MAX_DECIMALS })}
                  </p>
                )}
              </div>
            );
          })}
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
