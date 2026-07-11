import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMe, updateProfile, updatePassword, updateEmail, getMyCommunities, getMyMemberRecord, leaveCommunity } from "../api/members";

function unwrapList(res) {
  const data = res.data?.data;
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}

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
const PROFILE_FIELD_LABELS = {
  firstName: "first name",
  lastName: "last name",
  phoneNumber: "phone number",
  profileImageFileId: "profile photo",
};

// "Your last name was updated successfully" beats a generic "Profile
// updated" — but it only works if callers send just the changed fields.
function describeProfileUpdate(variables) {
  const fields = Object.keys(variables?.userData ?? {})
    .map((k) => PROFILE_FIELD_LABELS[k])
    .filter(Boolean);
  if (fields.length === 0 || fields.length > 2) return "Profile updated";
  const list = fields.join(" and ");
  return `Your ${list} ${fields.length > 1 ? "were" : "was"} updated successfully`;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    meta: { successMessage: describeProfileUpdate },
  });
}

// ─── Update password ──────────────────────────────────────────────────────────
export function useUpdatePassword() {
  return useMutation({
    mutationFn: (payload) => updatePassword(payload),
    meta: { successMessage: "Password changed" },
  });
}

// ─── Update email ─────────────────────────────────────────────────────────────
// Two-step: call with just { email } to trigger the OTP send to the new
// address, then again with { email, emailVerificationOtp } to confirm it.
// Only invalidate ["me"] on the confirming call — invalidating after the
// first call would be pointless since the email hasn't actually changed yet.
export function useUpdateEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateEmail(payload),
    onSuccess: (_data, variables) => {
      if (variables?.emailVerificationOtp) {
        queryClient.invalidateQueries({ queryKey: ["me"] });
      }
    },
  });
}

// ─── Communities ──────────────────────────────────────────────────────────────
export function useMyCommunities() {
  return useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const res = await getMyCommunities();
      return unwrapList(res);
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Leave a community ────────────────────────────────────────────────────────
export function useLeaveCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (communityId) => leaveCommunity(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
    meta: { successMessage: "You've left the community" },
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
