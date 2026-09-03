/**
 * TODO(api): mock data until the payment-forms contract exists.
 * Replace with:
 *   1. types in src/types/<domain>.ts
 *   2. a function in src/api/<domain>.ts
 *   3. a key in src/api/query-keys.ts
 *   4. queryFn -> the real api function
 *   5. delete src/mocks/payment-forms.ts and its MOCK_ENABLED entry
 */
import { useQuery } from "@tanstack/react-query";
import { MOCK_ENABLED } from "@/mocks/config";
import { getPaymentForm, listPaymentForms } from "@/mocks/payment-forms";
import { useAuthStore } from "@/stores/auth";

export type {
  PaymentFormCategory,
  PaymentFormDetail,
  PaymentFormRecipient,
  PaymentFormSummary,
} from "@/mocks/payment-forms";
export { PAYMENT_FORM_CATEGORY } from "@/mocks/payment-forms";

const PAYMENT_FORMS_KEY = ["payment-forms"] as const;

export function usePaymentFormsQuery() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: PAYMENT_FORMS_KEY,
    queryFn: () => listPaymentForms(),
    enabled: Boolean(token) && MOCK_ENABLED.paymentForms,
  });
}

export function usePaymentFormQuery(id: string) {
  const token = useAuthStore((state) => state.token);
  const formId = id.trim();
  return useQuery({
    queryKey: [...PAYMENT_FORMS_KEY, formId],
    queryFn: () => {
      const row = getPaymentForm(formId);
      if (!row) throw new Error("Form not found");
      return row;
    },
    enabled: Boolean(token && formId) && MOCK_ENABLED.paymentForms,
  });
}
