/**
 * PaymentProfile.jsx — wired to API
 *
 * Flow:
 *   1. User enters account number + selects bank
 *   2. Resolve account → GET /api/v1/finance/resolve-account?bankCode=&accountNumber=
 *      → shows account name for confirmation
 *   3. Save → POST /api/v1/communities/{communityId}/account
 *      { settlementBank, settlementBankCode, accountNumber }
 *   4. Show success modal, then navigate to AddMembers with communityId/slug in state
 *
 * Banks list → GET /api/v1/finance/banks (fetched on mount)
 */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Check, ArrowLeft } from "lucide-react";
import GlassLogo from "../../assets/Glass.webp";
import Background from "../../assets/background.webp";
import client from "../../api/client";
import { notifyError, getErrorMessage } from "../../utils/errorHandler";
import { useCommunityAccount } from "../../hooks/useCommunityAccount";
import { saveOnboardingProgress, readOnboardingProgress } from "../../utils/onboardingProgress";
import BankSelect from "../../components/common/BankSelect";
import { ONBOARDING_STEPS } from "../../utils/onboardingSteps";

const COMPLETED_STEP_IDS = ["choose-path", "paying-member", "organization"];

const inputCls =
  "w-full border-1 border-gray-200 bg-white p-3 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/10 transition-all";

function StepIcon({ id, completed }) {
  if (completed) return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {id === "organization" && <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
      {id === "payment"      && <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>}
      {id === "members"      && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}
    </svg>
  );
}

function SuccessModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(20,20,30,0.45)" }}>
      <div className="bg-white rounded-2xl px-12 py-16 flex flex-col items-center shadow-2xl" style={{ minWidth: 480 }}>
        <div className="relative flex items-center justify-center mb-8" style={{ width: 110, height: 110 }}>
          <div className="absolute inset-0 rounded-full border border-gray-300" />
          <div className="absolute rounded-full border border-gray-300" style={{ inset: 10 }} />
          <div className="w-20 h-20 rounded-full bg-[#16C147] flex items-center justify-center">
            <Check size={36} color="white" strokeWidth={3} />
          </div>
        </div>
        <p className="text-xl text-gray-900 text-center">Your Payment Account Is Now Set!</p>
      </div>
    </div>
  );
}

