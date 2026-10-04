import {
  CheckBadgeArt,
  ClockArt,
  AlertArt,
  GlyphIdCard,
  GlyphFaceScan,
  GlyphStatus,
  GlyphCheckMark,
} from "../illustrations";
import StatusNarrative from "../StatusNarrative";
import { KYC_NARRATIVE_LINES, KYC_TIMELINE_STEPS } from "../narrativeLines";
import { GLASS_PASS_UNLOCKS } from "../unlocks";
import {
  kycStatusLabel,
  idTypeLabel,
  isKycInFlight,
  isKycTerminal,
} from "../../../utils/kycStatus";
import { Button } from "../../../components/ui/Button";

// Step 3 — Result. Owns every post-capture state: the live timeline while
// work is happening, then the resolved cards (verified / under review /
// resume / retry / blocked). Precedence is strict: settled server states
// always win over the narrative so a finished check never keeps "cycling".

// "Before you try again" — the three things that actually fix a failed
// selfie/mismatch. A retry with no guidance is how people fail twice.
// A function, not a constant, because the third tip names the chosen ID.
const retryTips = (idLabel) => [
  "Face a window or lamp so your face is lit evenly.",
  "Take off hats, sunglasses and masks.",
  `Check your ${idLabel} digits before you submit.`,
];

