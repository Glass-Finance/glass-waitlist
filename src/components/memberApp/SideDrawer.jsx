import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  CreditCard,
  Mail,
  User,
  Settings,
  LogOut,
  X,
  LayoutDashboard,
  Search,
} from "lucide-react";
import { useAuth } from "../../store/AuthContext";
import { useMyCommunities } from "../../hooks/useMyAccount";
import { resolveIsPayingAdmin } from "../../utils/communityRole";

const NAV_ITEMS = [
  { Icon: HomeIcon, label: "Home", to: "/member/home" },
  { Icon: CreditCard, label: "Manage Payments", to: "/member/manage-payments" },
  { Icon: Mail, label: "Invitations", to: "/member/invites" },
  { Icon: User, label: "Profile", to: "/member/profile" },
  { Icon: Settings, label: "Settings", to: "/member/settings" },
];

function getInitials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function setActiveMemberCommunity(c) {
  try {
    localStorage.setItem(
      "glass_member_community",
      JSON.stringify({ id: c.id, slug: c.slug, name: c.name }),
    );
  } catch {
    /* ignore */
  }
}

// Shared across the whole member app (rendered once by MemberAppLayout) so
// every page — not just Home — has a way to reach Settings/My Communities.
export default function SideDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();
  const { data: rawCommunities = [] } = useMyCommunities();
  const [query, setQuery] = useState("");
  const [switchingId, setSwitchingId] = useState(null);

  // Same shape-flattening as MyCommunities.jsx -- some list endpoints nest
  // the real fields under `.community`, some don't.
  const communities = useMemo(
    () =>
      rawCommunities.map((c) => ({
        ...c,
        name: c.name ?? c.community?.name,
        slug: c.slug ?? c.community?.slug,
        logo: c.logo ?? c.community?.logo,
        id: c.id ?? c.community?.id,
      })),
    [rawCommunities],
  );

  const filteredCommunities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return communities;
    return communities.filter((c) => c.name?.toLowerCase().includes(q));
  }, [communities, query]);

  // Same switch logic as MyCommunities.jsx's handleSelect: an owned
  // community goes to its admin dashboard, a joined-as-member one just
  // becomes the active member community.
  async function handleSelectCommunity(c) {
    if (switchingId) return;
    if (c.owned) {
      setSwitchingId(c.id);
      try {
        localStorage.setItem("glass_community", JSON.stringify(c));
        const isPaying = await resolveIsPayingAdmin(c.slug ?? c.id);
        onClose();
        navigate(isPaying ? `/dashboard/admin/paying?community=${c.slug}` : `/dashboard/admin?community=${c.slug}`);
      } finally {
        setSwitchingId(null);
      }
    } else {
      setActiveMemberCommunity(c);
      onClose();
      navigate("/member/home");
    }
  }

  async function handleLogout() {
    onClose();
    await logout();
    // SignIn.jsx reads this to skip its "New to Glass?" copy -- someone who
    // just logged out obviously already has an account.
    navigate("/member/app-sign-in", { replace: true, state: { justLoggedOut: true } });
  }

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/25 transition-opacity duration-[280ms] ease-[ease] ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[300px] z-50 bg-[#D9D9D9] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pt-5 px-5 pb-4">
          <div className="flex items-center gap-1.5">
            <div>
              <img
                src="/Glass.webp"
                alt="Glass"
                className="w-[30px] h-[30px]"
              />
            </div>
            <span className="text-lg font-medium text-[#111]">
              Glass
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="bg-transparent border-none cursor-pointer p-1 text-[#555]"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="h-px bg-[#0000000D] mx-0 my-0" />

        {/* Community search/switcher — only worth showing once there's more
            than one to pick from; with just one (or none yet) it'd just be
            an extra tap for no benefit over the existing nav items below. */}
        {communities.length > 1 && (
          <div className="pt-3 px-4">
            <div className="flex items-center gap-2 bg-white/70 rounded-xl py-2 px-3 border border-[#0000001A]">
              <Search size={14} className="text-[#888] flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your communities…"
                className="flex-1 min-w-0 border-none outline-none bg-transparent text-[13px] text-[#111] placeholder-[#999]"
              />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto pt-2 px-4 pb-2 flex flex-col gap-1">
          {communities.length > 1 && (
            <>
              {filteredCommunities.length === 0 ? (
                <p className="text-xs text-[#888] px-3 py-2">
                  No communities match "{query}"
                </p>
              ) : (
                filteredCommunities.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCommunity(c)}
                    disabled={switchingId === c.id}
                    className={`flex items-center gap-2.5 py-2 px-3 rounded-xl border-none bg-transparent w-full text-left ${switchingId === c.id ? "cursor-default opacity-60" : "cursor-pointer"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 overflow-hidden ${c.logo?.url ? "bg-transparent" : "bg-[#1C2B8A]"}`}
                    >
                      {c.logo?.url ? (
                        <img src={c.logo.url} alt="" decoding="async" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(c.name) || "?"
                      )}
                    </div>
                    <span className="text-[13.5px] font-medium text-[#222] flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                      {c.name}
                    </span>
                  </button>
                ))
              )}
              <div className="h-px bg-[#0000000D] my-2 mx-0" />
            </>
          )}

          {NAV_ITEMS.map(({ Icon, label, to }) => (
            <button
              key={label}
              onClick={() => {
                onClose();
                navigate(to);
              }}
              className="flex items-center gap-3 py-3.5 px-3 rounded-xl border-none bg-transparent cursor-pointer w-full text-left"
            >
              <Icon size={20} strokeWidth={1.6} className="text-[#444]" />
              <span className="text-[15px] font-normal text-[#222]">
                {label}
              </span>
            </button>
          ))}

          {isAdmin && (
            <>
              <div className="h-px bg-[#0000000D] my-1 mx-0" />
              <button
                onClick={() => { onClose(); navigate("/dashboard/home"); }}
                className="flex items-center gap-3 py-3.5 px-3 rounded-xl border-none bg-transparent cursor-pointer w-full text-left"
              >
                <LayoutDashboard size={20} strokeWidth={1.6} className="text-brand" />
                <span className="text-[15px] font-normal text-brand">
                  Admin Dashboard
                </span>
              </button>
            </>
          )}
        </nav>

        {/* Log out — pinned to bottom */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 pt-5 px-6 border-none bg-transparent cursor-pointer text-left outline-none pb-[max(env(safe-area-inset-bottom,0px)_+_32px,56px)]"
        >
          <LogOut size={18} strokeWidth={1.8} className="text-[#D32F2F]" />
          <span className="text-[15px] font-medium text-[#D32F2F]">
            Log Out
          </span>
        </button>
      </div>
    </>
  );
}
