import { useEffect, useState } from "react";
import { Check, Info, X, Trash2 } from "lucide-react";
import { useActiveCommunityId } from "../../../../hooks/useActiveCommunityId";
import { useCommunityAccount } from "../../../../hooks/useCommunityAccount";
import { useCommunity } from "../../../../hooks/useCommunity";
import { getBanks, resolveAccount } from "../../../../api/members";
import { notifyError } from "../../../../utils/errorHandler";
import BankSelect from "../../../../components/common/BankSelect";
import LoadingState from "../../../../components/common/LoadingState";
import banksData from "nigerian-bank-icons/assets/banks.json";

// Exclude generic placeholder entries — banks without real logos use colored initials.
const BANK_LOGO_BY_CODE = Object.fromEntries(
  banksData
    .filter((b) => !b.logo.includes("default-image"))
    .map((b) => [b.code, b.logo]),
);

const inputCls =
  "w-full border border-gray-300 px-3.5 py-2.5 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#002FA7] focus:ring-1 focus:ring-[#002FA7]/20 transition-all bg-white";

// Map common Nigerian bank names to their brand colours
function bankColor(name = "") {
  const n = name.toLowerCase();
  if (
    n.includes("guaranty") ||
    n.includes("guarantee") ||
    n.includes("gtb") ||
    n.includes("gt ")
  )
    return "#E05C00";
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

function BankAvatar({ bankCode, bankName, storedLogoUrl }) {
  const [imgFailed, setImgFailed] = useState(false);
  // Prefer logo URL stored at account-save time (from Paystack API), then package map.
  // Ignore URLs that are the generic placeholder.
  const logoUrl =
    (storedLogoUrl && !storedLogoUrl.includes("default-image")
      ? storedLogoUrl
      : null) ??
    BANK_LOGO_BY_CODE[bankCode] ??
    null;
  if (logoUrl && !imgFailed) {
    return (
      <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden border border-gray-100 bg-white flex items-center justify-center">
        <img
          src={logoUrl}
          alt={bankName}
          className="w-full h-full object-contain p-0.5"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }
  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
      style={{ background: bankColor(bankName) }}
    >
      {bankInitials(bankName)}
    </div>
  );
}

function formatNaira(amount) {
  if (amount === null || amount === undefined) return "—";
  const n = Number(amount);
  if (isNaN(n)) return "—";
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  })
    .format(n)
    .replace("NGN", "₦");
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Status pill next to the account name — PENDING accounts haven't cleared
// verification yet, so this shouldn't look identical to a settled one.
function StatusBadge({ status }) {
  if (!status) return null;
  const styles = {
    ACTIVE: { bg: "#ECFDF3", fg: "#027A48" },
    VERIFIED: { bg: "#ECFDF3", fg: "#027A48" },
    PENDING: { bg: "#FFFAEB", fg: "#B54708" },
    FAILED: { bg: "#FEF3F2", fg: "#B42318" },
    REJECTED: { bg: "#FEF3F2", fg: "#B42318" },
  };
  const { bg, fg } = styles[status] ?? { bg: "#F2F4F7", fg: "#475467" };
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ background: bg, color: fg }}
    >
      {status.toLowerCase()}
    </span>
  );
}

