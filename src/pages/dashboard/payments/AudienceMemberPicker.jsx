import { useCommunityMembers } from "../../../hooks/useCommunityMembers";
import { resolveDisplayName } from "../../../utils/memberName";

// ── Audience member picker ──────────────────────────────────────────────────
// Shared by CreatePlanModal and EditPlanModal so the two paths can't drift on
// the one thing that has to agree: the exact set of member ids they send.
//
// The id sent is `member.id` — the COMMUNITY MEMBER record id, not the user's
// id. The backend resolves these with
// memberRepository.findAllByCommunity_IdAndIdIn(...), so a userId here is
// silently a member that doesn't exist ("One or more community members were
// not found"). `CommunityMemberResponse` carries both, which makes this easy
// to get wrong and worth stating once.
//
// The members query lives in this component rather than in either modal so it
// only runs while the picker is on screen: the modal calls a hook
// unconditionally, but this component is only mounted for a
// SELECTED_MEMBERS audience, so the common "all members" plan never fetches
// the member list.
export default function AudienceMemberPicker({ communityId, selected, onChange }) {
  const { members, isLoading } = useCommunityMembers(communityId);
  const chosen = selected ?? [];

  function toggle(id) {
    onChange(chosen.includes(id) ? chosen.filter((v) => v !== id) : [...chosen, id]);
  }

  if (isLoading) {
    return <p className="text-[11px] text-gray-400">Loading members…</p>;
  }

  if (members.length === 0) {
    return (
      <p className="text-[11px] text-gray-400">
        This community has no members yet — invite members before creating a plan for specific
        people.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-gray-500">
          {chosen.length} of {members.length} selected
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(members.map((m) => m.id))}
            className="text-[11px] text-brand hover:underline bg-transparent border-none cursor-pointer p-0"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={chosen.length === 0}
            className="text-[11px] text-gray-500 hover:underline bg-transparent border-none cursor-pointer p-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
        {members.map((member) => {
          const checked = chosen.includes(member.id);
          return (
            <label
              key={member.id}
              className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(member.id)}
                className="w-3.5 h-3.5 accent-brand cursor-pointer"
              />
              <span className="truncate">{resolveDisplayName(member)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
