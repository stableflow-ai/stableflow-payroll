import { IconCheck } from "@/components/icons";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { formatAmount } from "@/utils";
import type { PaymentFormSummary } from "@/hooks/use-payment-forms-api";
import { PaymentFormCategoryTag } from "./PaymentFormCategoryTag";

function PaymentFormOptionRow(props: {
  form: PaymentFormSummary;
  selected: boolean;
}) {
  const { form, selected } = props;
  return (
    <span className="flex w-full min-w-0 items-center gap-2">
      <PaymentFormCategoryTag category={form.category} />
      <span className="min-w-0 flex-1 truncate font-montserrat text-sm font-medium text-black">
        {form.name}
      </span>
      <span className="shrink-0 font-montserrat text-sm font-medium text-black">
        {formatAmount(form.totalValued, { maxDecimals: 0 })}
      </span>
      <span className="inline-flex size-3.5 shrink-0 items-center justify-center">
        {selected ? <IconCheck className="text-[#6284f5]" /> : null}
      </span>
    </span>
  );
}

export function PaymentFormSelect(props: {
  forms: PaymentFormSummary[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const { forms, value, onChange, disabled = false } = props;
  return (
    <Dropdown
      value={value || undefined}
      onChange={onChange}
      disabled={disabled}
      placeholder="Select"
      className="w-full"
      triggerClassName="h-10 rounded-[8px] border-[#ebebeb]"
      panelClassName="py-1.5"
      options={forms.map((form) => ({
        value: form.id,
        label: form.name,
      }))}
      renderOption={(option, selected) => {
        const form = forms.find((row) => row.id === option.value);
        if (!form) return option.label;
        return <PaymentFormOptionRow form={form} selected={selected} />;
      }}
    />
  );
}
