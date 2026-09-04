import { IconLink } from "@/components/icons/link";
import { IconPlus } from "@/components/icons/plus";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button/config";

export function TeamActionButtons(props: {
  onAddMember: () => void;
  onInvite: () => void;
}) {
  const { onAddMember, onInvite } = props;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant={BUTTON_VARIANT.Normal}
        size={BUTTON_SIZE.Sm}
        className="h-9 rounded-[8px] border-dashed border-[#aaa] bg-white px-3 text-black shadow-[0_0_6px_0_rgba(0,0,0,0.06)]"
        onClick={onAddMember}
      >
        <IconPlus className="size-3.5 shrink-0" />
        Add Member
      </Button>
      <Button
        size={BUTTON_SIZE.Sm}
        className="h-9 min-w-[120px] rounded-[8px] px-3"
        onClick={onInvite}
      >
        <IconLink className="size-3.5 shrink-0 text-white" />
        Invite
      </Button>
    </div>
  );
}
