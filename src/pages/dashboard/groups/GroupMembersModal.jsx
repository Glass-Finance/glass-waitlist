import { useMemo, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Search, Plus, X } from "lucide-react";
import ModalShell from "../../../components/dashboard/ModalShell";
import LoadingState from "../../../components/common/LoadingState";
import EmptyState from "../../../components/common/EmptyState";
import { useCommunityMembers } from "../../../hooks/useCommunityMembers";
import { useCommunityGroupMembers, useGroupMutations } from "../../../hooks/useGroups";
import { resolveDisplayName, resolveEmail } from "../../../utils/memberName";

const MEMBERS_PAGE_SIZE = 200;

export default function GroupMembersModal({ communityId, group, onClose }) {
  const [search, setSearch] = useState("");
  const { addMembers, removeMembers, isPending } = useGroupMutations(communityId);

  // Membership is fetched in one large page rather than paginated: the picker
  // is a search-and-toggle over the whole community, and a paginated list
  // behind a search box would silently hide members on page 2.
  //
  // pageNumber is 1-based (createPageable -> PageRequest.of(pageNumber - 1)),
  // so 0 would be rejected as an illegal argument.
  const { data, isLoading } = useCommunityGroupMembers(communityId, group.id, {
    pageNumber: 1,
    pageSize: MEMBERS_PAGE_SIZE,
  });
  const { members: allMembers, isLoading: membersLoading } = useCommunityMembers(communityId);

  const inGroup = useMemo(() => {
    const ids = new Set((data?.content ?? []).map((m) => m.id ?? m.memberId));
    return ids;
  }, [data]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = allMembers ?? [];
    if (!q) return list;
    return list.filter((m) => {
      const name = resolveDisplayName(m, "").toLowerCase();
      const email = String(resolveEmail(m, "")).toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [allMembers, search]);

  function add(memberId) {
    addMembers.mutate({ groupId: group.id, memberIds: [memberId] });
  }

  function remove(memberId) {
    removeMembers.mutate({ groupId: group.id, memberIds: [memberId] });
  }

  return (
    <ModalShell title={group.name} subtitle="Members in this group" onClose={onClose}>
      <div className="px-5 py-4 flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <p className="text-xs text-gray-500">
            {inGroup.size} in this group · {allMembers?.length ?? 0} in the community
          </p>
        </div>

        <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-2">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search community members"
            aria-label="Search community members"
            className="flex-1 text-sm bg-transparent border-none outline-none"
          />
        </div>

        {isLoading || membersLoading ? (
          <LoadingState />
        ) : searchResults.length === 0 ? (
          <EmptyState icon={Search} title="No members match that search" />
        ) : (
          <ul className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
            {searchResults.map((member) => {
              const id = member.id ?? member.memberId;
              const added = inGroup.has(id);
              return (
                <li
                  key={id}
                  className="flex items-center gap-3 border border-gray-100 rounded-lg px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{resolveDisplayName(member)}</p>
                    <p className="text-xs text-gray-400 truncate">{resolveEmail(member)}</p>
                  </div>
                  {added ? (
                    <Button
                      variant="tertiary"
                      size="xs"
                      fullWidth={false}
                      onClick={() => remove(id)}
                      disabled={isPending}
                      aria-label={`Remove ${resolveDisplayName(member)}`}
                    >
                      <X size={13} /> Remove
                    </Button>
                  ) : (
                    <Button
                      variant="tertiary"
                      size="xs"
                      fullWidth={false}
                      onClick={() => add(id)}
                      disabled={isPending}
                      aria-label={`Add ${resolveDisplayName(member)}`}
                    >
                      <Plus size={13} /> Add
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="tertiary" size="xs" fullWidth={false} onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