function KycTimeline({ activeIndex, idLabel }) {
  return (
    <ol className="flex flex-col gap-2.5 list-none p-0 m-0">
      {KYC_TIMELINE_STEPS.map(({ key, label }, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <li key={key} className="flex items-start gap-2.5">
            <span
              className={[
                "w-[17px] h-[17px] rounded-full flex items-center justify-center flex-shrink-0 mt-[1px] transition-colors",
                done
                  ? "bg-brand text-white"
                  : active
                    ? "bg-white ring-2 ring-brand"
                    : "bg-stacked-container border border-hairline-neutral",
              ].join(" ")}
            >
              {done && <GlyphCheckMark size={9} />}
            </span>
            <span
              className={[
                "text-[12px] leading-tight",
                done || active ? "text-ink font-medium" : "text-ink-faint",
              ].join(" ")}
            >
              {label.replace(/\{id\}/g, idLabel)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
export default function StatusStep({ kyc, settled, onRetry, onHistory }) {
  const {
    summary,
    status,
    confirmed,
    capturing,
    startPending,
    isApproved,
    isInReview,
    isPending,
    showResume,
    attemptsAllowed,
    canStart,
    idType,
    localError,
    isFetching,
    handleResume,
    handleRefreshStatus,
    resumePending,
  } = kyc;

  const busy = startPending || capturing;
  const inFlight = isKycInFlight(status);
  const narrativeActive =
    busy || (confirmed && isPending) || (!confirmed && !showResume && inFlight && !settled);

  const reason =
    summary?.restrictionReason ?? summary?.revokedReason ?? summary?.decisionReason ?? null;

  const cardCls = "rounded-2xl border border-surface-container-border bg-white p-4";

  return (
    <div className="flex flex-col gap-3">
      {localError && !busy && (
        <p className="text-xs text-danger mx-1 mb-0 leading-relaxed">{localError}</p>
      )}

      {isApproved && (
        <div className={cardCls}>
          {/* Approval moment: the scene pops in with breathing rings and a
              confetti burst (index.css — all killed under
              prefers-reduced-motion). The headline stays exactly "Identity
              verified" — KycWizardModal's test asserts that text. */}
          <div className="flex flex-col items-center text-center gap-0.5 pt-1 pb-1.5">
            <span className="relative inline-flex mb-2 kyc-success-scene">
              <CheckBadgeArt size={112} />
              <span
                className="kyc-confetti"
                style={{
                  top: "2%",
                  left: "8%",
                  background: "var(--color-brand)",
                  "--cx": "-16px",
                  "--cy": "-26px",
                }}
              />
              <span
                className="kyc-confetti"
                style={{
                  top: "0%",
                  left: "46%",
                  background: "#f59e0b",
                  "--cx": "0px",
                  "--cy": "-32px",
                }}
              />
              <span
                className="kyc-confetti"
                style={{
                  top: "8%",
                  right: "6%",
                  background: "var(--color-danger-bright)",
                  "--cx": "18px",
                  "--cy": "-22px",
                }}
              />
              <span
                className="kyc-confetti"
                style={{
                  bottom: "10%",
                  left: "4%",
                  background: "#4ade80",
                  "--cx": "-22px",
                  "--cy": "14px",
                }}
              />
              <span
                className="kyc-confetti"
                style={{
                  bottom: "2%",
                  left: "40%",
                  background: "#8b5cf6",
                  "--cx": "-4px",
                  "--cy": "28px",
                }}
              />
              <span
                className="kyc-confetti"
                style={{
                  bottom: "12%",
                  right: "8%",
                  background: "var(--color-brand)",
                  "--cx": "20px",
                  "--cy": "12px",
                }}
              />
            </span>
            <p className="text-[15px] font-bold text-success m-0">Identity verified</p>
            <p className="text-xs text-ink-muted mt-1 mb-0 leading-relaxed">
              You can create and manage communities.
            </p>
          </div>

          {/* What just unlocked — the same three rows the Glass Pass rail
              shows, so the win is stated rather than left implied. */}
          <ul className="flex flex-col gap-2 list-none p-0 m-0 mt-3 pt-3 border-t border-surface-container-border">
            {GLASS_PASS_UNLOCKS.map(({ id, Glyph, text }) => (
              <li key={id} className="flex items-center gap-2.5">
                <span className="w-[24px] h-[24px] rounded-lg bg-success-tint flex items-center justify-center flex-shrink-0">
                  <Glyph size={14} />
                </span>
                <span className="text-[12px] text-ink-strong leading-tight">{text}</span>
                <span className="ml-auto w-[15px] h-[15px] rounded-full bg-success text-white flex items-center justify-center flex-shrink-0">
                  <GlyphCheckMark size={9} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isApproved && isInReview && !narrativeActive && (
        <div className={cardCls}>
          <div className="flex items-start gap-3">
            <ClockArt size={48} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink m-0">Under review</p>
              <p className="text-xs text-ink-muted mt-0.5 mb-0 leading-relaxed">
                Our team is reviewing your results — this usually doesn&apos;t take long.
                {summary?.decisionReason ? ` ${summary.decisionReason}` : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isApproved && narrativeActive && (
        <>
          {/* The checklist and the rotating line are complementary: the list
              says where we are, the line says we're still moving. */}
          <div className="px-1">
            <KycTimeline
              activeIndex={busy ? (startPending ? 0 : 1) : 2}
              idLabel={idTypeLabel(idType)}
            />
          </div>
          <StatusNarrative
            key={busy ? (startPending ? "launching" : "capturing") : "processing"}
            phase={busy ? (startPending ? "launching" : "capturing") : "processing"}
            lines={
              busy
                ? startPending
                  ? KYC_NARRATIVE_LINES.launching
                  : KYC_NARRATIVE_LINES.capturing
                : KYC_NARRATIVE_LINES.processing
            }
            icon={
              busy ? (
                capturing ? (
                  <GlyphFaceScan size={19} />
                ) : (
                  <GlyphIdCard size={19} />
                )
              ) : (
                <GlyphStatus size={19} />
              )
            }
          />
        </>
      )}

      {!isApproved && showResume && !confirmed && !narrativeActive && (
        <div className={cardCls}>
          <div className="flex items-start gap-3">
            <GlyphIdCard size={20} className="text-brand flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink m-0">Continue verification</p>
              <p className="text-xs text-ink-muted mt-0.5 mb-3 leading-relaxed">
                Your previous session is still open. Resume to finish the Smile ID check.
              </p>
              <Button
                size="sm"
                fullWidth={false}
                className="px-6"
                onClick={handleResume}
                loading={capturing || resumePending}
              >
                {capturing ? "Opening Smile ID…" : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isApproved && !isInReview && !showResume && !narrativeActive && inFlight && (
        <div className={cardCls}>
          <p className="text-sm font-semibold text-ink m-0">Verification in progress</p>
          <p className="text-xs text-ink-muted mt-1 mb-0 leading-relaxed">
            We&apos;re waiting on your results — no need to start again.{" "}
            {settled ? "We'll notify you the moment it's done." : ""}
          </p>
          <button
            onClick={handleRefreshStatus}
            disabled={isFetching}
            className="mt-2.5 text-xs font-medium text-brand bg-transparent border-none cursor-pointer p-0 disabled:opacity-60"
          >
            {isFetching ? "Refreshing…" : "Check status"}
          </button>
        </div>
      )}

      {!isApproved && !attemptsAllowed && (summary?.restrictionReason || !canStart) && (
        <div className={cardCls + " bg-danger-tint border-[#fecaca]"}>
          <div className="flex items-start gap-3">
            <AlertArt size={48} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-danger m-0">New attempts disabled</p>
              <p className="text-xs text-ink-muted mt-1 mb-0 leading-relaxed">
                {summary?.restrictionReason ??
                  "A platform administrator has paused new verification attempts on your account."}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isApproved &&
        !isInReview &&
        !inFlight &&
        !showResume &&
        !narrativeActive &&
        attemptsAllowed &&
        isKycTerminal(status) && (
          <div className={cardCls}>
            <div className="flex items-start gap-3">
              <AlertArt size={48} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink m-0">
                  Verification {kycStatusLabel(status).toLowerCase()}
                </p>
                <p className="text-xs text-ink-muted mt-1 mb-0 leading-relaxed">
                  {reason ??
                    "The check didn't complete. You can try again with the same or a different ID."}
                </p>
                <div className="mt-3 rounded-xl bg-stacked-container px-3 py-2.5">
                  <p className="text-[11.5px] font-semibold text-ink m-0">Before you try again</p>
                  <ul className="flex flex-col gap-1 list-none p-0 m-0 mt-1.5">
                    {retryTips(idTypeLabel(idType)).map((tip) => (
                      <li
                        key={tip}
                        className="flex items-start gap-1.5 text-[11.5px] text-ink-muted leading-[1.45]"
                      >
                        <span className="w-[4px] h-[4px] rounded-full bg-ink-faint flex-shrink-0 mt-[6px]" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={onRetry}
                  className="mt-2.5 text-xs font-medium text-brand bg-transparent border-none cursor-pointer p-0"
                >
                  Try another ID
                </button>
              </div>
            </div>
          </div>
        )}

      {!isApproved &&
        !isInReview &&
        !inFlight &&
        !showResume &&
        !narrativeActive &&
        attemptsAllowed &&
        !canStart &&
        !isKycTerminal(status) && (
          <div className={cardCls}>
            <p className="text-sm font-semibold text-ink m-0">Status: {kycStatusLabel(status)}</p>
            <p className="text-xs text-ink-muted mt-1 mb-0 leading-relaxed">
              {reason ??
                "You can't start a new attempt right now. Check status or contact support if this seems wrong."}
            </p>
            <button
              onClick={handleRefreshStatus}
              disabled={isFetching}
              className="mt-2.5 text-xs font-medium text-brand bg-transparent border-none cursor-pointer p-0 disabled:opacity-60"
            >
              {isFetching ? "Refreshing…" : "Check status"}
            </button>
          </div>
        )}

      {onHistory && (
        <button
          onClick={onHistory}
          className="self-center text-xs font-medium text-brand bg-transparent border-none cursor-pointer p-0"
        >
          View attempt history
        </button>
      )}
    </div>
  );
}
