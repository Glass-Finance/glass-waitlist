import { useCommunityGroups, isArchivedGroup } from "../../../hooks/useGroups";
import { Button } from "../../../components/ui/Button";

// ── Audience group picker ─────────────────────────────────────────────────────
// Shared by CreatePlanModal and EditPlanModal so the two paths can't drift on
// the one thing that has to agree: the exact set of group ids they send.
//
// The id sent is `group.id` — the COMMUNITY MEMBER GROUP record id. The backend
// resolves these with
// groupRepository.findByIdAndCommunity_Id(groupId, communityId), so anything
// else is a group that "does not exist" ("Community group not found").
//
// The groups query lives in this component rather than in either modal, exactly
// as AudienceMemberPicker does for members: the modal calls its hooks
// unconditionally, but this component is only mounted for a GROUP audience, so
// the common all-members plan never fetches the group list.
//
// ARCHIVED groups are not selectable. The backend enum is
// CommunityMemberGroupStatus { ACTIVE, ARCHIVED }, and once a payment link
// references a group that link cannot be deleted — only the group archived — so
// offering an archived group here would build a live plan pointing at a group
// that can never be cleaned up. Archived groups still load and render: an
// existing plan that references one must stay editable and readable.
export default function AudienceGroupPicker({ communityId, selected, onChange }) {
  // status=ACTIVE is a server-side filter, so archived groups don't even reach
  // the client in the common case. isArchivedGroup below is the belt-and-braces
  // half, in case the backend ever stops honouring it or returns a mixed page.
  const { data, isLoading, error } = useCommunityGroups(communityId, {
    status: "ACTIVE",
    // The list is paginated. A picker that silently showed only the first page
    // would make groups past the cut unselectable with no indication, so ask for
    // a page big enough that no realistic community hits it. The response's own
    // totalElements is not consulted here; a community past this would need a
    // searchable multi-select instead, which is a larger change than this one.
    pageSize: 200,
  });
  const chosen = selected ?? [];
  const groups = (data?.content ?? []).filter((g) => !isArchivedGroup(g));
  const archivedCount = (data?.content ?? []).length - groups.length;

  function toggle(id) {
    onChange(chosen.includes(id) ? chosen.filter((v) => v !== id) : [...chosen, id]);
  }

  if (isLoading) {
    return <p className="text-[11px] text-gray-400">Loading groups…</p>;
  }

  // A 403 is NOT "this community has no groups". The groups endpoint is behind
  // community.members.read, which the backend withholds from community staff
  // whose KYC isn't approved (AccessControlService downgrades a staff-role
  // member to COMMUNITY_MEMBER permissions). Telling such an admin the
  // community has no groups would send them off to create some, and the group
  // they create still wouldn't be listable. Say what actually happened.
  if (error) {
    const forbidden = error?.response?.status === 403;
    return (
      <p className="text-[11px] text-danger">
        {forbidden
          ? "Groups can't be loaded — your community permissions don't currently allow access to them. If you manage this community, approved identity verification may be required."
          : "Groups couldn't be loaded. Please try again."}
      </p>
    );
  }

  if (groups.length === 0) {
    return (
      <p className="text-[11px] text-gray-400">
        {archivedCount > 0
          ? "This community has no active groups — its groups are all archived, and a plan can only bill active ones. Restore a group from the Groups page first."
          : "This community has no groups yet — create one on the Groups page before billing a group."}
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-gray-500">
          {chosen.length} of {groups.length} selected
        </span>
        <div className="flex gap-2">
          <Button
            variant="tertiary"
            size="sm"
            fullWidth={false}
            onClick={() => onChange(groups.map((g) => g.id))}
          >
            Select all
          </Button>
          <Button
            variant="tertiary"
            size="xs"
            fullWidth={false}
            onClick={() => onChange([])}
            disabled={chosen.length === 0}
            type="button"
          >
            Clear
          </Button>
        </div>
      </div>
      <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
        {groups.map((group) => {
          const checked = chosen.includes(group.id);
          return (
            <label
              key={group.id}
              className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(group.id)}
                className="w-3.5 h-3.5 accent-brand cursor-pointer"
              />
              <span className="truncate">{group.name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
