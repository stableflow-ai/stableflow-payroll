import { useState } from "react";
import { useTeamMemberMutations, type TeamMember } from "@/hooks/use-team-api";
import useToast from "@/hooks/use-toast";
import { organizationName, userRole } from "@/lib/auth-role";
import { useAuthStore } from "@/stores/auth";
import { AUTH_USER_ROLE } from "@/types/auth";
import { IntegrationCard } from "./components/setting/IntegrationCard";
import { OrganizationCard } from "./components/setting/OrganizationCard";
import { ProfileCard } from "./components/setting/ProfileCard";
import { TeamInviteDialog } from "./components/team/TeamInviteDialog";
import { TeamMemberFormDialog } from "./components/team/TeamMemberFormDialog";
import { organizationInviteUrl } from "./components/team/utils";

export function SettingView() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const isAdmin = userRole(user) !== AUTH_USER_ROLE.Employee;
  const { createMutation, updateMutation } = useTeamMemberMutations();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-[1212px] flex-col gap-5">
      <ProfileCard />
      {isAdmin ? (
        <>
          <OrganizationCard
            onAddMember={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            onInvite={() => setInviteOpen(true)}
          />
          <IntegrationCard />
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
        </>
      ) : null}
    </div>
  );
}
