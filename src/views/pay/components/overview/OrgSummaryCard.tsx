import { Link } from "react-router-dom";
import { HEADER_AVATAR_SRC } from "@/components/layout/config";
import { nameInitials } from "@/components/recipient-avatar/RecipientAvatar";
import { Card } from "@/components/ui/card/Card";
import { MOCK_ORGANIZATION_NAME } from "@/views/pay/config";
import { OVERVIEW_LINK_CLASS } from "./config";

export function OrgSummaryCard(props: { ownerEmail: string; teamMemberCount: number }) {
  const { ownerEmail, teamMemberCount } = props;
  const initials = nameInitials(MOCK_ORGANIZATION_NAME);

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[#d9d9d9] font-montserrat text-lg font-semibold text-white"
        >
          {initials}
        </span>
        <h2 className="font-montserrat text-xl font-medium capitalize text-black">
          {MOCK_ORGANIZATION_NAME}
        </h2>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <section>
          <p className="font-montserrat text-base font-medium capitalize text-[#aaa]">Owner</p>
          <div className="mt-2.5 flex min-w-0 items-center gap-2.5">
            <img
              src={HEADER_AVATAR_SRC}
              alt=""
              className="size-[26px] shrink-0 rounded-[15px] object-cover"
            />
            <p className="truncate font-montserrat text-sm font-medium text-black">{ownerEmail}</p>
          </div>
        </section>
        <section>
          <p className="font-montserrat text-base font-medium capitalize text-[#aaa]">
            Team Members
          </p>
          <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
            <p className="font-montserrat text-base font-medium text-black">{teamMemberCount}</p>
            <Link to="/pay/team" className={OVERVIEW_LINK_CLASS}>
              View all →
            </Link>
          </div>
        </section>
        <section>
          <p className="font-montserrat text-base font-medium capitalize text-[#aaa]">
            Organization Settings
          </p>
          <Link to="/pay/setting" className={`${OVERVIEW_LINK_CLASS} mt-2.5 inline-block`}>
            Update Settings →
          </Link>
        </section>
      </div>
    </Card>
  );
}
