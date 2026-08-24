import { useLayoutEffect, useRef } from "react";
import { IconArrowDown } from "@/components/icons/arrow-down";
import { IconQuestion } from "@/components/icons/question";
import { Switch } from "@/components/ui/switch/Switch";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { cn } from "@/lib/utils";
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MAX_ROWS,
} from "../../config";

const LINE_HEIGHT_PX = 20;
const TEXTAREA_PADDING_Y_PX = 16;
const TEXTAREA_MAX_HEIGHT_PX = LINE_HEIGHT_PX * DESCRIPTION_MAX_ROWS + TEXTAREA_PADDING_Y_PX;

export function AdvanceOption(props: {
  open: boolean;
  onToggle: () => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  receivePrivately: boolean;
  privatelyLoading?: boolean;
  onReceivePrivatelyChange: (checked: boolean) => void;
}) {
  const {
    open,
    onToggle,
    description,
    onDescriptionChange,
    receivePrivately,
    privatelyLoading = false,
    onReceivePrivatelyChange,
  } = props;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT_PX)}px`;
  }, [description, open]);

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3"
        aria-expanded={open}
      >
        <span className="font-montserrat text-sm font-medium text-[#606060]">
          Advance Option
        </span>
        <IconArrowDown
          className={cn(
            "h-1.5 w-2.5 shrink-0 text-black/60 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-4">
            <p className="font-montserrat text-sm font-medium text-[#606060]">
              Description
            </p>
            <textarea
              ref={textareaRef}
              value={description}
              maxLength={DESCRIPTION_MAX_LENGTH}
              rows={1}
              onChange={(event) => onDescriptionChange(event.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
              placeholder="e.g. invoice for business trip"
              className="mt-2 min-h-9 w-full resize-none overflow-y-auto rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-3 py-2 font-montserrat text-sm leading-5 text-black outline-none placeholder:text-black/30"
              style={{ maxHeight: TEXTAREA_MAX_HEIGHT_PX }}
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
        </div>
      </div>
    </div>
  );
}
