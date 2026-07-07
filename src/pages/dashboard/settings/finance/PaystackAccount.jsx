import { useEffect, useState } from "react";
import { Check, Info, X } from "lucide-react";
import { useActiveCommunityId } from "../../../../hooks/useActiveCommunityId";
import { useCommunityAccount } from "../../../../hooks/useCommunityAccount";
import { useCommunity } from "../../../../hooks/useCommunity";
import { getBanks, resolveAccount } from "../../../../api/members";
import { getErrorMessage, notifyError } from "../../../../utils/errorHandler";
import BankSelect from "../../../../components/common/BankSelect";

const inputCls =
  "w-full border border-gray-300 px-3.5 py-2.5 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#002FA7] focus:ring-1 focus:ring-[#002FA7]/20 transition-all bg-white";

// Map common Nigerian bank names to their brand colours
function bankColor(name = "") {
  const n = name.toLowerCase();
  if (n.includes("guaranty") || n.includes("guarantee") || n.includes("gtb") || n.includes("gt ")) return "#E05C00";
  if (n.includes("access")) return "#C8102E";
  if (n.includes("zenith")) return "#841B2D";
  if (n.includes("first bank") || n.includes("firstbank")) return "#003087";
  if (n.includes("uba") || n.includes("united bank")) return "#C8102E";
  if (n.includes("stanbic")) return "#009EE0";
  if (n.includes("union bank")) return "#2B5B3F";
  if (n.includes("sterling")) return "#9B2335";
  if (n.includes("fidelity")) return "#005B98";
  if (n.includes("polaris")) return "#6C2382";
  if (n.includes("wema")) return "#5C068C";
  return "#002FA7";
}

