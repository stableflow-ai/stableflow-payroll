import { useState } from "react";
import { IconCopy, IconDelete, IconLoading, IconPen, IconPlus } from "@/components/icons";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE } from "@/components/ui/button/config";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/Table";
import { usePartnerKeyMutations, usePartnerKeysQuery } from "@/hooks/use-partner-api";
import useToast from "@/hooks/use-toast";
import type { PayPartnerKey } from "@/types/partner";
import { formatDate } from "@/utils";
import { API_KEY_DIALOG_MODE, ApiKeyDialog, type ApiKeyDialogMode } from "./components/ApiKeyDialog";
import { DeleteApiKeyDialog } from "./components/DeleteApiKeyDialog";
import { API_KEY_TABLE_COLUMNS } from "./config";
import { maskApiKey, partnerApiError } from "./utils";

export function ApiKeysView() {
  const keysQuery = usePartnerKeysQuery();
  const { createMutation, updateMutation, deleteMutation } = usePartnerKeyMutations();
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<ApiKeyDialogMode>(API_KEY_DIALOG_MODE.Create);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<PayPartnerKey | null>(null);

  const apiKeys = keysQuery.data ?? [];
  const editingKey = apiKeys.find((row) => row.id === editingId);

  const openCreate = () => {
    setDialogMode(API_KEY_DIALOG_MODE.Create);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (id: number) => {
    setDialogMode(API_KEY_DIALOG_MODE.Edit);
    setEditingId(id);
    setDialogOpen(true);
  };

  const copyKey = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success({ title: "Copied" });
    } catch {
      toast.fail({ title: "Could not copy" });
    }
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const id = deleting.id;
    setDeleting(null);
    void deleteMutation.mutateAsync(id).catch((error) => {
      toast.fail({ title: partnerApiError(error, "Could not delete API key") });
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-montserrat text-[26px] font-semibold text-black">API keys</h1>
          <p className="mt-3 max-w-[1115px] font-montserrat text-sm font-medium text-[#606060]">
            Your API keys are listed below. Do not share your API key with others, or expose it in
            the browser or other client-side code.
          </p>
        </div>
        <Button
          size={BUTTON_SIZE.Md}
          className="h-10 shrink-0 rounded-[20px] px-5 lg:w-auto"
          onClick={openCreate}
        >
          <IconPlus className="size-3 shrink-0" />
          Create New API Key
        </Button>
      </div>

      <div className="mx-auto w-full max-w-[1212px]">
        <Table columns={API_KEY_TABLE_COLUMNS} className="p-5">
        <TableHeader>
          <TableHead>Label</TableHead>
          <TableHead>Key</TableHead>
          <TableHead>Created</TableHead>
          <TableHead />
        </TableHeader>
        {keysQuery.isPending ? (
          <div className="flex justify-center py-20 lg:py-[150px]">
            <IconLoading className="size-6 animate-spin text-[#909090]" />
          </div>
        ) : keysQuery.isError ? (
          <p className="py-20 text-center font-montserrat text-sm font-medium text-danger lg:py-[150px]">
            {partnerApiError(keysQuery.error, "Failed to load API keys")}
          </p>
        ) : apiKeys.length === 0 ? (
          <p className="py-20 text-center font-montserrat text-sm font-medium text-[#aaa] lg:py-[150px]">
            No API key, you can{" "}
            <button type="button" className="cursor-pointer text-black" onClick={openCreate}>
              Create new API key
            </button>.
          </p>
        ) : (
          <TableBody>
            {apiKeys.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.label}</TableCell>
                <TableCell>
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <span className="truncate">{maskApiKey(row.apiKey)}</span>
                    <button
                      type="button"
                      className="shrink-0 cursor-pointer text-[#909090] hover:text-black"
                      aria-label="Copy API key"
                      onClick={() => {
                        void copyKey(row.apiKey);
                      }}
                    >
                      <IconCopy className="size-3" />
                    </button>
                  </span>
                </TableCell>
                <TableCell>{formatDate(row.createdAt)}</TableCell>
                <TableCell className="justify-end gap-3">
                  <button
                    type="button"
                    className="cursor-pointer text-[#909090] hover:text-black"
                    aria-label="Edit API key"
                    onClick={() => openEdit(row.id)}
                  >
                    <IconPen className="size-3" />
                  </button>
                  <button
                    type="button"
                    className="cursor-pointer text-[#909090] hover:text-danger"
                    aria-label="Delete API key"
                    onClick={() => setDeleting(row)}
                  >
                    <IconDelete className="size-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
        </Table>
      </div>

      <ApiKeyDialog
        open={dialogOpen}
        mode={dialogMode}
        initialLabel={editingKey?.label ?? ""}
        onClose={() => setDialogOpen(false)}
        onCreate={async (label) => {
          const created = await createMutation.mutateAsync({ label });
          return created.apiKey;
        }}
        onUpdate={async (label) => {
          if (editingId == null) return;
          await updateMutation.mutateAsync({ id: editingId, label });
        }}
      />

      <DeleteApiKeyDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        apiKey={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
