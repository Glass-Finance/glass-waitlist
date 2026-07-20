import { useState } from "react";
import GlassLogoGlow from "../../../../components/common/GlassLogoGlow";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronLeft, ChevronRight, LogOut, Plus, Users, X } from "lucide-react";
import { useMyCommunities, useLeaveCommunity } from "../../../../hooks/useMyAccount";
import { resolveIsPayingAdmin } from "../../../../utils/communityRole";
import PageLoadingState from "../../../../components/common/PageLoadingState";
import EmptyState from "../../../../components/common/EmptyState";

function getInitials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function setActiveMemberCommunity(c) {
  try {
    localStorage.setItem(
      "glass_member_community",
      JSON.stringify({ id: c.id, slug: c.slug, name: c.name })
    );
  } catch {
    /* ignore */
  }
}

// Real in-app disclaimer instead of the bare OS window.confirm() this used
// to rely on -- explains what leaving actually costs (payment history
// visibility, needing a fresh invite) rather than a one-line browser popup
// that's easy to blow past without reading.
function LeaveConfirmModal({ community, onCancel, onConfirm, leaving }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgba(15,23,42,0.45)]"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[430px] bg-white rounded-t-[20px] pt-6 px-5 pb-7"
      >
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="bg-transparent border-none cursor-pointer p-1 text-[#9CA3AF]"
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col items-center text-center gap-2.5">
          <div className="w-[52px] h-[52px] rounded-full bg-[#FEF2F2] flex items-center justify-center mb-1">
            <AlertTriangle size={24} className="text-danger" />
          </div>
          <p className="text-[17px] font-bold text-[#111] m-0">
            Leave {community?.name}?
          </p>
          <p className="text-[13.5px] text-[#6B7280] m-0 leading-[1.55] max-w-[320px]">
            You'll lose access to this community's payment history and upcoming dues from your account, and you'll need a new invite to rejoin. This can't be undone from your side.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 mt-6">
          <button
            onClick={onConfirm}
            disabled={leaving}
            className={`w-full py-3.5 px-0 rounded-xl border-none bg-danger text-white text-[14.5px] font-semibold ${leaving ? "cursor-default opacity-70" : "cursor-pointer opacity-100"}`}
          >
            {leaving ? "Leaving…" : "Yes, leave community"}
          </button>
          <button
            onClick={onCancel}
            disabled={leaving}
            className="border border-surface-container-border w-full py-3.5 px-0 rounded-xl bg-white text-[#374151] text-[14.5px] font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyCommunities() {
  const navigate = useNavigate();
  const { data: raw = [], isLoading } = useMyCommunities();
  const communities = raw.map((c) => ({
    ...c,
    name: c.name ?? c.community?.name,
    slug: c.slug ?? c.community?.slug,
    logo: c.logo ?? c.community?.logo,
    id: c.id ?? c.community?.id,
  }));
  const leaveCommunity = useLeaveCommunity();
  const [navigatingId, setNavigatingId] = useState(null);
  const [leavingCommunity, setLeavingCommunity] = useState(null);

  async function handleSelect(c) {
    if (c.owned) {
      setNavigatingId(c.id);
      try {
        localStorage.setItem("glass_community", JSON.stringify(c));
        const isPaying = await resolveIsPayingAdmin(c.slug ?? c.id);
        const path = isPaying
          ? `/dashboard/admin/paying?community=${c.slug}`
          : `/dashboard/admin?community=${c.slug}`;
        navigate(path);
      } finally {
        setNavigatingId(null);
      }
    } else {
      setActiveMemberCommunity(c);
      navigate("/member/home");
    }
  }

  function handleLeave(e, c) {
    e.stopPropagation();
    setLeavingCommunity(c);
  }

  function confirmLeave() {
    if (!leavingCommunity) return;
    leaveCommunity.mutate(leavingCommunity.slug ?? leavingCommunity.id, {
      onSuccess: () => setLeavingCommunity(null),
    });
  }

  return (
    <div className="relative overflow-hidden pb-10 min-h-screen">
      <GlassLogoGlow />
      <div className="flex items-center gap-2.5 pt-5 px-4 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
        >
          <ChevronLeft size={18} strokeWidth={2} className="text-[#111]" />
        </button>
        <h1 className="text-lg font-semibold text-[#111] m-0">My Communities</h1>
      </div>

      <div className="pt-0 px-4 pb-4">
        <button
          onClick={() => navigate("/onboarding/choose-path")}
          className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-[#1C2B8A] text-white text-sm font-semibold border-none cursor-pointer"
        >
          <Plus size={16} />
          Create a Community
        </button>
      </div>

      <div className="px-4">
        {isLoading ? (
          <PageLoadingState size={56} padding="36px 24px" />
        ) : communities.length === 0 ? (
          <EmptyState icon={Users} title="You haven't joined any communities yet" className="py-6" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {communities.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                disabled={navigatingId === c.id}
                className={`flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-[0_1px_6px_rgba(0,0,0,0.05)] border-none text-left w-full ${navigatingId === c.id ? "cursor-default opacity-70" : "cursor-pointer opacity-100"}`}
              >
                <div
                  className={`w-11 h-11 rounded-xl text-white flex items-center justify-center font-bold text-[13px] flex-shrink-0 overflow-hidden ${c.logo?.url ? "bg-transparent" : "bg-[#1C2B8A]"}`}
                >
                  {c.logo?.url ? (
                    <img src={c.logo.url} alt="" decoding="async" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(c.name) || "?"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111] m-0">{c.name}</p>
                  <p className="text-xs text-[#999] mt-0.5 mx-0 mb-0">{c.owned ? "Admin" : "Member"}</p>
                </div>
                {!c.owned ? (
                  <button
                    onClick={(e) => handleLeave(e, c)}
                    disabled={leaveCommunity.isPending}
                    title="Leave community"
                    className="bg-transparent border-none cursor-pointer p-1.5 text-danger flex-shrink-0"
                  >
                    <LogOut size={16} />
                  </button>
                ) : navigatingId === c.id ? (
                  <div className="w-4 h-4 rounded-full border-2 border-surface-container-border [border-top-color:#002FA7] flex-shrink-0 animate-[spin_0.7s_linear_infinite]" />
                ) : (
                  <ChevronRight size={16} className="text-[#ccc] flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {leavingCommunity && (
        <LeaveConfirmModal
          community={leavingCommunity}
          leaving={leaveCommunity.isPending}
          onCancel={() => setLeavingCommunity(null)}
          onConfirm={confirmLeave}
        />
      )}
    </div>
  );
}
