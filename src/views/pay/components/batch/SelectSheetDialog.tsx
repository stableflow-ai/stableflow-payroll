import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";

export function SelectSheetDialog(props: {
  open: boolean;
  spreadsheetName: string;
  titles: string[];
  busy: boolean;
  onClose: () => void;
  onSelect: (title: string) => void;
}) {
  const { open, spreadsheetName, titles, busy, onClose, onSelect } = props;
  return (
    <Dialog open={open} onClose={onClose} title="Select a sheet" cardClassName="w-full md:w-[400px]">
      <p className="mb-3 font-montserrat text-sm text-[#606060]">{spreadsheetName}</p>
      <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
        {titles.map((title) => (
          <Button
            key={title}
            variant="normal"
            className="w-full justify-start"
            disabled={busy}
            onClick={() => onSelect(title)}
          >
            {title}
          </Button>
        ))}
      </div>
    </Dialog>
  );
}
