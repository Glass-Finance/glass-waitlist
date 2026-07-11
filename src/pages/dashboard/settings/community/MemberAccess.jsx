import { useState } from "react";
import { Copy, Check, Users } from "lucide-react";
import { useActiveCommunityId } from "../../../../hooks/useActiveCommunityId";
import { useCommunityMembers, useRoles } from "../../../../hooks/useCommunityMembers";
import { useCommunity, useUpdateCommunitySettings } from "../../../../hooks/useCommunity";
import QRCodeCanvas from "../../../../components/dashboard/QRCode";
import { APP_ORIGIN } from "../../../../utils/deviceRedirect";
import LoadingState from "../../../../components/common/LoadingState";
import EmptyState from "../../../../components/common/EmptyState";

function Toggle({ on, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      className={`flex items-center gap-1.5 flex-shrink-0 bg-transparent border-none p-0 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <div className={`relative w-8 h-[20px] rounded-full transition-all duration-300 ${on ? "bg-[#002FA7]" : "bg-gray-300"}`}>
        <div className={`absolute top-0.5 w-[14px] h-[14px] rounded-full bg-white shadow transition-all duration-300 ${on ? "left-[16px]" : "left-0.5"}`} />
      </div>
      <span className={`text-xs font-medium ${on ? "text-gray-600" : "text-gray-400"}`}>{on ? "On" : "Off"}</span>
    </button>
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
  // roleCode is the real field (OWNER/ADMIN/MANAGER/MEMBER) — not a `role`
  // object/string, which doesn't exist on the member entity at all and was
  // silently falling back to "Member" for every single member.
  function memberRoleLabel(m) {
    const code = (m.roleCode ?? "").toUpperCase();
    if (code === "OWNER") return "Owner";
    if (code === "ADMIN") return "Admin";
    if (code === "MANAGER") return "Manager";
    return "Member";
  }
  const isAdminRole = (m) => ["OWNER", "ADMIN", "MANAGER"].includes((m.roleCode ?? "").toUpperCase());

  return (
    <div className="flex flex-col gap-4 max-w-3xl w-full">

      {/* Joining & visibility */}
      <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E5E7EB" }}>
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
          />
        </div>
      </div>

      {/* Invite Link + QR */}
      <div className="bg-[#EFEFF1E5] rounded-2xl p-5" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Invite Link</p>
        <p className="text-xs text-gray-500 mb-4">
          Share this link or QR code with members so they can join your community on Glass.
        </p>
        <div className="flex items-center gap-4">
          {inviteLink && (
            <div className="p-2 bg-white rounded-xl flex-shrink-0" style={{ border: "1px solid #E5E7EB" }}>
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
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-[#002FA7] hover:opacity-90 transition-all border-none cursor-pointer flex-shrink-0 disabled:opacity-50"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      </div>

      {/* Admin Management */}
      <div className="bg-[#EFEFF1E5] rounded-2xl p-5" style={{ border: "1px solid #E5E7EB" }}>
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
                style={{ borderBottom: i < members.length - 1 ? "1px solid #F3F4F6" : "none" }}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{memberName(member)}</p>
                    <p className="text-xs text-gray-500">{memberEmail(member)}</p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{
                      color:      isAdminRole(member) ? "#002FA7" : "#D97706",
                      background: isAdminRole(member) ? "#EEF2FF" : "#FEF3C7",
                    }}
                  >
                    {memberRoleLabel(member)}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {isAdminRole(member) ? (
                    <button
                      onClick={() => {
                        if (window.confirm(`Revoke admin access for ${memberName(member)}? They'll remain a member.`)) {
                          updateMember.mutate({ memberId: member.id, payload: { roleId: memberRoleId } });
                        }
                      }}
                      disabled={removeMember.isPending || updateMember.isPending}
                      className="text-sm font-semibold hover:opacity-70 transition-all bg-transparent border-none cursor-pointer disabled:opacity-50"
                      style={{ color: "#EF4444" }}
                    >
                      Revoke
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          if (window.confirm(`Promote ${memberName(member)} to admin?`)) {
                            updateMember.mutate({ memberId: member.id, payload: { roleId: adminRoleId } });
                          }
                        }}
                        disabled={!adminRoleId || removeMember.isPending || updateMember.isPending}
                        className="text-sm font-semibold hover:opacity-70 transition-all bg-transparent border-none cursor-pointer disabled:opacity-50"
                        style={{ color: "#002FA7" }}
                      >
                        Promote
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Remove ${memberName(member)} from this community?`)) {
                            removeMember.mutate(member.id);
                          }
                        }}
                        disabled={removeMember.isPending || updateMember.isPending}
                        className="text-sm font-semibold hover:opacity-70 transition-all bg-transparent border-none cursor-pointer disabled:opacity-50"
                        style={{ color: "#EF4444" }}
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}