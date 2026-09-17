import { describe, expect, it } from "vitest";
import { PAYABLE_TYPE, payableKeyId, type Payable } from "@/types/payable";
import {
  PAYMENT_FORM_SELECT_PLACEHOLDER,
  paymentFormSelectTriggerLabel,
} from "./PaymentFormSelect";

const FORM: Payable = {
  key: { type: PAYABLE_TYPE.Payroll, periodMonth: "2026-09" },
  type: PAYABLE_TYPE.Payroll,
  title: "September Payroll",
  totalPayout: "35000",
  totalCount: 1,
  paymentDate: "2026-09-01",
  periodMonth: "2026-09",
  batchId: 0,
  items: [],
};

describe("paymentFormSelectTriggerLabel", () => {
  it("shows the selected form title", () => {
    expect(paymentFormSelectTriggerLabel([FORM], payableKeyId(FORM.key))).toBe("September Payroll");
  });

  it("shows Select after the value is cleared instead of the previous form", () => {
    const previous = payableKeyId(FORM.key);
    expect(paymentFormSelectTriggerLabel([FORM], previous)).toBe("September Payroll");
    expect(paymentFormSelectTriggerLabel([FORM], "")).toBe(PAYMENT_FORM_SELECT_PLACEHOLDER);
    expect(paymentFormSelectTriggerLabel([FORM], "")).not.toBe(FORM.title);
  });
});
