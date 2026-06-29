import { useEffect, useState } from "react";
import { Landmark, ChevronDown, Check } from "lucide-react";
import { useActiveCommunityId } from "../../../../hooks/useActiveCommunityId";
import { useCommunityAccount } from "../../../../hooks/useCommunityAccount";
import { getBanks, resolveAccount } from "../../../../api/members";
import { getErrorMessage, notifyError } from "../../../../utils/errorHandler";

const inputCls =
  "w-full border border-gray-300 px-3 py-2.5 rounded-lg text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/10 transition-all";

export default function PaystackAccount() {
  const communityId = useActiveCommunityId();
  const { account, isLoading, save } = useCommunityAccount(communityId);

  const [banks, setBanks] = useState([]);
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [accName, setAccName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getBanks().then(({ data }) => {
      if (!data.success) return;
      // The bank list has been observed to contain duplicate codes —
      // dedupe so React's key={b.code} stays unique.
      const seen = new Set();
      const unique = (data.data ?? []).filter((b) => {
        if (seen.has(b.code)) return false;
        seen.add(b.code);
        return true;
      });
      setBanks(unique);
    })
      .catch((err) => notifyError(err, { context: "Load banks", fallback: "Couldn't load the bank list. Please refresh." }));
  }, []);

  useEffect(() => {
    if (!bankCode || accNumber.length !== 10) { setAccName(""); return; }
    const timer = setTimeout(async () => {
      setResolving(true);
      setError("");
      try {
        const { data } = await resolveAccount(bankCode, accNumber);
        if (data.success) setAccName(data.data?.accountName ?? "");
        else setError("Could not resolve account. Check the number and try again.");
      } catch (err) {
        setError(getErrorMessage(err, "Could not resolve account. Check the number and try again."));
      } finally {
        setResolving(false);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [bankCode, accNumber]);

  const handleBankChange = (e) => {
    const selected = banks.find((b) => b.code === e.target.value);
    setBankCode(selected?.code ?? "");
    setBankName(selected?.name ?? "");
    setAccName("");
  };

  const handleSave = async () => {
    if (!accName) { setError("Please resolve a valid account first."); return; }
    setError("");
    try {
      await save.mutateAsync({
        settlementBank: bankName,
        settlementBankCode: bankCode,
        accountNumber: accNumber,
      });
      if (typeof pendo !== "undefined") {
        pendo.track("payout_account_updated", {
          community_id: communityId,
          bank_name: bankName,
        });
      }
      setAccNumber("");
      setBankCode("");
      setAccName("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save account. Please try again."));
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-3xl w-full">
      <div>
        <p className="text-sm font-medium text-gray-900 mb-0.5">Payout account</p>
        <p className="text-xs text-gray-500 mb-5">The bank account your community's collected dues are settled into.</p>

        {isLoading ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : account ? (
          <div className="bg-gray-50 rounded-xl p-5 mb-4 flex items-center gap-3" style={{ border: "1px solid #E5E7EB" }}>
            <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
              <Landmark size={18} className="text-[#002FA7]" />
            </div>
            <div>
              <p className="text-sm text-gray-900">{account.settlementBank ?? account.bankName}</p>
              <p className="text-xs text-gray-500">
                {account.accountNumber ? `***${String(account.accountNumber).slice(-4)}` : ""}
                {account.accountName ? ` · ${account.accountName}` : ""}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mb-4">No payout account set up yet.</p>
        )}

        <div className="bg-gray-50 rounded-xl p-5" style={{ border: "1px solid #E5E7EB" }}>
          <p className="text-sm font-medium text-gray-900 mb-0.5">
            {account ? "Change payout account" : "Add a payout account"}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Glass uses Paystack to settle your community's payments into this account.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Bank</label>
              <div className="relative">
                <select value={bankCode} onChange={handleBankChange} className={inputCls + " appearance-none pr-8 bg-white"}>
                  <option value="" disabled>Select bank</option>
                  {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Account Number</label>
              <input
                type="text"
                maxLength={10}
                value={accNumber}
                onChange={(e) => { setAccNumber(e.target.value.replace(/\D/g, "")); setAccName(""); }}
                placeholder="10-digit account number"
                className={inputCls}
              />
            </div>
          </div>

          {(resolving || accName) && (
            <div className="mb-3 px-3 py-2.5 rounded-lg flex items-center gap-2"
              style={{ background: accName ? "#ecfdf5" : "#f9fafb", border: `1px solid ${accName ? "#86efac" : "#e5e7eb"}` }}>
              {resolving ? (
                <span className="text-xs text-gray-500">Verifying account…</span>
              ) : (
                <>
                  <Check size={13} className="text-green-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-green-700">{accName}</span>
                </>
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

          <button
            onClick={handleSave}
            disabled={save.isPending || resolving || !accName}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#002FA7] hover:opacity-90 transition-all border-none cursor-pointer disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : "Save payout account"}
          </button>
        </div>
      </div>
    </div>
  );
}
