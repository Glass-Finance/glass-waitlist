import { useState } from "react";
import { Copy, Check, Users, MoreVertical } from "lucide-react";
import { roleKeyword } from "../../../../utils/communityRole";
import { useActiveCommunityId } from "../../../../hooks/useActiveCommunityId";
import { useCommunityMembers, useRoles } from "../../../../hooks/useCommunityMembers";
import { useCommunity, useUpdateCommunitySettings } from "../../../../hooks/useCommunity";
import QRCodeCanvas from "../../../../components/dashboard/QRCode";
import { APP_ORIGIN } from "../../../../utils/deviceRedirect";
import LoadingState from "../../../../components/common/LoadingState";
import EmptyState from "../../../../components/common/EmptyState";
import Toggle from "../../../../components/common/Toggle";

// Per-member "⋯" actions menu — one open at a time (state lives in the page),
// dismissed by the invisible full-screen overlay behind it.
function MemberActionsMenu({ open, onToggle, onClose, busy, actions }) {
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={onToggle}
        disabled={busy}
        aria-label="Member actions"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 bg-transparent border-none cursor-pointer transition-colors disabled:opacity-50"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div
            className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl overflow-hidden min-w-[190px]"
            style={{ border: "1px solid #E5E7EB", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
          >
            {actions.map((a) => (
              <button
                key={a.label}
                disabled={a.disabled || busy}
                onClick={() => {
                  onClose();
                  a.onClick();
                }}
                className={`block w-full text-left px-4 py-2.5 text-xs font-medium bg-white hover:bg-gray-50 border-none cursor-pointer transition-colors disabled:opacity-50 ${
                  a.danger ? "text-red-600" : "text-gray-700"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const FALLBACK_MEMBER_ROLE = { id: "MEMBER", name: "Member" };

// The role name field's exact casing/wording isn't guaranteed by the
// backend, and an exact-match lookup that fails leaves the Promote button
// silently disabled forever (no error, nothing to click) -- so try the
// stable roleCode/code enum first, then fall back to a looser name match.
function findRoleId(roles, code) {
  const list = roles ?? [];
  return (
    list.find((r) => (r.code ?? r.roleCode ?? "").toUpperCase() === code)?.id ??
    list.find((r) => (r.name ?? "").trim().toLowerCase() === code.toLowerCase())?.id ??
    list.find((r) => (r.name ?? "").toLowerCase().includes(code.toLowerCase()))?.id
  );
}

export default function MemberAccess() {
  // useActiveCommunityId() returns the community slug (preferred over id)
  // since both the Sidebar and CommunitiesHome set ?community= to the slug.
  const communitySlug = useActiveCommunityId();
  const [copied, setCopied] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const { members, isLoading, removeMember, updateMember } = useCommunityMembers(communitySlug);
  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const { data: community, isLoading: communityLoading } = useCommunity(communitySlug);
  const updateSettings = useUpdateCommunitySettings(communitySlug);
  const memberRoleId = findRoleId(rolesData, "MEMBER") ?? FALLBACK_MEMBER_ROLE.id;
  const adminRoleId = findRoleId(rolesData, "ADMIN");

  const inviteLink = communitySlug
    ? `${APP_ORIGIN}/member/join?community=${communitySlug}`
    : null;

  const handleCopy = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  function memberName(m) {
    const first = m.user?.firstName ?? m.firstName ?? "";
    const last = m.user?.lastName ?? m.lastName ?? "";
    return `${first} ${last}`.trim() || m.user?.email || m.email || "Member";
  }
  const memberEmail = (m) => m.user?.email ?? m.email ?? "—";
  // Role strings vary by endpoint ("ADMIN"/"COMMUNITY_ADMIN"/"Community
  // Admin") — match by keyword via roleKeyword, never exact-match. Exact
  // matching here previously made promoted admins read as plain members,
  // so they could be promoted again but never demoted.
  const memberRoleKw = (m) => roleKeyword(m.roleCode, m.memberRole, m.role) ?? "MEMBER";
  function memberRoleLabel(m) {
    const kw = memberRoleKw(m);
    if (kw === "OWNER") return "Owner";
    if (kw === "ADMIN") return "Admin";
    if (kw === "MANAGER") return "Manager";
    return "Member";
  }
  const isOwnerRole = (m) => memberRoleKw(m) === "OWNER";
  const isAdminRole = (m) => ["OWNER", "ADMIN", "MANAGER"].includes(memberRoleKw(m));

  return (
    <div className="flex flex-col gap-4 max-w-3xl w-full">

      {/* Joining & visibility */}
      <div className="bg-surface-container rounded-2xl p-5" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Joining &amp; visibility</p>
        <p className="text-xs text-gray-500 mb-4">
          Control how new members find and join this community.
        </p>

        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="min-w-0 pr-4">
            <p className="text-xs font-medium text-gray-900 m-0">Require approval to join</p>
            <p className="text-xs text-gray-500 mt-0.5 m-0">
              New join requests wait in{" "}
              <span className="font-medium text-gray-700">Join Requests</span> until
              an admin approves them. When off, anyone can join instantly from
              Discover or an invite link.
            </p>
          </div>
          <Toggle
            on={!!community?.requiresMemberApproval}
            disabled={communityLoading || !community}
            onChange={(v) => updateSettings.mutate({ requiresMemberApproval: v })}
            showLabel
          />
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="min-w-0 pr-4">
            <p className="text-xs font-medium text-gray-900 m-0">Show in Discover</p>
            <p className="text-xs text-gray-500 mt-0.5 m-0">
              List this community in the public Discover Communities search.
              When off, people can only join through your invite link.
            </p>
          </div>
          <Toggle
            on={!!community?.publicVisible}
            disabled={communityLoading || !community}
            onChange={(v) => updateSettings.mutate({ publicVisible: v })}
            showLabel
          />
        </div>
      </div>

      {/* Invite Link + QR */}
      <div className="bg-surface-container rounded-2xl p-5" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Invite Link</p>
        <p className="text-xs text-gray-500 mb-4">
          Share this link or QR code with members so they can join your community on Glass.
        </p>
        <div className="flex items-center gap-4">
          {inviteLink && (
            <div className="flex-shrink-0">
              <QRCodeCanvas value={inviteLink} size={96} />
            </div>
          )}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl flex-1 min-w-0"
            style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}
          >
            <span className="text-sm text-gray-700 font-medium truncate">
              {inviteLink ?? "Select a community to generate an invite link"}
            </span>
            <button
              onClick={handleCopy}
              disabled={!inviteLink}
              className="flex items-center gap-1 text-xs font-medium text-brand bg-transparent hover:opacity-70 transition-all border-none cursor-pointer flex-shrink-0 disabled:opacity-50"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      </div>

      {/* Admin Management */}
      <div className="bg-surface-container rounded-2xl p-5" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Admin management</p>
        <p className="text-xs text-gray-500 mb-4">Promote members to admin or revoke admin access.</p>
        {!rolesLoading && !adminRoleId && (
          <p className="text-xs text-red-500 mb-3">
            Couldn't find an Admin role on the server — Promote is disabled until this is resolved.
          </p>
        )}

        <div className="flex flex-col">
          {isLoading ? (
            <LoadingState className="py-3" />
          ) : members.length === 0 ? (
            <EmptyState icon={Users} title="No members yet" subtitle="Share the invite link above to start bringing members into this community." />
          ) : (
            members.map((member, i) => (
              <div
                key={member.id ?? i}
                className="flex items-center justify-between py-3"
                style={{ borderBottom: i < members.length - 1 ? "1px solid var(--color-stacked-container)" : "none" }}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{memberName(member)}</p>
                    <p className="text-xs text-gray-500">{memberEmail(member)}</p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{
                      color:      isAdminRole(member) ? "var(--color-brand)" : "#D97706",
                      background: isAdminRole(member) ? "#EEF2FF" : "#FEF3C7",
                    }}
                  >
                    {memberRoleLabel(member)}
                  </span>
                </div>
                {/* Owners can't be demoted or removed from here — no menu. */}
                {!isOwnerRole(member) && (
                  <MemberActionsMenu
                    open={openMenuId === member.id}
                    onToggle={() =>
                      setOpenMenuId((id) => (id === member.id ? null : member.id))
                    }
                    onClose={() => setOpenMenuId(null)}
                    busy={removeMember.isPending || updateMember.isPending}
                    actions={[
                      isAdminRole(member)
                        ? {
                            label: "Demote to Member",
                            onClick: () => {
                              if (window.confirm(`Demote ${memberName(member)} to member? They'll lose dashboard access.`)) {
                                updateMember.mutate({ memberId: member.id, payload: { roleId: memberRoleId } });
                              }
                            },
                          }
                        : {
                            label: "Promote to Admin",
                            disabled: !adminRoleId,
                            onClick: () => {
                              if (window.confirm(`Promote ${memberName(member)} to admin? They'll get dashboard access to this community.`)) {
                                updateMember.mutate({ memberId: member.id, payload: { roleId: adminRoleId } });
                              }
                            },
                          },
                      {
                        label: "Remove from community",
                        danger: true,
                        onClick: () => {
                          if (window.confirm(`Remove ${memberName(member)} from this community?`)) {
                            removeMember.mutate(member.id);
                          }
                        },
                      },
                    ]}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}