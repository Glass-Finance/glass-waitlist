import { useMemo, useState } from "react";
import GlassLogoGlow from "../../components/common/GlassLogoGlow";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { usePayments, useManagePayments } from "../../hooks/usePayments";
import PageLoadingState from "../../components/common/PageLoadingState";
import Toggle from "../../components/common/Toggle";
import ConfirmSheet from "../../components/common/ConfirmSheet";
import { formatNaira, formatDate, toTitleCase } from "../../utils/format";

function frequencyLabel(freq) {
  const f = (freq ?? "").toUpperCase();
  if (f === "MONTHLY")   return "/month";
  if (f === "WEEKLY")    return "/week";
  if (f === "QUARTERLY") return "/quarter";
  if (f.includes("YEAR") || f === "ANNUALLY") return "/year";
  if (f === "DAILY")     return "/day";
  return "";
}

// ── Mastercard-style overlapping circles icon ─────────────────────────────────
function CardIcon({ cardType }) {
  const type = (cardType ?? "").toUpperCase();
  // Mastercard: red + orange circles; Visa: blue circle; default: grey
  const left  = type.includes("MASTER") ? "#EB001B" : type.includes("VISA") ? "#1A1F71" : "#999";
  const right = type.includes("MASTER") ? "#F79E1B" : type.includes("VISA") ? "#00B1EA" : "#bbb";
  return (
    <div style={{ position: "relative", width: 30, height: 20, flexShrink: 0 }}>
      <div style={{ position: "absolute", left: 0, width: 20, height: 20, borderRadius: "50%", background: left, opacity: 0.9 }} />
      <div style={{ position: "absolute", left: 10, width: 20, height: 20, borderRadius: "50%", background: right, opacity: 0.85 }} />
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────

// ── Filter dropdown ───────────────────────────────────────────────────────────
const FILTER_OPTIONS = ["All", "Auto-Pay On", "Auto-Pay Off"];

function FilterDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1.5px solid #D0D0D0", background: "#fff", color: "#111", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
      >
        {value} <ChevronDown size={14} strokeWidth={2} />
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 20, minWidth: 150, overflow: "hidden" }}>
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 16px", fontSize: 13, cursor: "pointer", background: value === opt ? "#F0F2FA" : "#fff", color: value === opt ? "#002FA7" : "#333", fontWeight: value === opt ? 600 : 400, border: "none" }}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Plan card (matches Figma) ─────────────────────────────────────────────────
function PlanCard({ plan, auth, onToggle }) {
  const isOn = !!auth;
  const cardLabel = auth?.last4 ? `***${auth.last4}` : null;
  const expiry = auth?.expMonth && auth?.expYear
    ? `${String(auth.expMonth).padStart(2, "0")}/${String(auth.expYear).slice(-2)}`
    : null;

  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
      {/* Main body */}
      <div style={{ padding: "16px 16px 14px" }}>
        {/* Row 1: logo + Recurring badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#F0F4FF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {plan.logo?.url
              ? <img src={plan.logo.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 18, fontWeight: 700, color: "#1C2B8A" }}>{plan.logoText ?? "P"}</span>}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#002FA7", background: "#E8EEFF", padding: "4px 12px", borderRadius: 999 }}>
            Recurring
          </span>
        </div>

        {/* Row 2: amount */}
        <p style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>
          {formatNaira(plan.amount)}
          <span style={{ fontSize: 13, fontWeight: 400, color: "#888" }}>{frequencyLabel(plan.frequency)}</span>
        </p>

        {/* Row 3: plan name + auto-pay toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#111", margin: 0 }}>{toTitleCase(plan.name)}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#888" }}>Auto-Pay</span>
            <Toggle on={isOn} onChange={() => onToggle(plan, auth)} />
          </div>
        </div>

        {/* Row 4: next charge */}
        {plan.dueDate && (
          <p style={{ fontSize: 13, color: "#888", margin: "6px 0 0" }}>
            Next charge: {formatDate(plan.dueDate)}
          </p>
        )}
      </div>

      {/* Card row */}
      <div style={{ borderTop: "1px solid #F2F2F2", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {cardLabel ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CardIcon cardType={auth?.cardType ?? auth?.channel} />
              <span style={{ fontSize: 14, fontWeight: 500, color: "#333" }}>
                {cardLabel}{expiry ? ` | ${expiry}` : ""}
              </span>
            </div>
            <button
              style={{ fontSize: 14, fontWeight: 600, color: "#002FA7", background: "none", border: "none", cursor: "pointer" }}
            >
              Change
            </button>
          </>
        ) : (
          <span style={{ fontSize: 13, color: "#aaa" }}>No saved card</span>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ManagePayments() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const { data, isLoading: paymentsLoading } = usePayments();
  const { data: authorisations, isLoading: authsLoading, toggleAutoPay, isRemoving } = useManagePayments();
  const [turningOff, setTurningOff] = useState(null); // { plan, auth }

  const isLoading = paymentsLoading || authsLoading;

  // Build unique recurring plans from upcoming obligations
  const recurringPlans = useMemo(() => {
    const seen = new Map();
    for (const o of data?.upcoming ?? []) {
      if (o.type !== "recurring") continue;
      const key = o.paymentLinkId ?? `${o.name}__${o.communityName}`;
      if (!seen.has(key)) seen.set(key, o);
    }
    // Also surface plans from auth consents that may not have an obligation yet
    for (const auth of authorisations ?? []) {
      for (const c of auth.consents ?? []) {
        if (c.revoked) continue;
        const key = c.paymentLinkId ?? `${c.paymentLinkTitle}__${c.communityName}`;
        if (!seen.has(key)) {
          seen.set(key, {
            paymentLinkId: c.paymentLinkId,
            name: c.paymentLinkTitle ?? "Payment Plan",
            communityName: c.communityName ?? "",
            amount: null,
            frequency: null,
            dueDate: null,
            logoText: (c.communityName ?? "P").charAt(0).toUpperCase(),
            logo: null,
          });
        }
      }
    }
    return [...seen.values()];
  }, [data, authorisations]);

  function findAuth(plan) {
    for (const auth of authorisations ?? []) {
      const match = auth.consents.find((c) => {
        if (c.revoked) return false;
        if (plan.paymentLinkId && c.paymentLinkId) return c.paymentLinkId === plan.paymentLinkId;
        return c.paymentLinkTitle === plan.name && c.communityName === plan.communityName;
      });
      if (match) return auth;
    }
    return null;
  }

  function handleToggle(plan, auth) {
    if (auth) {
      setTurningOff({ plan, auth });
    }
    // Turning ON requires initiating a payment with a new card — navigate to payment flow
    // (enabling is done automatically when a payment is completed with a reusable card)
  }

  const filtered = recurringPlans.filter((plan) => {
    const auth = findAuth(plan);
    if (filter === "Auto-Pay On")  return !!auth;
    if (filter === "Auto-Pay Off") return !auth;
    return true;
  });

  return (
    <div style={{ position: "relative", overflow: "hidden", minHeight: "100vh", background: "var(--color-surface-bg)", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 60 }}>
      <GlassLogoGlow />
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "22px 20px 20px", position: "relative" }}>
        <button
          onClick={() => navigate(-1)}
          style={{ position: "absolute", left: 20, width: 36, height: 36, borderRadius: "50%", background: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.10)" }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "#111", margin: 0 }}>Manage Payments</h1>
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* Filter */}
        <div style={{ marginBottom: 16 }}>
          <FilterDropdown value={filter} onChange={setFilter} />
        </div>

        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {isLoading ? (
            <PageLoadingState size={56} padding="36px 24px" />
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: "center", color: "#999", fontSize: 14, marginTop: 40 }}>
              {recurringPlans.length === 0
                ? "You're not enrolled in any recurring plans yet."
                : "No plans match this filter."}
            </p>
          ) : (
            filtered.map((plan) => (
              <PlanCard
                key={plan.paymentLinkId ?? `${plan.name}-${plan.communityName}`}
                plan={plan}
                auth={findAuth(plan)}
                onToggle={handleToggle}
              />
            ))
          )}
        </div>
      </div>

      {turningOff && (
        <ConfirmSheet
          title="Turn Off Auto-Pay?"
          description={`This removes the saved payment method for ${turningOff.plan.name} entirely — Auto-Pay will stop for every plan tied to that same method, not just this one.`}
          confirmLabel="Yes, turn off"
          confirmingLabel="Turning off…"
          confirming={isRemoving}
          onCancel={() => setTurningOff(null)}
          onConfirm={() =>
            toggleAutoPay(turningOff.auth.id, false, { onSuccess: () => setTurningOff(null) })
          }
        />
      )}
    </div>
  );
}
