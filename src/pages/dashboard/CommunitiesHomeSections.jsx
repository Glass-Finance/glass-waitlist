import { Clock, Users } from "lucide-react";
import { formatNaira as sharedFormatNaira } from "../../utils/format";
import { isCommunityAdmin, roleKeyword } from "../../utils/communityRole";

function getTag(name = "") {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatNaira(amount) {
  return sharedFormatNaira(amount, { emptyDash: true });
}

export function CommunityCard({ community, onClick }) {
  const isAdmin = isCommunityAdmin(community);
  const roleKw =
    roleKeyword(community.memberRole, community.roleCode, community.role) ??
    (community.owned ? "OWNER" : "MEMBER");
  const roleLabel = roleKw.charAt(0) + roleKw.slice(1).toLowerCase();
  const tag = getTag(community.name ?? community.slug ?? "GC");
  const metrics = community.metrics ?? {};
  const memberCount = metrics.totalMembers ?? metrics.activeMembers ?? null;
  const totalCollected = metrics.collectedAmount;
  const outstanding = metrics.outstandingAmount;
  const memberStatus = community.memberStatus;
  const logoUrl = community.logo?.url ?? null;

  return (
    <div
      onClick={onClick}
      className="bg-surface-container rounded-lg border border-surface-container-border overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg flex flex-col"
    >
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={community.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
            ) : (
              <div
                className={`w-10 h-10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                  isAdmin
                    ? "bg-gradient-to-br from-[var(--color-brand)] to-[#4f6fe5]"
                    : "bg-gradient-to-br from-gray-500 to-gray-400"
                }`}
              >
                {tag}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-[#000000]">{community.name ?? community.slug}</p>
              {memberCount != null && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Users size={11} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400">{memberCount} Members</span>
                </div>
              )}
            </div>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 flex-shrink-0 ${
              isAdmin
                ? "text-brand bg-blue-50 border border-blue-100"
                : "text-gray-900 bg-gray-50 border border-gray-200"
            }`}
          >
            {roleLabel}
          </span>
        </div>
        <div className="w-full h-28 rounded-sm bg-gradient-to-br from-[#f0f2f8] to-[#e4e8f4]" />
      </div>

      <div className="px-5 py-3 border-t border-gray-50 bg-[#fafbff] flex items-center justify-between">
        {isAdmin ? (
          <>
            <span className="text-xs text-gray-500">
              Collected: <strong className="text-[#000000]">{totalCollected != null ? formatNaira(totalCollected) : "—"}</strong>
            </span>
            <span className="text-xs text-gray-500">
              Outstanding: <strong className="text-red-500">{outstanding != null && outstanding > 0 ? formatNaira(outstanding) : "—"}</strong>
            </span>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-gray-400" />
            <span className="text-xs text-gray-600">
              Status: <strong className="text-[#000000]">{memberStatus ?? "—"}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
