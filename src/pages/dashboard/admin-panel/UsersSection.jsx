import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import ModalShell from "../../../components/dashboard/ModalShell";
import { toTitleCase } from "../../../utils/format";
import { getAdminUsers, suspendUser, unsuspendUser } from "../../../api/admin";
import { unwrap, pageParams, fmtDateTime } from "./shared";
import {
  SectionHeader,
  SearchBar,
  FilterSelect,
  TableShell,
  TableFooter,
  useDebounce,
} from "./SharedUI";

function SuspendModal({ user, onClose }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: (payload) => suspendUser(user.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    meta: { successMessage: "User suspended" },
  });

  const f = { border: "1px solid #D0D0D0" };

  return (
    <ModalShell title="Suspend User" subtitle={user.email} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ reason });
        }}
        className="px-6 py-5 flex flex-col gap-4"
      >
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
            className="w-full px-3 py-2.5 rounded-lg text-xs text-gray-800 outline-none resize-none transition-colors"
            style={f}
            onFocus={(e) => (e.target.style.borderColor = "#e11d48")}
            onBlur={(e) => Object.assign(e.target.style, f)}
            placeholder="Why is this user being suspended?"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer border-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || !reason.trim()}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer border-none bg-[#e11d48]"
          >
            {mutation.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <ShieldAlert size={12} />
            )}
            {mutation.isPending ? "Suspending…" : "Suspend"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function UnsuspendModal({ user, onClose, onConfirm, unsuspending }) {
  return (
    <ModalShell title="Unsuspend User" subtitle={user.email} onClose={onClose}>
      <div className="px-6 py-5 flex flex-col gap-4">
        <p className="text-xs text-gray-600 leading-relaxed">
          This restores <strong>{user.email}</strong>'s access to the
          Platform. They'll be able to sign in and use their Account again.
        </p>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer border-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={unsuspending}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer border-none bg-[#15803d]"
          >
            {unsuspending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <ShieldCheck size={12} />
            )}
            {unsuspending ? "Unsuspending…" : "Unsuspend"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export default function UsersSection() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [enabledFilter, setEnabledFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [suspending, setSuspending] = useState(null);
  const [unsuspending, setUnsuspending] = useState(null);
  const debouncedSet = useDebounce((v) => {
    setDebouncedSearch(v);
    setPage(0);
  });

  const params = {
    ...pageParams(page),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(enabledFilter !== "ALL" ? { enabled: enabledFilter === "ACTIVE" } : {}),
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-users", params],
    queryFn: () => getAdminUsers(params).then(unwrap),
    staleTime: 60_000,
    placeholderData: (p) => p,
  });

  const unsuspend = useMutation({
    mutationFn: (userId) => unsuspendUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setUnsuspending(null);
    },
    meta: { successMessage: "User unsuspended" },
  });

  const items = data?.content ?? [];

  return (
    <div>
      <SectionHeader
        title="Users"
        desc="All registered platform users."
        count={data?.totalElements ?? 0}
        isFetching={isFetching && !isLoading}
        right={
          <>
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                debouncedSet(v);
              }}
              placeholder="Search users…"
              width={220}
            />
            <FilterSelect
              value={enabledFilter}
              onChange={(v) => {
                setEnabledFilter(v);
                setPage(0);
              }}
              options={[
                { value: "ALL", label: "All users" },
                { value: "ACTIVE", label: "Active" },
                { value: "SUSPENDED", label: "Suspended" },
              ]}
            />
          </>
        }
      />

      <TableShell
        isLoading={isLoading}
        isEmpty={items.length === 0}
        error={error}
        emptyIcon={Users}
        emptyLabel="No users found"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-stacked-container">
              {[
                "User",
                "Role",
                "Status",
                "Verified",
                "Last Login",
                "Communities",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((u, i) => (
              <tr
                key={u.id}
                className={`group hover:bg-gray-50 transition-colors ${i < items.length - 1 ? "border-b border-[#F9FAFB]" : "border-b-0"}`}
              >
                <td className="px-4 py-3">
                  <p className="text-[12px] font-semibold text-gray-900 leading-tight">
                    {[u.userData?.firstName, u.userData?.lastName]
                      .filter(Boolean)
                      .map((s) => toTitleCase(s.trim()))
                      .join(" ") || "—"}
                  </p>
                  <p className="text-[11px] text-gray-400">{u.email}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {u.isPlatformAdmin ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-tint text-brand">
                      Platform Admin
                    </span>
                  ) : u.platformRole ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {u.platformRole}
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400">User</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.enabled ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                  >
                    {u.enabled ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`text-[11px] font-medium ${u.emailVerified ? "text-green-600" : "text-gray-400"}`}
                  >
                    {u.emailVerified ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-[11px] text-gray-500">
                    {fmtDateTime(u.lastLoginAt)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12px] text-gray-600">
                    {u.metrics?.totalRelatedCommunities ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.enabled ? (
                    <button
                      onClick={() => setSuspending(u)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-all cursor-pointer border-none"
                    >
                      <ShieldAlert size={11} /> Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => setUnsuspending(u)}
                      disabled={unsuspend.isPending}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg text-[11px] font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-all cursor-pointer border-none disabled:opacity-40"
                    >
                      <ShieldCheck size={11} /> Unsuspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <TableFooter
        totalElements={data?.totalElements ?? 0}
        noun="user"
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPage={setPage}
      />
      {suspending && (
        <SuspendModal user={suspending} onClose={() => setSuspending(null)} />
      )}
      {unsuspending && (
        <UnsuspendModal
          user={unsuspending}
          onClose={() => setUnsuspending(null)}
          onConfirm={() => unsuspend.mutate(unsuspending.id)}
          unsuspending={unsuspend.isPending}
        />
      )}
    </div>
  );
}