export default function PaymentProfile() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Falls back to whatever OrganizationProfile persisted right after
  // creating this community -- location.state alone doesn't survive a
  // reload or a forced re-login, and by this point the community already
  // exists on the backend, so losing this link strands it with no way
  // back short of re-doing everything from scratch.
  const savedProgress = readOnboardingProgress();
  const { email, isPaying, communityId, communitySlug, communityName } =
    location.state ?? savedProgress;
  const { create: saveAccount, update: updateAccount, account: existingAccount } =
    useCommunityAccount(communityId);

  const [banks,       setBanks]       = useState([]);
  const [bankCode,    setBankCode]    = useState("");
  const [bankName,    setBankName]    = useState("");
  const [bankSlug,    setBankSlug]    = useState("");
  const [accNumber,   setAccNumber]   = useState("");
  const [accName,     setAccName]     = useState("");
  const [resolving,   setResolving]   = useState(false);
  const [manualMode,  setManualMode]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [accNumberTouched, setAccNumberTouched] = useState(false);

  // Only worth flagging once the field's been left, not while still typing —
  // a 10-digit account number is the norm but nothing else here validates
  // length as the user goes, so a shorter one just silently never resolves
  // with no feedback at all otherwise.
  const accNumberIncomplete =
    accNumberTouched && accNumber.length > 0 && accNumber.length < 10;

  // Fetch banks on mount
  useEffect(() => {
    client.get("/finance/banks")
      .then(({ data }) => {
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

  // Prefill from an already-saved payout account -- e.g. the admin came back
  // here via AddMembers' Back button after already completing this step.
  // Runs once the account loads; manualMode is set too so the resolve-account
  // effect below doesn't immediately overwrite the restored account name.
  useEffect(() => {
    if (!existingAccount) return;
    setBankCode(existingAccount.settlementBankCode ?? "");
    setBankName(existingAccount.settlementBank ?? "");
    setBankSlug(existingAccount.settlementBankSlug ?? "");
    setAccNumber(existingAccount.accountNumber ?? "");
    setAccName(existingAccount.accountName ?? "");
    setManualMode(true);
  }, [existingAccount]);

  // Auto-resolve when both bank + 10-digit account are set
  useEffect(() => {
    if (!bankCode || accNumber.length !== 10) {
      if (!manualMode) setAccName("");
      setError("");
      return;
    }
    const timer = setTimeout(async () => {
      setResolving(true);
      setError("");
      try {
        const { data } = await client.get("/finance/resolve-account", {
          params: { bankCode, accountNumber: accNumber },
        });
        const name =
          data?.data?.accountName ??
          data?.accountName ??
          (data?.success === false ? null : data?.name ?? null);
        if (name) {
          setAccName(name);
          setManualMode(false);
        } else {
          setError("Couldn't auto-verify this account. Enter the account name manually below.");
          setManualMode(true);
        }
      } catch (err) {
        const desc =
          err?.response?.data?.description ??
          err?.response?.data?.message ??
          null;
        setError(
          desc
            ? `${desc}. Enter the account name manually below.`
            : "Couldn't auto-verify this account. Enter the account name manually below."
        );
        setManualMode(true);
      } finally {
        setResolving(false);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [bankCode, accNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve-account can be down for reasons that have nothing to do with
  // what the admin types (backend/Paystack connectivity, bad keys, etc.),
  // and there's no skip on this step otherwise — so onboarding would be a
  // hard dead end. The account can still be set up later from
  // Settings → Finance → Paystack Account.
  const handleSkip = () => {
    navigate("/onboarding/members", {
      state: { email, communityId, communitySlug, communityName },
    });
  };

  const handleBack = () => {
    navigate("/onboarding/organization-profile", {
      state: { email, isPaying, communityId, communitySlug, communityName },
    });
  };

  const handleSave = async () => {
    if (!accName.trim()) { setError("Account name is required."); return; }
    if (!communityId) { setError("Community ID missing — go back and retry."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        settlementBank:     bankName,
        settlementBankCode: bankCode,
        settlementBankSlug: bankSlug,
        accountNumber:      accNumber,
        accountName:        accName.trim(),
      };
      // Update the account already saved for this community (e.g. a revisit
      // via AddMembers' Back button) instead of creating a second one.
      if (existingAccount) {
        await updateAccount.mutateAsync({ accountId: existingAccount.id, payload });
      } else {
        await saveAccount.mutateAsync(payload);
      }
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/onboarding/members", {
          state: { email, communityId, communitySlug, communityName },
        });
      }, 1600);
    } catch (err) {
      // Not notifyError here -- the global mutationCache onError (main.jsx)
      // already toasts this since these mutations are shared with
      // PaystackAccount.jsx, which relies on that toast being the only one.
      // Toasting again here would double it up for this caller.
      setError(getErrorMessage(err, "Couldn't save your payment account. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "100vh", backgroundImage: `url(${Background})`, backgroundSize: "contain", backgroundPosition: "center" }}
    >
      {showSuccess && <SuccessModal />}

      <header className="flex items-center justify-between px-8 py-4 bg-surface-container border-b border-outline-on-surface flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={GlassLogo} alt="Glass" className="w-7 h-7 object-contain" />
          <span className="font-semibold text-base text-gray-900">Glass</span>
        </div>
        <div className="flex items-center gap-4">
          <Bell size={20} className="text-gray-400" />
          <p className="text-sm text-gray-600">{email}</p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 bg-surface-container border-r border-outline-on-surface flex flex-col pt-10 px-6">
          {ONBOARDING_STEPS.map((step, i) => {
            const isActive    = step.id === "payment";
            const isCompleted = COMPLETED_STEP_IDS.includes(step.id);
            const isLast      = i === ONBOARDING_STEPS.length - 1;
            return (
              <div key={step.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted
                        ? "bg-[#002FA7] text-white"
                        : isActive
                          ? "bg-white border-2 border-[#002FA7] text-[#002FA7]"
                          : "bg-white border border-outline-on-surface text-gray-400"
                    }`}
                    style={isActive && !isCompleted ? { boxShadow: "0 0 0 4px rgba(0,47,167,0.15)" } : undefined}
                  >
                    <StepIcon id={step.id} completed={isCompleted} />
                  </div>
                  {!isLast && <div className="w-px my-1" style={{ minHeight: 40, background: isCompleted ? "#002FA7" : "var(--color-outline-on-surface)" }} />}
                </div>
                <div className="pt-1.5 pb-10">
                  <span className={`text-sm font-medium ${isActive ? "text-[#000000]" : isCompleted ? "text-gray-600" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto py-10 px-12">
          <div className="w-full max-w-3xl">
            <div className="bg-white rounded-lg px-8 py-7 border border-[#E5E7EB]">
              <div className="mb-6 pb-5" style={{ borderBottom: "1px solid #E5E7EB" }}>
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer mb-4 -ml-1 p-0"
                >
                  <ArrowLeft size={15} />
                  Back
                </button>
                <h2 className="text-lg font-medium text-gray-900 mb-1">Set up your payment Account</h2>
                <p className="text-sm text-gray-500">
                  This is where Glass will collect and manage dues on behalf of your community.
                </p>
              </div>

              {/* Account number + bank */}
              <div className="mb-5">
                <label className="text-sm text-gray-700 block mb-1.5">Community Bank Account Number</label>
                <div className="grid grid-cols-2 gap-5">
                  <input
                    type="text"
                    maxLength={10}
                    value={accNumber}
                    onChange={(e) => { setAccNumber(e.target.value.replace(/\D/g, "")); setAccName(""); }}
                    onFocus={() => setAccNumberTouched(false)}
                    onBlur={() => setAccNumberTouched(true)}
                    placeholder="Enter Account Number"
                    className={inputCls}
                    style={accNumberIncomplete ? { borderColor: "var(--color-danger)" } : undefined}
                  />
                  <BankSelect
                    banks={banks}
                    value={bankCode}
                    onChange={(bank) => {
                      setBankCode(bank.code);
                      setBankName(bank.name);
                      setBankSlug(bank.slug ?? "");
                      setAccName("");
                      setManualMode(false);
                      setError("");
                    }}
                    placeholder="Choose Bank"
                    triggerClassName={inputCls}
                  />
                </div>
                {accNumberIncomplete && (
                  <p className="text-xs text-danger mt-1.5">Account number must be 10 digits.</p>
                )}
              </div>

              {/* Resolved account name */}
              <div className="mb-2">
                <label className="text-sm text-gray-700 block mb-1.5">Account Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={resolving ? "Verifying…" : accName}
                    readOnly={!manualMode}
                    onChange={(e) => manualMode && setAccName(e.target.value)}
                    placeholder={manualMode ? "Type account name" : "Account name will appear here"}
                    className={inputCls + (!manualMode ? " bg-gray-50 cursor-default select-none" : "")}
                    style={{ color: resolving ? "#9CA3AF" : undefined }}
                  />
                  {accName && !resolving && !manualMode && (
                    <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                  )}
                </div>
              </div>

              {error && (
                <p className="text-sm mt-3" style={{ color: manualMode ? "#B45309" : "#EF4444" }}>
                  {error}
                </p>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving || resolving || !accName.trim()}
              className="w-full mt-6 py-3.5 rounded-lg text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all border-none cursor-pointer disabled:opacity-50 bg-brand"
            >
              {saving ? "Setting up…" : "Set-Up Account"}
            </button>
            <button
              onClick={handleSkip}
              disabled={saving}
              className="w-full mt-3 text-sm font-medium text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer disabled:opacity-50"
            >
              Skip for now — set this up later
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
