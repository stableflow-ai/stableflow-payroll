import { IconDownload } from "@/components/icons/download";
import { IconPlus } from "@/components/icons/plus";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_VARIANT } from "@/components/ui/button/config";
import { downloadImportCsvTemplate } from "@/views/pay/components/import-csv/download-template";
import type { BonusPendingRow } from "@/types/bonus";
import { IMPORT_CSV_TEMPLATE, IMPORT_CSV_TEMPLATE_FILENAME } from "../../config";
import { BonusImportCsvButton } from "./BonusImportCsvButton";

export function CreateBonusEmpty(props: {
  onAddBonus: () => void;
  onImported: (rows: BonusPendingRow[]) => void;
  busy?: boolean;
}) {
  const { onAddBonus, onImported, busy = false } = props;

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-4 py-16">
      <p className="font-montserrat text-base font-semibold text-black">
        Import or Add Bonus
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <Button
          variant={BUTTON_VARIANT.Normal}
          className="h-10 w-full rounded-[10px] border-black/10 px-4 text-sm text-black sm:w-auto sm:min-w-[193px]"
          onClick={() => downloadImportCsvTemplate(IMPORT_CSV_TEMPLATE, IMPORT_CSV_TEMPLATE_FILENAME)}
        >
          <IconDownload className="size-3.5 shrink-0" />
          Download Template
        </Button>
        <BonusImportCsvButton
          onImported={onImported}
          busy={busy}
          className="h-10 w-full rounded-[10px] px-4 text-sm sm:w-auto sm:min-w-[167px]"
        />
        <span className="hidden font-montserrat text-sm font-medium text-black sm:inline">
          or
        </span>
        <Button
          className="h-10 w-full rounded-[10px] px-4 text-sm sm:w-auto sm:min-w-[147px]"
          disabled={busy}
          onClick={onAddBonus}
        >
          <IconPlus className="size-3 shrink-0" />
          Add Bonus
        </Button>
      </div>
    </div>
  );
}
