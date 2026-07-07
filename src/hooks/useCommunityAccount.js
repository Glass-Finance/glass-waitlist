import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCommunityAccount, saveCommunityAccount } from "../api/communities";

// Pick the default account from a list returned by the API.
// The backend may return an array of up to 2 accounts; the active/default one
// is flagged with isDefault, default, isActive, or similar.
function pickDefaultAccount(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return (
    list.find((a) => a.isDefault || a.default || a.isActive || a.status === "ACTIVE") ??
    list[0]
  );
}

export function useCommunityAccount(communityId) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["community", communityId, "account"],
    queryFn: async () => {
      const res = await getCommunityAccount(communityId);
      // Backend may wrap in { success, data: {...|[...]} } or return the object directly.
      const raw = res.data;
      let payload = raw?.data ?? raw?.account ?? raw ?? null;

      // If the API returned a list of accounts, pick the default one.
      if (Array.isArray(payload)) payload = pickDefaultAccount(payload);

      return payload ?? null;
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 2,
    retry: false, // a 404 here just means no account has been set up yet
  });

  const save = useMutation({
    mutationFn: (payload) => saveCommunityAccount(communityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", communityId, "account"] });
    },
    meta: { successMessage: "Payout account connected" },
  });

  return {
    account: query.data,
    isLoading: query.isLoading,
    error: query.error,
    save,
  };
}