// Two-letter initials from the bank name
function bankInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "BK";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatNaira(amount) {
  const n = Number(amount);
  if (!amount || isNaN(n)) return "—";
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 })
    .format(n).replace("NGN", "₦");
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// Change / Add account modal
// ─────────────────────────────────────────────────────────────────────────────
function AccountModal({ onClose, onSave, isSaving }) {
  const [banks, setBanks] = useState([]);
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [accName, setAccName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState(""); // non-blocking warning
  const [manualMode, setManualMode] = useState(false); // allow typing accName after resolve fails

  useEffect(() => {
    getBanks()
      .then(({ data }) => {
        const list = data?.data ?? data;
        const arr = Array.isArray(list) ? list : (list?.content ?? []);
        const seen = new Set();
        setBanks(arr.filter((b) => {
          if (seen.has(b.code)) return false;
          seen.add(b.code);
          return true;
        }));
      })
      .catch((err) =>
        notifyError(err, { context: "Load banks", fallback: "Couldn't load the bank list." }),
      );
  }, []);

  // Auto-resolve account name once we have a full 10-digit number + bank
  useEffect(() => {
    if (!bankCode || accNumber.length !== 10) {
      if (!manualMode) setAccName("");
      setResolveError("");
      return;
    }
    const timer = setTimeout(async () => {
      setResolving(true);
      setResolveError("");
      try {
        const { data } = await resolveAccount(bankCode, accNumber);
        // Backend may wrap in { success, data: { accountName } } or return flat
        const name =
          data?.data?.accountName ??
          data?.accountName ??
          (data?.success === false ? null : data?.name ?? null);
        if (name) {
          setAccName(name);
          setManualMode(false);
        } else {
          setResolveError("Couldn't auto-verify this account. Enter the account name manually.");
          setManualMode(true);
        }
      } catch {
        setResolveError("Couldn't auto-verify this account. Enter the account name manually.");
        setManualMode(true);
      } finally {
        setResolving(false);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [bankCode, accNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSave() {
    if (!accName.trim()) {
      setResolveError("Account name is required.");
      return;
    }
    onSave({
      settlementBank: bankName,
      settlementBankCode: bankCode,
      accountNumber: accNumber,
      accountName: accName.trim(),
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.55)" }}
      />

      {/* Modal — centred, matches settings page grey tone */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-xl rounded-xl p-7"
          style={{ background: "#E8E8E8" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-1.5">
            <h2 className="text-[17px] font-bold text-gray-900">
              Set up your payment Account
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors flex-shrink-0 ml-4 mt-0.5"
            >
              <X size={15} />
            </button>
          </div>
          <p className="text-sm text-gray-400 mb-6">
            This is where Glass will collect and manage dues on behalf of your community.
          </p>

          <div className="space-y-4">
            {/* Row 1 — account number + bank select */}
            <div>
              <label className="block text-xs text-gray-600 mb-1.5">
                Community Bank Account Number
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={accNumber}
                  onChange={(e) => {
                    setAccNumber(e.target.value.replace(/\D/g, ""));
                    setAccName("");
                  }}
                  placeholder="0457359705"
                  className={inputCls + " flex-1"}
                />
                <div className="flex-1">
                  <BankSelect
                    banks={banks}
                    value={bankCode}
                    onChange={(bank) => {
                      setBankCode(bank.code);
                      setBankName(bank.name);
                      setAccName("");
                      setManualMode(false);
                      setResolveError("");
                    }}
                    placeholder="Select bank"
                    triggerClassName={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Row 2 — resolved account name (editable when auto-resolve fails) */}
            <div>
              <label className="block text-xs text-gray-600 mb-1.5">Account Name</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly={!manualMode}
                  value={resolving ? "Verifying account…" : accName}
                  onChange={(e) => manualMode && setAccName(e.target.value)}
                  placeholder={manualMode ? "Type account name" : ""}
                  className={inputCls + (manualMode ? "" : " cursor-default select-none")}
                  style={{ color: resolving ? "#999" : "#111" }}
                />
                {accName && !resolving && !manualMode && (
                  <Check
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"
                  />
                )}
              </div>
            </div>

            {resolveError && (
              <p className="text-xs" style={{ color: manualMode ? "#B45309" : "#DC2626" }}>
                {resolveError}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSave}
              disabled={isSaving || resolving || !accName.trim()}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[#002FA7] hover:opacity-90 transition-all border-none cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function PaystackAccount() {
  const communityId = useActiveCommunityId();
  const { account, isLoading, save } = useCommunityAccount(communityId);
  const { data: community } = useCommunity(communityId);
  const [showModal, setShowModal] = useState(false);

  const bankName =
    account?.settlementBank ??
    account?.bankName ??
    account?.bank ??
    account?.bankTitle ??
    "";
  const communityName = community?.name ?? "";

  async function handleSave(payload) {
    try {
      await save.mutateAsync(payload);
      setShowModal(false);
    } catch {
      // Global mutation cache shows the toast; no extra handling needed here
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-3xl w-full">
      {isLoading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : account ? (
        <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #E5E7EB" }}>
          <p className="text-sm font-bold text-gray-900 mb-0.5">Current Payout Account</p>
          <p className="text-xs text-gray-400 mb-5">
            All payments collected from members{communityName ? ` in ${communityName}` : ""} are disbursed to this account.
          </p>

          {/* Account row */}
          <div className="flex items-center justify-between mb-5 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                style={{ background: bankColor(bankName) }}
              >
                {bankInitials(bankName)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {account.accountName ?? account.name ?? "—"}
                </p>
                <p className="text-xs text-gray-400">
                  {account.accountNumber ?? account.number ?? account.acctNumber ?? "—"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm font-semibold text-[#002FA7] bg-transparent border-none cursor-pointer hover:underline"
            >
              Change Account
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-10">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Total Received</p>
              <p className="text-sm font-bold text-gray-900">
                {formatNaira(account.totalReceived ?? account.totalAmount ?? account.totalSettlement)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Last Payout</p>
              <p className="text-sm font-bold text-gray-900">
                {formatDate(account.lastPayoutAt ?? account.lastPayout ?? account.lastSettlementAt ?? account.lastSettledAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Account Added</p>
              <p className="text-sm font-bold text-gray-900">
                {formatDate(account.createdAt ?? account.addedAt ?? account.dateCreated)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        // No account yet — prompt to add one
        <div
          className="bg-white rounded-2xl p-6 text-center"
          style={{ border: "1px solid #E5E7EB" }}
        >
          <p className="text-sm font-bold text-gray-900 mb-1">No Payout Account Set Up</p>
          <p className="text-xs text-gray-400 mb-5">
            Add a bank account so Glass can settle your community's collected payments.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[#002FA7] hover:opacity-90 transition-all border-none cursor-pointer"
          >
            Add Payout Account
          </button>
        </div>
      )}

      {/* Info notice */}
      <div
        className="flex items-start gap-2.5 rounded-xl px-4 py-3.5"
        style={{ background: "#EEF2FF" }}
      >
        <Info size={14} className="text-[#002FA7] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#002FA7] leading-relaxed">
          Payouts are processed automatically based on your payout frequency settings.
          Changing your account takes effect on the next payout cycle.
        </p>
      </div>

      {showModal && (
        <AccountModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          isSaving={save.isPending}
        />
      )}
    </div>
  );
}
