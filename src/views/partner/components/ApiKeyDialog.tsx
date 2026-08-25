import { useEffect, useState } from "react";
import { IconCopy } from "@/components/icons";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE } from "@/components/ui/button/config";
import { Dialog } from "@/components/ui/dialog/Dialog";
import useToast from "@/hooks/use-toast";
import { API_KEY_LABEL_MAX_LENGTH } from "../config";
import { partnerApiError } from "../utils";

export const API_KEY_DIALOG_MODE = {
  Create: "create",
  Edit: "edit",
} as const;

export type ApiKeyDialogMode = (typeof API_KEY_DIALOG_MODE)[keyof typeof API_KEY_DIALOG_MODE];

type ApiKeyDialogProps = {
  open: boolean;
  mode: ApiKeyDialogMode;
  initialLabel?: string;
  onClose: () => void;
  onCreate: (label: string) => Promise<string>;
  onUpdate: (label: string) => Promise<void>;
};

export function ApiKeyDialog(props: ApiKeyDialogProps) {
  const { open, mode, initialLabel = "", onClose, onCreate, onUpdate } = props;
  const toast = useToast();
  const [label, setLabel] = useState(initialLabel);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLabel(initialLabel);
    setCreatedKey(null);
    setSubmitting(false);
  }, [open, initialLabel]);

  const isEdit = mode === API_KEY_DIALOG_MODE.Edit;
  const title = isEdit ? "Edit API Key" : "Create New API Key";

  const copyKey = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success({ title: "Copied" });
    } catch {
      toast.fail({ title: "Could not copy" });
    }
  };

  const submitLabel = async () => {
    const next = label.trim();
    if (!next) {
      toast.fail({ title: "Key label is required" });
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit) {
        await onUpdate(next);
        onClose();
        return;
      }
      setCreatedKey(await onCreate(next));
    } catch (error) {
      toast.fail({
        title: partnerApiError(error, isEdit ? "Could not update API key" : "Could not create API key"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} closeOnMaskClick={!submitting}>
      {createdKey ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <p className="font-montserrat text-sm font-medium text-[#606060]">Key</p>
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 break-all font-montserrat text-sm font-medium text-black">
                {createdKey}
              </p>
              <Button
                size={BUTTON_SIZE.Sm}
                className="h-[30px] shrink-0 rounded-[8px] px-3"
                onClick={() => {
                  void copyKey(createdKey);
                }}
              >
                <IconCopy className="size-3 shrink-0 text-white" />
                Copy
              </Button>
            </div>
          </div>
          <p className="font-montserrat text-sm font-medium text-black">
            Notice：Do not share your API key with others, or expose it in the browser or other
            client-side code.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="api-key-label" className="font-montserrat text-sm font-medium text-[#606060]">
              Key Label
            </label>
            <input
              id="api-key-label"
              type="text"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Name of API key"
              maxLength={API_KEY_LABEL_MAX_LENGTH}
              className="h-9 w-full rounded-[6px] border border-[#e3e3e3] bg-white px-3 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30 focus:border-[#c8c8c8]"
            />
          </div>
          <Button size={BUTTON_SIZE.Lg} className="w-full" loading={submitting} onClick={() => void submitLabel()}>
            {isEdit ? "Update" : "Create"}
          </Button>
        </div>
      )}
    </Dialog>
  );
}
