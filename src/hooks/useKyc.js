import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getKycSummary,
  startKycAttempt,
  refreshKycToken,
  confirmKycSubmission,
  getKycAttempt,
  listKycAttempts,
} from "../api/kyc";

function unwrap(res) {
  return res.data?.data ?? res.data;
}

function unwrapPage(res) {
  const data = res.data?.data;
  if (Array.isArray(data)) return { content: data, totalElements: data.length, totalPages: 1 };
  return {
    content: data?.content ?? [],
    pageNumber: data?.pageNumber ?? 1,
    pageSize: data?.pageSize ?? 10,
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 1,
    last: data?.last ?? true,
  };
}

// ─── Summary (source of truth) ───────────────────────────────────────────────
export function useKycSummary() {
  return useQuery({
    queryKey: ["kyc", "summary"],
    queryFn: async () => unwrap(await getKycSummary()),
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false,
  });
}

// ─── Attempt detail ──────────────────────────────────────────────────────────
export function useKycAttempt(attemptId) {
  return useQuery({
    queryKey: ["kyc", "attempt", attemptId],
    queryFn: async () => unwrap(await getKycAttempt(attemptId)),
    enabled: !!attemptId,
    staleTime: 0,
    retry: false,
  });
}

// ─── History ─────────────────────────────────────────────────────────────────
export function useKycAttempts(params = {}) {
  return useQuery({
    queryKey: ["kyc", "attempts", params],
    queryFn: async () => unwrapPage(await listKycAttempts(params)),
    staleTime: 0,
    retry: false,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────
function useInvalidateSummary() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["kyc", "summary"] });
    queryClient.invalidateQueries({ queryKey: ["kyc", "attempts"] });
  };
}

export function useStartKycAttempt() {
  const invalidate = useInvalidateSummary();
  return useMutation({
    mutationFn: async (idType) => unwrap(await startKycAttempt(idType)),
    onSuccess: invalidate,
  });
}

export function useRefreshKycToken() {
  const invalidate = useInvalidateSummary();
  return useMutation({
    mutationFn: async (attemptId) => unwrap(await refreshKycToken(attemptId)),
    onSuccess: invalidate,
  });
}

export function useConfirmKycSubmission() {
  const invalidate = useInvalidateSummary();
  return useMutation({
    mutationFn: async (attemptId) => unwrap(await confirmKycSubmission(attemptId)),
    onSuccess: invalidate,
    meta: { successMessage: "Verification submitted" },
  });
}
