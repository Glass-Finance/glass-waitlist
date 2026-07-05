import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSystemConfigs, updateSystemConfig } from "../api/admin";

export function useSystemConfigs(params = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["system-configs", params],
    queryFn: async () => {
      const res = await getSystemConfigs(params);
      const d = res.data?.data;
      return {
        content: Array.isArray(d) ? d : (d?.content ?? []),
        totalElements: d?.totalElements ?? 0,
        totalPages: d?.totalPages ?? 1,
        pageNumber: d?.pageNumber ?? 0,
        pageSize: d?.pageSize ?? 20,
      };
    },
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }) => updateSystemConfig(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-configs"] });
    },
    meta: { successMessage: "Configuration updated" },
  });

  return {
    data: query.data ?? { content: [], totalElements: 0, totalPages: 1 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    update,
  };
}
