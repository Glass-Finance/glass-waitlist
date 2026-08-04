// Backend list endpoints return a paginated envelope: { content, pageNumber, ... }
// Some return a bare array. Handle both.
export function unwrapList(res) {
  const data = res.data?.data;
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}

export function deriveStatus(obligation) {
  if (obligation.status === "PAID") return "paid";
  const days = Math.ceil(
    (new Date(obligation.dueDate) - new Date()) / 86400000,
  );
  if (days < 0) return "overdue";
  if (days <= 7) return "due_soon";
  return "upcoming";
}
