import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMe, updateProfile, updatePassword, updateEmail, getMyCommunities, getMyMemberRecord } from "../api/members";

// ─── Current user ─────────────────────────────────────────────────────────────
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await getMe();
      return res.data?.data ?? res.data;
    },
    staleTime: 1000 * 60 * 10,
  });
}

// ─── Update profile ───────────────────────────────────────────────────────────
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

// ─── Update password ──────────────────────────────────────────────────────────
export function useUpdatePassword() {
  return useMutation({
    mutationFn: (payload) => updatePassword(payload),
  });
}

// ─── Update email ─────────────────────────────────────────────────────────────
export function useUpdateEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateEmail(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

// ─── Communities ──────────────────────────────────────────────────────────────
export function useMyCommunities() {
  return useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const res = await getMyCommunities();
      return res.data?.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Member record within a specific community ────────────────────────────────
export function useMyMemberRecord(communityId) {
  return useQuery({
    queryKey: ["member-record", communityId],
    queryFn: async () => {
      const res = await getMyMemberRecord(communityId);
      return res.data?.data ?? res.data;
    },
    enabled: !!communityId,
    staleTime: 1000 * 60 * 5,
  });
}
