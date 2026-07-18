import { useNavigate } from "react-router-dom";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { useNotificationPreferences } from "../../../../hooks/useNotifications";
import Toggle from "../../../../components/common/Toggle";
import GlassLogoGlow from "../../../../components/common/GlassLogoGlow";

function PrefRow({ label, desc, value, onChange, disabled, last = false }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 16px",
      borderBottom: last ? "none" : "1px solid #F2F2F2",
    }}>
      <div style={{ minWidth: 0, paddingRight: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: "#111", margin: 0 }}>{label}</p>
        {desc && <p style={{ fontSize: 12, color: "#999", margin: "2px 0 0" }}>{desc}</p>}
      </div>
      <Toggle on={!!value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: "#999", margin: "0 4px 8px",
        textTransform: "uppercase", letterSpacing: 0.6,
      }}>
        {title}
      </p>
      <div className="border border-surface-container-border" style={{
        background: "#fff", borderRadius: 14,
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden",
      }}>
        {children}
      </div>
    </div>
  );
}

function SkeletonRow({ last }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px", borderBottom: last ? "none" : "1px solid #F2F2F2",
    }}>
      <div>
        <div style={{ width: 140, height: 13, borderRadius: 6, background: "#EBEBEB", marginBottom: 6 }} />
        <div style={{ width: 200, height: 11, borderRadius: 6, background: "#F2F2F2" }} />
      </div>
      <div style={{ width: 40, height: 22, borderRadius: 999, background: "#EBEBEB", flexShrink: 0 }} />
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
    <div style={{
      position: "relative", overflow: "hidden",
      minHeight: "100vh",  
      fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 40,
    }}>
      <GlassLogoGlow />
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36, borderRadius: "50%", background: "#fff",
            border: "none", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)", flexShrink: 0,
          }}
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
        <h1 className="text-lg font-semibold text-[#111] m-0">Notifications</h1>
      </div>

      <div className="px-4">
        {/* Error state */}
        {error && !isLoading && (
          <div style={{
            background: "#FFF0F0", border: "1px solid #FECACA", borderRadius: 12,
            padding: "14px 16px", marginBottom: 20,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <p style={{ fontSize: 13, color: "#DC2626", margin: 0 }}>
              Couldn't load preferences.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#DC2626", display: "flex", alignItems: "center", gap: 4,
                fontSize: 12, fontWeight: 600, padding: 0,
              }}
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
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8,
          padding: "12px 14px", borderRadius: 10, background: "#D7E2FF",
        }}>
          <div style={{
            width: 16, height: 16, borderRadius: "50%",
            border: "1.5px solid #002FA7", display: "flex",
            alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 1,
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#002FA7" }}>i</span>
          </div>
          <p style={{ fontSize: 12, color: "#333", margin: 0, lineHeight: 1.5 }}>
            Changes take effect immediately. Critical security alerts are always sent regardless of your preferences.
          </p>
        </div>
      </div>
    </div>
  );
}
