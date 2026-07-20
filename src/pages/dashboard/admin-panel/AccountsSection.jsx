import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, ShieldAlert, HelpCircle, Wallet, CreditCard } from "lucide-react";
import ModalShell from "../../../components/dashboard/ModalShell";
import AccountFormModal from "../../../components/dashboard/AccountFormModal";
import LoadingState from "../../../components/common/LoadingState";
import { getErrorMessage } from "../../../utils/errorHandler";
import {
  getAdminCommunities,
  getAdminCommunityAccounts,
  reviewCommunityAccount,
  resolveBankAccount,
} from "../../../api/admin";
import { createCommunityAccount } from "../../../api/communities";
import { unwrap, pageParams } from "./shared";
import {
  StatusBadge,
  SectionHeader,
  SearchBar,
  FilterSelect,
  TableShell,
  TableFooter,
  useDebounce,
} from "./SharedUI";

function CreateCommunityAccountModal({ onClose }) {
  const queryClient = useQueryClient();
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [saveError, setSaveError] = useState("");
  const debouncedSet = useDebounce(setDebouncedSearch);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-communities", "picker", debouncedSearch],
    queryFn: () =>
      getAdminCommunities({
        pageNumber: 0,
        pageSize: 8,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      }).then(unwrap),
    enabled: !selectedCommunity,
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: (payload) =>
      createCommunityAccount(selectedCommunity.slug ?? selectedCommunity.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-community-accounts"] });
      onClose();
    },
    meta: { successMessage: "Payout account created" },
    onError: (err) => setSaveError(getErrorMessage(err, "Couldn't create the account.")),
  });

  if (selectedCommunity) {
    return (
      <AccountFormModal
        title="Create Payout Account"
        subtitle={`For ${selectedCommunity.name} — the community's own owner can still manage it afterward.`}
        onClose={onClose}
        onSave={(payload) => create.mutate(payload)}
        isSaving={create.isPending}
        saveError={saveError}
      />
    );
  }

  const items = data?.content ?? [];

  return (
    <ModalShell title="Create Payout Account" subtitle="Choose a community" onClose={onClose}>
      <div className="px-6 py-5">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            debouncedSet(v);
          }}
          placeholder="Search communities…"
          width="100%"
        />
        <div className="mt-3 max-h-64 overflow-y-auto flex flex-col gap-1">
          {isLoading ? (
            <LoadingState className="py-4" />
          ) : items.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No communities found</p>
          ) : (
            items.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCommunity(c)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left bg-transparent hover:bg-gray-50 transition-colors cursor-pointer border-none"
              >
                {c.logo?.url ? (
                  <img src={c.logo.url} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-brand-tint flex items-center justify-center text-brand font-bold text-[10px] flex-shrink-0">
                    {(c.name ?? "C")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-gray-900 leading-tight truncate">{c.name}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{c.slug}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </ModalShell>
  );
}

const REVIEW_DECISIONS = [
  {
    value: "ACCEPT",
    label: "Accept",
    Icon: ShieldCheck,
    activeCls: "bg-[#ECFDF5] border-[#059669] text-[#059669]",
    solidCls: "bg-[#059669]",
    focusCls: "focus:border-[#059669]",
  },
  {
    value: "REQUEST_INFO",
    label: "Request Info",
    Icon: HelpCircle,
    activeCls: "bg-[#FFFBEB] border-[#B45309] text-[#B45309]",
    solidCls: "bg-[#B45309]",
    focusCls: "focus:border-[#B45309]",
  },
  {
    value: "REJECT",
    label: "Reject",
    Icon: ShieldAlert,
    activeCls: "bg-[#FEF2F2] border-[#e11d48] text-[#e11d48]",
    solidCls: "bg-[#e11d48]",
    focusCls: "focus:border-[#e11d48]",
  },
];

function ReviewAccountModal({ account, onClose, onSubmit, submitting }) {
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "resolve-account",
      account.settlementBankCode,
      account.accountNumber,
    ],
    queryFn: () =>
      resolveBankAccount(
        account.settlementBankCode,
        account.accountNumber,
      ).then((r) => r.data?.data),
    staleTime: 0, // always re-check live, never cache a stale Paystack lookup
  });
  const nameMatches =
    data?.accountName &&
    data.accountName.trim().toLowerCase() ===
      account.accountName?.trim().toLowerCase();

  const [decision, setDecision] = useState(null);
  const [comment, setComment] = useState("");
  const commentRequired = decision === "REJECT" || decision === "REQUEST_INFO";

  const chosen = REVIEW_DECISIONS.find((d) => d.value === decision);

  return (
    <ModalShell
      title="Review Payout Account"
      subtitle={account.accountNumber}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!decision) return;
          onSubmit({ decision, comment: comment.trim() || undefined });
        }}
        className="px-6 py-5 flex flex-col gap-4"
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 size={14} className="animate-spin" /> Checking with
            Paystack…
          </div>
        ) : error ? (
          <p className="text-xs text-red-500">
            Couldn't resolve this account with Paystack. Double-check the
            account number and bank code before deciding.
          </p>
        ) : (
          <div
            className={`rounded-lg p-4 ${nameMatches ? "bg-[#ECFDF5]" : "bg-[#FEF2F2]"}`}
          >
            <p className="text-xs text-gray-500 mb-1">On file:</p>
            <p className="text-sm font-semibold text-gray-900 mb-3">
              {account.accountName}
            </p>
            <p className="text-xs text-gray-500 mb-1">Paystack says:</p>
            <p
              className={`text-sm font-semibold ${nameMatches ? "text-green-700" : "text-red-600"}`}
            >
              {data?.accountName ?? "—"}
            </p>
            {!nameMatches && (
              <p className="text-[11px] text-red-500 mt-2">
                Names don't match — confirm this is really the same account
                before accepting.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Decision
          </label>
          <div className="grid grid-cols-3 gap-2">
            {REVIEW_DECISIONS.map(({ value, label, Icon, activeCls }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDecision(value)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all border ${decision === value ? activeCls : "bg-white border-surface-container-border text-gray-500"}`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {decision && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Comment{commentRequired ? "" : " (optional)"}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              required={commentRequired}
              className={`w-full px-3 py-2.5 rounded-lg text-xs text-gray-800 outline-none resize-none transition-colors border border-[#D0D0D0] ${chosen?.focusCls ?? "focus:border-brand"}`}
              placeholder={
                decision === "REJECT"
                  ? "Why is this account being rejected?"
                  : decision === "REQUEST_INFO"
                    ? "What information is needed from the community?"
                    : "Optional note for this decision"
              }
            />
          </div>
        )}

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
            disabled={
              !decision ||
              submitting ||
              isLoading ||
              (commentRequired && !comment.trim())
            }
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer border-none ${chosen?.solidCls ?? "bg-[#9CA3AF]"}`}
          >
            {submitting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : chosen ? (
              <chosen.Icon size={12} />
            ) : null}
            {submitting ? "Submitting…" : chosen ? `Confirm ${chosen.label}` : "Choose a decision"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export default function AccountsSection() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // UNVERIFIED, not PENDING, is the queue that actually needs admin
  // attention -- PENDING means account creation itself is still stuck in
  // processing, which per backend rarely shows up in practice.
  const [status, setStatus] = useState("UNVERIFIED");
  const [page, setPage] = useState(0);
  const [reviewingAccount, setReviewingAccount] = useState(null);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const debouncedSet = useDebounce((v) => {
    setDebouncedSearch(v);
    setPage(0);
  });

  const params = {
    ...pageParams(page),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status !== "ALL" ? { status } : {}),
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-community-accounts", params],
    queryFn: () => getAdminCommunityAccounts(params).then(unwrap),
    staleTime: 60_000,
    placeholderData: (p) => p,
  });

  const review = useMutation({
    mutationFn: ({ communityId, accountId, decision, comment }) =>
      reviewCommunityAccount(communityId, accountId, { decision, comment }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-community-accounts"] }),
    meta: {
      successMessage: (vars) =>
        vars.decision === "ACCEPT"
          ? "Account accepted"
          : vars.decision === "REJECT"
            ? "Account rejected"
            : "More information requested",
    },
  });

  const items = data?.content ?? [];

  return (
    <div>
      <SectionHeader
        title="Payout Accounts"
        desc="Community settlement accounts. Verify after Paystack manual activation."
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
              placeholder="Search accounts…"
            />
            <FilterSelect
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(0);
              }}
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "PENDING", label: "Pending" },
                { value: "UNVERIFIED", label: "Unverified" },
                { value: "NEED_MORE_INFORMATION", label: "Needs Info" },
                { value: "ACTIVE", label: "Active" },
                { value: "REJECTED", label: "Rejected" },
                { value: "DISABLED", label: "Disabled" },
              ]}
            />
            <button
              onClick={() => setCreatingAccount(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-brand hover:opacity-90 transition-all cursor-pointer border-none flex-shrink-0"
            >
              <Wallet size={12} /> Create Account
            </button>
          </>
        }
      />

      <TableShell
        isLoading={isLoading}
        isEmpty={items.length === 0}
        error={error}
        emptyIcon={CreditCard}
        emptyLabel="No payout accounts found"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-stacked-container">
              {[
                "Bank",
                "Account Number",
                "Account Name",
                "Status",
                "Default",
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
            {items.map((a, i) => (
              <tr
                key={a.id}
                className={`group hover:bg-gray-50 transition-colors ${i < items.length - 1 ? "border-b border-[#F9FAFB]" : "border-b-0"}`}
              >
                <td className="px-4 py-3">
                  <p className="text-[12px] font-semibold text-gray-900">
                    {a.settlementBank}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {a.settlementBankCode}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12px] text-gray-700 font-mono">
                    {a.accountNumber}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12px] text-gray-700">
                    {a.accountName}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-4 py-3">
                  {a.defaultAccount && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                      Default
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {/* PENDING means account creation itself didn't finish
                      processing -- there's nothing yet for a human to
                      review. UNVERIFIED is the real "awaiting a decision"
                      state (per backend, 2026-07-14): new account, not yet
                      approved by an admin or verified on Paystack. */}
                  {a.status === "UNVERIFIED" && (
                    <button
                      onClick={() => setReviewingAccount(a)}
                      disabled={review.isPending}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg text-[11px] font-semibold text-brand bg-blue-50 hover:bg-blue-100 transition-all cursor-pointer border-none disabled:opacity-40"
                    >
                      <ShieldCheck size={11} /> Review
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
        noun="account"
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPage={setPage}
      />
      {reviewingAccount && (
        <ReviewAccountModal
          account={reviewingAccount}
          onClose={() => setReviewingAccount(null)}
          submitting={review.isPending}
          onSubmit={({ decision, comment }) => {
            review.mutate(
              {
                communityId: reviewingAccount.communityId,
                accountId: reviewingAccount.id,
                decision,
                comment,
              },
              { onSuccess: () => setReviewingAccount(null) },
            );
          }}
        />
      )}
      {creatingAccount && (
        <CreateCommunityAccountModal onClose={() => setCreatingAccount(false)} />
      )}
    </div>
  );
}