// Confirm-delete modal for removing the payout account
function RemoveAccountModal({ onClose, onConfirm, isDeleting }) {
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.55)" }}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm rounded-xl p-6"
          style={{ background: "#fff" }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-[16px] font-bold text-gray-900 mb-1.5">
            Remove payout account?
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Glass won't be able to settle collected payments until you add a new
            payout account. This can't be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-full text-sm font-semibold text-gray-600 bg-transparent border-none cursor-pointer hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-red-600 hover:opacity-90 transition-all border-none cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? "Removing…" : "Remove Account"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Change / Add account modal
// ─────────────────────────────────────────────────────────────────────────────
function AccountModal({ onClose, onSave, isSaving, saveError }) {
  const [banks, setBanks] = useState([]);
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankSlug, setBankSlug] = useState("");
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
        setBanks(
          arr.filter((b) => {
            if (seen.has(b.code)) return false;
            seen.add(b.code);
            return true;
          }),
        );
      })
      .catch((err) =>
        notifyError(err, {
          context: "Load banks",
          fallback: "Couldn't load the bank list.",
        }),
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
          (data?.success === false ? null : (data?.name ?? null));
        if (name) {
          setAccName(name);
          setManualMode(false);
        } else {
          setResolveError(
            "Couldn't auto-verify this account. Enter the account name manually.",
          );
          setManualMode(true);
        }
      } catch (err) {
        const desc =
          err?.response?.data?.description ??
          err?.response?.data?.message ??
          null;
        setResolveError(
          desc
            ? `${desc}. Enter the account name manually.`
            : "Couldn't auto-verify this account. Enter the account name manually.",
        );
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
      settlementBankSlug: bankSlug,
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
            This is where Glass will collect and manage dues on behalf of your
            community.
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
                      setBankSlug(bank.slug ?? "");
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
              <label className="block text-xs text-gray-600 mb-1.5">
                Account Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly={!manualMode}
                  value={resolving ? "Verifying account…" : accName}
                  onChange={(e) => manualMode && setAccName(e.target.value)}
                  placeholder={manualMode ? "Type account name" : ""}
                  className={
                    inputCls + (manualMode ? "" : " cursor-default select-none")
                  }
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
              <p
                className="text-xs"
                style={{ color: manualMode ? "#B45309" : "#DC2626" }}
              >
                {resolveError}
              </p>
            )}
          </div>

          {/* Save error — shown when the API call itself fails (e.g. backend 502) */}
          {saveError && (
            <p className="text-xs text-red-600 mt-4">{saveError}</p>
          )}

          {/* Footer */}
          <div className="flex justify-end mt-4">
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
  const { account, isLoading, create, update, remove } =
    useCommunityAccount(communityId);
  const { data: community } = useCommunity(communityId);
  const [showModal, setShowModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [removeError, setRemoveError] = useState("");

  const bankName =
    account?.settlementBank ??
    account?.bankName ??
    account?.bank ??
    account?.bankTitle ??
    "";
  const bankCode =
    account?.settlementBankCode ?? account?.bankCode ?? account?.code ?? "";
  const communityName = community?.name ?? "";

  async function handleSave({
    settlementBank,
    settlementBankCode,
    accountNumber,
    accountName,
  }) {
    const body = {
      settlementBank,
      settlementBankCode,
      accountNumber,
      accountName,
    };
    setSaveError("");
    try {
      if (account?.id) {
        await update.mutateAsync({ accountId: account.id, payload: body });
      } else {
        await create.mutateAsync(body);
      }
      setShowModal(false);
    } catch (err) {
      const desc =
        err?.response?.data?.description ??
        err?.response?.data?.message ??
        "Couldn't save the account. Please try again.";
      setSaveError(desc);
    }
  }

  async function handleRemove() {
    setRemoveError("");
    try {
      await remove.mutateAsync(account.id);
      setShowRemoveModal(false);
    } catch (err) {
      const desc =
        err?.response?.data?.description ??
        err?.response?.data?.message ??
        "Couldn't remove the account. Please try again.";
      setRemoveError(desc);
    }
  }

  return (
    <div className="flex flex-col gap-10 max-w-2xl w-full">
      {isLoading ? (
        <LoadingState />
      ) : account ? (
        <div
          className="bg-[#EFEFF1E5] rounded-2xl p-6"
          style={{ border: "1px solid #FFFFFF" }}
        >
          <p className="text-sm font-bold text-gray-900 mb-0.5">
            Current Payout Account
          </p>
          <p className="text-xs text-gray-400 mb-5">
            All payments collected from members
            {communityName ? ` in ${communityName}` : ""} are disbursed to this
            account.
          </p>

          {/* Account row */}
          <div className="flex flex-col ">
            <div className="flex items-center justify-between mb-5 pb-5 border-b border-gray-100 w-[70%]">
              <div className="flex items-center gap-3">
                <BankAvatar
                  bankCode={bankCode}
                  bankName={bankName}
                  storedLogoUrl={
                    account?.settlementBankLogo ??
                    account?.bankLogo ??
                    account?.logo
                  }
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-gray-900">
                      {account.accountName ?? account.name ?? "—"}
                    </p>
                    <StatusBadge status={account.status} />
                  </div>
                  <p className="text-xs text-gray-400">
                    {account.accountNumber ??
                      account.number ??
                      account.acctNumber ??
                      "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowModal(true)}
                  className="text-xs font-medium text-[#002FA7] bg-transparent border-none cursor-pointer hover:underline"
                >
                  Change Account
                </button>
                <button
                  onClick={() => {
                    setRemoveError("");
                    setShowRemoveModal(true);
                  }}
                  title="Remove payout account"
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            {removeError && (
              <p className="text-xs text-red-600 mb-4 -mt-2">{removeError}</p>
            )}
            {/* Stats */}
            <div className="flex gap-30">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Total Received</p>
                <p className="text-xs font-bold text-gray-900">
                  {formatNaira(
                    account.totalReceivedAmount ??
                      account.totalReceived ??
                      account.totalAmount ??
                      account.totalSettlement,
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Last Payout</p>
                <p className="text-xs font-bold text-gray-900">
                  {formatDate(
                    account.lastPayoutAt ??
                      account.lastPayout ??
                      account.lastSettlementAt ??
                      account.lastSettledAt,
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Account Added</p>
                <p className="text-xs font-bold text-gray-900">
                  {formatDate(
                    account.createdAt ?? account.addedAt ?? account.dateCreated,
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // No account yet — prompt to add one
        <div
          className="bg-[#EFEFF1E5] rounded-2xl p-6 text-center"
          style={{ border: "1px solid #E5E7EB" }}
        >
          <p className="text-sm font-bold text-gray-900 mb-1">
            No Payout Account Set Up
          </p>
          <p className="text-xs text-gray-400 mb-5">
            Add a bank account so Glass can settle your community's collected
            payments.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-full text-sm text-white bg-[#002FA7] hover:opacity-90 transition-all border-none cursor-pointer"
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
          Payouts are processed automatically based on your payout frequency
          settings. Changing your account takes effect on the next payout cycle.
        </p>
      </div>

      {showModal && (
        <AccountModal
          onClose={() => {
            setShowModal(false);
            setSaveError("");
          }}
          onSave={handleSave}
          isSaving={create.isPending || update.isPending}
          saveError={saveError}
        />
      )}

      {showRemoveModal && (
        <RemoveAccountModal
          onClose={() => {
            setShowRemoveModal(false);
            setRemoveError("");
          }}
          onConfirm={handleRemove}
          isDeleting={remove.isPending}
        />
      )}
    </div>
  );
}
