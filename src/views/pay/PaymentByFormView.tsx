import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card/Card";
import { usePayablesQuery } from "@/hooks/use-payable-api";
import useToast from "@/hooks/use-toast";
import { findExpensePayable } from "@/types/payable";
import { PaymentByFormCard } from "./components/payment-form/PaymentByFormCard";
import { parsePaymentRequestId } from "./request-utils";

export function PaymentByFormView() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const batchId = parsePaymentRequestId(params.get("batch_id"));
  const formsQuery = usePayablesQuery();
  const missingToastRef = useRef(false);
  const payable = useMemo(() => {
    if (batchId == null || !formsQuery.data) return undefined;
    return findExpensePayable(formsQuery.data, batchId)?.key;
  }, [batchId, formsQuery.data]);

  useEffect(() => {
    if (batchId == null || !formsQuery.isSuccess || missingToastRef.current) return;
    if (payable) return;
    missingToastRef.current = true;
    toast.fail({ title: "Payment form not found" });
  }, [batchId, formsQuery.isSuccess, payable, toast]);

  function handleSettled() {
    if (!params.has("batch_id")) return;
    const next = new URLSearchParams(params);
    next.delete("batch_id");
    setParams(next, { replace: true });
  }

  return (
    <Card className="mx-auto w-full max-w-[600px] px-[30px] py-[30px]">
      <PaymentByFormCard payable={payable} onSettled={handleSettled} />
    </Card>
  );
}
