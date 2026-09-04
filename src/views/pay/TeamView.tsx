import { useMemo, useState } from "react";
import { RecipientAvatar } from "@/components/recipient-avatar/RecipientAvatar";
import { Pagination } from "@/components/ui/pagination/Pagination";
import { SearchInput } from "@/components/ui/search-input/SearchInput";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/Table";
import { useTeamMemberMutations, useTeamMembersQuery, type TeamMember } from "@/hooks/use-team-api";
import useToast from "@/hooks/use-toast";
import { organizationName } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import { TeamActionButtons } from "./components/setting/TeamActionButtons";
import { RemoveMemberDialog } from "./components/team/RemoveMemberDialog";
import { TeamInviteDialog } from "./components/team/TeamInviteDialog";
import { TeamMemberFormDialog } from "./components/team/TeamMemberFormDialog";
import { TeamMemberMenu } from "./components/team/TeamMemberMenu";
import { TeamPayNowDialog } from "./components/team/TeamPayNowDialog";
import { TeamWalletCell } from "./components/team/TeamWalletCell";
import { TEAM_PAGE_SIZE, TEAM_TABLE_COLUMNS } from "./components/team/config";
import { dash, memberDisplayWallet, memberMatchesSearch, organizationInviteUrl } from "./components/team/utils";

export function TeamView() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const query = useTeamMembersQuery();
  const { createMutation, updateMutation, removeMutation } = useTeamMemberMutations();
  const members = query.data ?? [];

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [paying, setPaying] = useState<TeamMember | null>(null);
  const [removing, setRemoving] = useState<TeamMember | null>(null);

  const filtered = useMemo(
    () => members.filter((row) => memberMatchesSearch(row, search)),
    [members, search],
  );
  const totalPage = Math.max(1, Math.ceil(filtered.length / TEAM_PAGE_SIZE));
  const safePage = Math.min(page, totalPage);
  const pageRows = filtered.slice((safePage - 1) * TEAM_PAGE_SIZE, safePage * TEAM_PAGE_SIZE);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(member: TeamMember) {
    setEditing(member);
    setFormOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-[1212px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          className="w-full sm:max-w-[230px]"
        />
        <TeamActionButtons
          onAddMember={openAdd}
          onInvite={() => setInviteOpen(true)}
        />
      </div>

      {query.isError ? (
        <p className="py-8 font-montserrat text-sm text-danger">
          {query.error instanceof Error ? query.error.message : "Failed to load team"}
        </p>
      ) : (
        <Table columns={TEAM_TABLE_COLUMNS}>
          <TableHeader>
            <TableHead>Name</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Wallet</TableHead>
            <TableHead />
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <p className="py-8 text-center font-montserrat text-sm text-[#909090]">
                {query.isPending ? "Loading team…" : "No members"}
              </p>
            ) : (
              pageRows.map((row) => {
                const wallet = memberDisplayWallet(row);
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <span className="inline-flex min-w-0 items-center gap-2.5">
                        <RecipientAvatar
                          name={row.name}
                          address={wallet ?? row.id}
                          className="size-8 text-[11px]"
                        />
                        <span className="truncate">{row.name}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="truncate">{dash(row.position)}</span>
                    </TableCell>
                    <TableCell>{dash(row.schedule)}</TableCell>
                    <TableCell>
                      <span className="truncate">{dash(row.email)}</span>
                    </TableCell>
                    <TableCell>
                      <TeamWalletCell address={wallet} />
                    </TableCell>
                    <TableCell className="justify-end">
                      <TeamMemberMenu
                        payDisabled={!wallet}
                        onEdit={() => openEdit(row)}
                        onPayNow={() => {
                          if (!wallet) {
                            toast.fail({ title: "Add a wallet first" });
                            return;
                          }
                          setPaying(row);
                        }}
                        onRemove={() => setRemoving(row)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}

      <div className="mt-4 flex justify-center sm:justify-end">
        <Pagination page={safePage} totalPage={totalPage} onPageChange={setPage} />
      </div>

      <TeamMemberFormDialog
        open={formOpen}
        member={editing}
        saving={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={(input) => {
          const save = editing
            ? updateMutation.mutateAsync({ id: editing.id, body: input })
            : createMutation.mutateAsync(input);
          void save
            .then(() => {
              setFormOpen(false);
              setEditing(null);
            })
            .catch((error) => {
              toast.fail({
                title: error instanceof Error ? error.message : "Failed to save member",
              });
            });
        }}
      />

      <TeamInviteDialog
        open={inviteOpen}
        url={organizationInviteUrl(window.location.origin, organizationName(user))}
        onClose={() => setInviteOpen(false)}
      />

      <TeamPayNowDialog
        open={Boolean(paying)}
        member={paying}
        onClose={() => setPaying(null)}
      />

      <RemoveMemberDialog
        open={Boolean(removing)}
        member={removing}
        onClose={() => setRemoving(null)}
        onConfirm={() => {
          if (!removing) return;
          void removeMutation.mutateAsync(removing.id).catch((error) => {
            toast.fail({
              title: error instanceof Error ? error.message : "Failed to remove member",
            });
          });
          setRemoving(null);
        }}
      />
    </div>
  );
}
