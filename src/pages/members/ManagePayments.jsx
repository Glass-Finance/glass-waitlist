import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, Landmark, Trash2 } from "lucide-react";
import { useManagePayments } from "../../hooks/usePayments";

const FILTER_OPTIONS = ["All", "Active", "Revoked"];

// ─── Filter dropdown ──────────────────────────────────────────────────────────
function FilterDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          borderRadius: 8,
          border: "1.5px solid #D0D0D0",
          background: "#fff",
          color: "#111",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {value}
        <ChevronDown size={13} strokeWidth={2} />
      </button>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 10 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              background: "#fff",
              borderRadius: 10,
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              border: "1px solid #EFEFEF",
              zIndex: 20,
              overflow: "hidden",
              minWidth: 130,
            }}
          >
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "11px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                  background: value === opt ? "#F0F2FA" : "#fff",
                  color: value === opt ? "#002FA7" : "#333",
                  fontWeight: value === opt ? 600 : 400,
                  border: "none",
                }}
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

// ─── Authorisation card ───────────────────────────────────────────────────────
function AuthCard({ item, onRemove, removing }) {
  const isActive = (item.status ?? "").toUpperCase() === "ACTIVE";
  const activeConsents = item.consents.filter((c) => !c.revoked);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {/* Top section */}
      <div style={{ padding: "16px 16px 14px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "#E8ECF8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Landmark size={18} style={{ color: "#1C2B8A" }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: 0 }}>
                {item.bank ?? "Bank account"}
              </p>
              <p style={{ fontSize: 12, color: "#999", margin: "2px 0 0" }}>
                ***{item.last4}
              </p>
            </div>
          </div>

          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: isActive ? "#15803d" : "#999",
              background: isActive ? "#dcfce7" : "#F0F0F0",
              padding: "4px 12px",
              borderRadius: 999,
            }}
          >
            {isActive ? "Active" : (item.status ?? "Inactive")}
          </span>
        </div>

        <p style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
          Channel: {item.channel ?? "—"}
        </p>

        {/* Consents — plans this authorisation auto-pays for */}
        {activeConsents.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {activeConsents.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  background: "#F7F8FA",
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 12, color: "#333" }}>
                  {c.paymentLinkTitle ?? "Plan"}
                  {c.communityName ? ` · ${c.communityName}` : ""}
                </span>
                <span style={{ fontSize: 11, color: "#888" }}>{c.planStatus}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#F0F0F0" }} />

      {/* Remove row */}
      <div style={{ padding: "10px 16px" }}>
        <button
          onClick={() => onRemove(item.id)}
          disabled={removing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: "#DC2626",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            opacity: removing ? 0.6 : 1,
          }}
        >
          <Trash2 size={14} />
          Remove auto-pay
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ManagePayments() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const { data, isLoading, error, toggleAutoPay, isRemoving } = useManagePayments();

  function handleRemove(id) {
    toggleAutoPay(id, false);
  }

  const filtered = data.filter((p) => {
    if (filter === "All") return true;
    const isActive = (p.status ?? "").toUpperCase() === "ACTIVE";
    return filter === "Active" ? isActive : !isActive;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#EBEBEB",
        fontFamily: "'Inter', system-ui, sans-serif",
        paddingBottom: 40,
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "22px 20px 20px",
          position: "relative",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            position: "absolute",
            left: 20,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
          }}
        >
          <ChevronLeft size={18} strokeWidth={2} style={{ color: "#111" }} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111", margin: 0 }}>
          Manage Payments
        </h1>
      </div>

      {/* Filter */}
      <div style={{ padding: "0 16px 16px" }}>
        <FilterDropdown value={filter} onChange={setFilter} />
      </div>

      {/* Cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "0 16px",
        }}
      >
        {isLoading ? (
          <p style={{ textAlign: "center", color: "#999", fontSize: 14, marginTop: 40 }}>
            Loading…
          </p>
        ) : error ? (
          <p style={{ textAlign: "center", color: "#DC2626", fontSize: 14, marginTop: 40 }}>
            Couldn't load saved payment methods.
          </p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: "center", color: "#999", fontSize: 14, marginTop: 40 }}>
            No saved payment methods yet.
          </p>
        ) : (
          filtered.map((item) => (
            <AuthCard
              key={item.id}
              item={item}
              onRemove={handleRemove}
              removing={isRemoving}
            />
          ))
        )}
      </div>
    </div>
  );
}
