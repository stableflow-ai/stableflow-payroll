import { IconCheck } from "@/components/icons";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { formatAmount } from "@/utils";
import { payableKeyId, type Payable } from "@/types/payable";
import { PaymentFormCategoryTag } from "./PaymentFormCategoryTag";

function PaymentFormOptionRow(props: {
  form: Payable;
  selected: boolean;
}) {
  const { form, selected } = props;
  return (
    <span className="flex w-full min-w-0 items-center gap-2">
      <PaymentFormCategoryTag category={form.type} />
      <span className="min-w-0 flex-1 truncate font-montserrat text-sm font-medium text-black">
        {form.title}
      </span>
      <span className="shrink-0 font-montserrat text-sm font-medium text-black">
        {formatAmount(form.totalPayout, { maxDecimals: 2, showDust: true })}
      </span>
      <span className="inline-flex size-3.5 shrink-0 items-center justify-center">
        {selected ? <IconCheck className="text-[#6284f5]" /> : null}
      </span>
    </span>
  );
}

export function PaymentFormSelect(props: {
  forms: Payable[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { forms, value, onChange, disabled = false, loading = false } = props;
  return (
    <Dropdown
      value={value || undefined}
      onChange={onChange}
      disabled={disabled}
      loading={loading}
      placeholder="Select"
      empty="No forms"
      className="w-full"
      triggerClassName="h-10 rounded-[8px] border-[#ebebeb]"
      panelClassName="max-h-60 overflow-y-auto py-1.5"
      options={forms.map((form) => ({
        value: payableKeyId(form.key),
        label: form.title,
      }))}
      renderOption={(option, selected) => {
        const form = forms.find((row) => payableKeyId(row.key) === option.value);
        if (!form) return option.label;
        return <PaymentFormOptionRow form={form} selected={selected} />;
      }}
    />
  );
}
