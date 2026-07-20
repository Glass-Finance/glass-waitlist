import { useNavigate } from "react-router-dom";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { useNotificationPreferences } from "../../../../hooks/useNotifications";
import Toggle from "../../../../components/common/Toggle";
import GlassLogoGlow from "../../../../components/common/GlassLogoGlow";

function PrefRow({ label, desc, value, onChange, disabled, last = false }) {
  return (
    <div className={`flex items-center justify-between py-3.5 px-4 ${last ? "border-none" : "border-b border-[#F2F2F2]"}`}>
      <div className="min-w-0 pr-3">
        <p className="text-sm font-medium text-[#111] m-0">{label}</p>
        {desc && <p className="text-xs text-[#999] mt-0.5 mx-0 mb-0">{desc}</p>}
      </div>
      <Toggle on={!!value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-bold text-[#999] mt-0 mx-1 mb-2 uppercase [letter-spacing:0.6px]">
        {title}
      </p>
      <div className="border border-surface-container-border bg-white rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.05)] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SkeletonRow({ last }) {
  return (
    <div className={`flex items-center justify-between p-4 ${last ? "border-none" : "border-b border-[#F2F2F2]"}`}>
      <div>
        <div className="w-[140px] h-[13px] rounded-md bg-[#EBEBEB] mb-1.5" />
        <div className="w-[200px] h-[11px] rounded-md bg-[#F2F2F2]" />
      </div>
      <div className="w-10 h-[22px] rounded-full bg-[#EBEBEB] flex-shrink-0" />
    </div>
  );
}

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { preferences, isLoading, error, update } = useNotificationPreferences();

  const get = (key, defaultVal = true) => preferences[key] ?? defaultVal;

  // When preferences failed to load, the values shown are just defaults —
  // letting the user flip them would save against unknown server state.
  const Row = (props) => <PrefRow disabled={!!error} {...props} />;

  return (
    <div
      className="relative overflow-hidden min-h-screen pb-10"
    >
      <GlassLogoGlow />
      {/* Header */}
      <div className="flex items-center gap-2.5 pt-5 px-4 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.1)] flex-shrink-0"
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
        <h1 className="text-lg font-semibold text-[#111] m-0">Notifications</h1>
      </div>

      <div className="px-4">
        {/* Error state */}
        {error && !isLoading && (
          <div className="bg-[#FFF0F0] border border-[#FECACA] rounded-xl py-3.5 px-4 mb-5 flex items-center justify-between">
            <p className="text-[13px] text-danger m-0">
              Couldn't load preferences.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-transparent border-none cursor-pointer text-danger flex items-center gap-1 text-xs font-semibold p-0"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* ── Channels ───────────────────────────────────────────────────────── */}
        <Section title="Notification channels">
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow last />
            </>
          ) : (
            <>
              <Row
                label="In-app"
                desc="Show notifications inside the app"
                value={get("inAppEnabled")}
                onChange={(v) => update("inAppEnabled", v)}
              />
              <Row
                label="Email"
                desc="Send updates to your email address"
                value={get("emailEnabled")}
                onChange={(v) => update("emailEnabled", v)}
              />
              <Row
                label="WhatsApp"
                desc="Send updates to your WhatsApp number"
                value={get("whatsappEnabled")}
                onChange={(v) => update("whatsappEnabled", v)}
                last
              />
            </>
          )}
        </Section>

        {/* ── Payments ───────────────────────────────────────────────────────── */}
        <Section title="Payments">
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow last />
            </>
          ) : (
            <>
              <Row
                label="Payment reminders"
                desc="Get reminded before a payment is due"
                value={get("paymentReminderEnabled")}
                onChange={(v) => update("paymentReminderEnabled", v)}
              />
              <Row
                label="Payment receipts"
                desc="Confirmation when a payment goes through"
                value={get("paymentReceiptEnabled")}
                onChange={(v) => update("paymentReceiptEnabled", v)}
              />
              <Row
                label="Failed payments"
                desc="Alert when one of your payments fails or is declined"
                value={get("paymentFailureEnabled")}
                onChange={(v) => update("paymentFailureEnabled", v)}
              />
              <Row
                label="Auto-Pay alerts"
                desc="Notified 3 days before an auto-pay charge"
                value={get("autoPayAlertEnabled")}
                onChange={(v) => update("autoPayAlertEnabled", v)}
                last
              />
            </>
          )}
        </Section>

        {/* ── Community ──────────────────────────────────────────────────────── */}
        <Section title="Community">
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow last />
            </>
          ) : (
            <>
              <Row
                label="Community updates"
                desc="Announcements from community admins"
                value={get("communityUpdateEnabled")}
                onChange={(v) => update("communityUpdateEnabled", v)}
              />
              <Row
                label="Invitations"
                desc="When you're invited to join a community"
                value={get("inviteNotificationEnabled")}
                onChange={(v) => update("inviteNotificationEnabled", v)}
                last
              />
            </>
          )}
        </Section>

        {/* Info note */}
        <div className="flex items-start gap-2 py-3 px-3.5 rounded-[10px] bg-[#D7E2FF]">
          <div className="w-4 h-4 rounded-full border-[1.5px] border-brand flex items-center justify-center flex-shrink-0 mt-px">
            <span className="text-[9px] font-bold text-brand">i</span>
          </div>
          <p className="text-xs text-[#333] m-0 leading-[1.5]">
            Changes take effect immediately. Critical security alerts are always sent regardless of your preferences.
          </p>
        </div>
      </div>
    </div>
  );
}
