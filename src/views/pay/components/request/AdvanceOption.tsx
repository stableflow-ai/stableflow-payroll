import { IconQuestion } from "@/components/icons/question";
import { Switch } from "@/components/ui/switch/Switch";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import {
  DESCRIPTION_MAX_LENGTH,
  PAYMENT_NAME_MAX_LENGTH,
} from "../../config";

const FIELD_CLASS =
  "mt-2 h-9 w-full rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-3 font-montserrat text-sm text-black outline-none placeholder:text-black/30";

export function AdvanceOption(props: {
  paymentName: string;
  onPaymentNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  receivePrivately: boolean;
  privatelyLoading?: boolean;
  onReceivePrivatelyChange: (checked: boolean) => void;
}) {
  const {
    paymentName,
    onPaymentNameChange,
    description,
    onDescriptionChange,
    receivePrivately,
    privatelyLoading = false,
    onReceivePrivatelyChange,
  } = props;

  return (
    <div className="mt-6">
      <p className="font-montserrat text-sm font-medium text-[#606060]">
        Payment Name
      </p>
      <input
        value={paymentName}
        maxLength={PAYMENT_NAME_MAX_LENGTH}
        onChange={(event) => onPaymentNameChange(event.target.value.slice(0, PAYMENT_NAME_MAX_LENGTH))}
        placeholder="e.g. invoice for business trip"
        className={FIELD_CLASS}
      />

      <div className="mt-4 flex items-center justify-start gap-2">
        <p className="font-montserrat text-sm font-medium text-[#606060]">
          Description
        </p>
        <p className="font-montserrat text-sm font-medium capitalize text-[#aaa]">
          Optional
        </p>
      </div>
      <input
        value={description}
        maxLength={DESCRIPTION_MAX_LENGTH}
        onChange={(event) => onDescriptionChange(event.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
        placeholder="e.g. detail of invoice or attachment link"
        className={FIELD_CLASS}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-1 font-montserrat text-sm font-medium text-[#606060]">
          Receive Privately
          <Tooltip content="Your payment will receive by a private wallet. You need to manually withdraw after receiving payment." className="w-[285px]">
            <IconQuestion className="size-3.5 shrink-0 text-[#606060]" />
          </Tooltip>
        </span>
        <Switch
          checked={receivePrivately}
          disabled={privatelyLoading}
          onCheckedChange={onReceivePrivatelyChange}
          aria-label="Receive Privately"
        />
      </div>
    </div>
  );
}
