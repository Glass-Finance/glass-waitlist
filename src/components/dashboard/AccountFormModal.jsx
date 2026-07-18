import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { getBanks, resolveAccount } from "../../api/members";
import { notifyError } from "../../utils/errorHandler";
import BankSelect from "../common/BankSelect";

const inputCls =
  "w-full border border-gray-300 px-3.5 py-2.5 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#002FA7] focus:ring-1 focus:ring-[#002FA7]/20 transition-all bg-white";

// Bank account entry form — number + bank select, auto-resolves the account
// name via Paystack, falls back to manual entry if resolution fails.
// Originally lived only in PaystackAccount.jsx (the community-owner's own
// payout-account settings); extracted so the platform-admin panel's
// create-account-on-behalf-of-a-community flow can reuse the exact same
// verified UX instead of a second, drifting copy of it.
export default function AccountFormModal({
  onClose,
  onSave,
  isSaving,
  saveError,
  title = "Set up your payment Account",
  subtitle = "This is where Glass will collect and manage dues on behalf of your community.",
}) {
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
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

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
      {/* Backdrop — matches ModalShell's treatment used everywhere else
          (0.35 opacity + blur, not a heavier flat 0.55 dark overlay). */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-70"
        style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      />

      {/* Modal — centred */}
      <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
        <div
          className="w-full max-w-xl rounded-xl p-7 shadow-2xl"
          style={{ background: "#fff" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-1.5">
            <h2 className="text-[17px] font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors flex-shrink-0 ml-4 mt-0.5"
            >
              <X size={15} />
            </button>
          </div>
          <p className="text-sm text-gray-400 mb-6">{subtitle}</p>

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
