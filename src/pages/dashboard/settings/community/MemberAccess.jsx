import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useActiveCommunityId } from "../../../../hooks/useActiveCommunityId";
import { useCommunityMembers, useRoles } from "../../../../hooks/useCommunityMembers";
import QRCodeCanvas from "../../../../components/dashboard/QRCode";

const FALLBACK_MEMBER_ROLE = { id: "MEMBER", name: "Member" };

export default function MemberAccess() {
  const communityId = useActiveCommunityId();
  const [copied, setCopied] = useState(false);
  const { members, isLoading, removeMember, updateMember } = useCommunityMembers(communityId);
  const { data: rolesData } = useRoles();
  const memberRoleId = (rolesData ?? []).find((r) => r.name?.toLowerCase() === "member")?.id
    ?? FALLBACK_MEMBER_ROLE.id;

  const inviteLink = communityId ? `https://app.glasspay.app/join/${communityId}` : null;

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

      {/* Invite Link + QR */}
      <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E5E7EB" }}>
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
      <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">Admin management</p>
        <p className="text-xs text-gray-500 mb-4">Promote members to admin or revoke admin access.</p>

        <div className="flex flex-col">
          {isLoading ? (
            <p className="text-xs text-gray-400 py-3">Loading…</p>
          ) : members.length === 0 ? (
            <p className="text-xs text-gray-400 py-3">No members yet.</p>
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
                <button
                  onClick={() => {
                    const isAdmin = isAdminRole(member);
                    if (isAdmin) {
                      if (window.confirm(`Revoke admin access for ${memberName(member)}? They'll remain a member.`)) {
                        updateMember.mutate({ memberId: member.id, payload: { roleId: memberRoleId } });
                      }
                    } else if (window.confirm(`Remove ${memberName(member)} from this community?`)) {
                      removeMember.mutate(member.id);
                    }
                  }}
                  disabled={removeMember.isPending || updateMember.isPending}
                  className="text-sm font-semibold hover:opacity-70 transition-all bg-transparent border-none cursor-pointer disabled:opacity-50"
                  style={{ color: "#EF4444" }}
                >
                  {isAdminRole(member) ? "Revoke" : "Remove"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}