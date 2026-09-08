import { useNavigate } from "react-router-dom";
import { Bell, Mail, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import PageLoadingState from "../../components/memberApp/PageLoadingState";
import GlassLogoGlow from "../../components/memberApp/GlassLogoGlow";
import AutoPayPrompt from "../../components/common/AutoPayPrompt";
import {
  usePayments,
  usePendingPaymentVerification,
} from "../../hooks/usePayments";
import { useMyCommunities } from "../../hooks/useMyAccount";
import { useNotifications } from "../../hooks/useNotifications";
import { useInvites, useMyJoinRequests } from "../../hooks/useInvites";
import { useJoinApprovalWatcher } from "../../hooks/useJoinApproval";
import JoinApprovedModal from "../../components/memberApp/JoinApprovedModal";
import SideDrawer from "../../components/memberApp/SideDrawer";
import {
  CommunitySwitcher,
  HeroCard,
  UpcomingRow,
  HistoryRow,
  NoCommunityState,
  NothingHappeningState,
  PendingApprovalState,
  EmptyUpcomingState,
  EmptyHistoryState,
  ProfileNudge,
} from "./HomeSections";
import { toTitleCase } from "../../utils/format";

function firstName(user) {
  try {
    const userData =
      typeof user?.userData === "string"
        ? JSON.parse(user.userData)
        : user?.userData;
    if (userData?.firstName) return toTitleCase(userData.firstName);
  } catch {
    // ignore
  }
  return toTitleCase(user?.firstName ?? user?.email?.split("@")[0] ?? "there");
}

export default function Home() {
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    error,
    refresh,
    hasNoCommunity,
    hasPendingCommunity,
    pendingCommunity,
    communityCount,
  } = usePayments();

  usePendingPaymentVerification();
  const { unreadCount } = useNotifications();
  const { invites } = useInvites();
  const { joinRequests } = useMyJoinRequests();
  const pendingInviteCount =
    invites.filter((i) => (i.status ?? "").toUpperCase() === "PENDING").length +
    joinRequests.length;

  const { approved: approvedJoins, dismiss: dismissJoin } =
    useJoinApprovalWatcher();
  const activeApproval = approvedJoins[0] ?? null;

  function openApprovedCommunity(entry) {
    try {
      localStorage.setItem(
        "glass_member_community",
        JSON.stringify({
          id: entry.communityId,
          slug: entry.communitySlug,
          name: entry.name,
        }),
      );
    } catch {
      // ignore
    }
    dismissJoin(entry);
  }

  const [autoPayPrompt, setAutoPayPrompt] = useState(() => {
    try {
      const raw = sessionStorage.getItem("glass_autopay_prompt");
      if (!raw) return null;
      sessionStorage.removeItem("glass_autopay_prompt");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  function dismissAutoPayPrompt() {
    if (autoPayPrompt?.paymentLinkId) {
      try {
        localStorage.setItem(
          `glass_autopay_asked_${autoPayPrompt.paymentLinkId}`,
          "1",
        );
      } catch {
        // ignore
      }
    }
    setAutoPayPrompt(null);
  }

  function enableAutoPay() {
    dismissAutoPayPrompt();
    navigate("/member/auto-pay");
  }

  const nextDue = data?.nextDue ?? null;
  const upcoming = (data?.upcoming ?? []).slice(0, 3);
  const totalUpcomingCount = (data?.upcoming ?? []).length;
  const history = (data?.history ?? []).slice(0, 3);
  const communityName = data?.community?.name ?? "Your Community";
  const communityInitial = communityName.charAt(0).toUpperCase();
  const communityLogo = data?.community?.logo;
  const activeCommunityIdentifier =
    data?.community?.slug ?? data?.community?.id ?? null;
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: rawMyCommunities = [] } = useMyCommunities();
  const myCommunities = rawMyCommunities
    .filter((c) => (c.memberStatus ?? "ACTIVE").toUpperCase() === "ACTIVE")
    .map((c) => ({
      ...c,
      name: c.name ?? c.community?.name,
      slug: c.slug ?? c.community?.slug,
      logo: c.logo ?? c.community?.logo,
      id: c.id ?? c.community?.id,
    }));

  const [, forceRerender] = useState(0);
  function handleSwitchCommunity(c) {
    try {
      localStorage.setItem(
        "glass_member_community",
        JSON.stringify({ id: c.id, slug: c.slug, name: c.name }),
      );
    } catch {
      // ignore
    }
    forceRerender((n) => n + 1);
  }

  const showNothingHappening =
    !hasNoCommunity &&
    !hasPendingCommunity &&
    communityCount >= 2 &&
    !nextDue &&
    totalUpcomingCount === 0 &&
    history.length === 0;

  useEffect(() => {
    if (!data?.community) return;
    try {
      if (!localStorage.getItem("glass_member_community")) {
        const { name, slug, id } = data.community;
        localStorage.setItem(
          "glass_member_community",
          JSON.stringify({ name, slug, id }),
        );
      }
    } catch {
      // ignore
    }
  }, [data?.community]);

  function handlePay(payment) {
    const suffix = payment._isLink ? "?via=link" : "";
    navigate(`/member/pay/${payment.id}${suffix}`, {
      state: {
        communityName: payment.communityName,
        communityLogo: payment.logo,
      },
    });
  }

  return (
    <>
      <div className="relative overflow-hidden min-h-screen pb-10">
        <GlassLogoGlow />
        <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

        <div className="flex items-center justify-between pt-[25px] px-5 pb-5">
          <div className="flex items-center gap-[15px] min-w-0">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex items-center justify-center border-none cursor-pointer bg-transparent p-0 flex-shrink-0"
            >
              <Menu size={28} strokeWidth={2} className="text-[#222]" />
            </button>

            {!hasNoCommunity && (
              <CommunitySwitcher
                communities={myCommunities}
                activeIdentifier={activeCommunityIdentifier}
                communityName={communityName}
                communityInitial={communityInitial}
                communityLogo={communityLogo}
                onSelect={handleSwitchCommunity}
                navigate={navigate}
              />
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {!hasNoCommunity && !showNothingHappening && (
              <button
                aria-label="Invitations"
                onClick={() => navigate("/member/invites")}
                className="relative w-[38px] h-[38px] rounded-full bg-white border border-surface-container-border cursor-pointer flex items-center justify-center flex-shrink-0"
              >
                <Mail size={17} strokeWidth={1.8} className="text-[#333]" />
                {pendingInviteCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[15px] h-[15px] py-0 px-[3px] rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center border-[1.5px] border-white">
                    {pendingInviteCount > 9 ? "9+" : pendingInviteCount}
                  </span>
                )}
              </button>
            )}

            <button
              aria-label="Notifications"
              onClick={() => navigate("/member/notifications")}
              className="relative w-[38px] h-[38px] rounded-full bg-white border border-surface-container-border cursor-pointer flex items-center justify-center flex-shrink-0"
            >
              <Bell size={17} strokeWidth={1.8} className="text-[#333]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[15px] h-[15px] py-0 px-[3px] rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center border-[1.5px] border-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {!hasNoCommunity && !showNothingHappening && (
          <div className="pt-1 px-5 pb-5">
            <h1 className="text-2xl font-medium text-[#111] m-0">
              Hi {firstName(data?.user)},
            </h1>
            <p className="text-[13px] text-[#888] mt-[3px] font-normal">
              Here's Your Community At A Glance
            </p>
          </div>
        )}

        {!hasNoCommunity &&
          !showNothingHappening &&
          data?.user &&
          !data.user.phoneVerified && (
            <ProfileNudge navigate={navigate} user={data.user} />
          )}

        {isLoading ? (
          <PageLoadingState label="Loading your community…" />
        ) : hasPendingCommunity ? (
          <PendingApprovalState
            navigate={navigate}
            community={pendingCommunity}
          />
        ) : hasNoCommunity ? (
          <NoCommunityState navigate={navigate} />
        ) : showNothingHappening ? (
          <NothingHappeningState navigate={navigate} />
        ) : (
          <>
            <HeroCard
              nextDue={nextDue}
              onPay={handlePay}
              error={error}
              onRefresh={refresh}
            />

            <div className="mx-4 mt-4 bg-surface-container rounded-lg px-4 pt-4 pb-1 border border-surface-container-border">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-normal text-[#111]">
                    Upcoming Payments
                  </span>
                  {totalUpcomingCount > 0 && (
                    <span className="text-[11px] font-bold text-[#1C2B8A] bg-[#E4E7F9] rounded-full py-px px-[7px] leading-normal">
                      {totalUpcomingCount}
                    </span>
                  )}
                </div>
                {totalUpcomingCount > 0 && (
                  <button
                    onClick={() => navigate("/member/upcoming")}
                    className="bg-transparent border-none cursor-pointer text-[13px] font-semibold text-[#9CA3AF] p-0"
                  >
                    See All
                  </button>
                )}
              </div>

              {upcoming.length === 0 && totalUpcomingCount === 0 ? (
                <EmptyUpcomingState />
              ) : (
                upcoming.map((p) => (
                  <UpcomingRow key={p.id} payment={p} onPay={handlePay} />
                ))
              )}
            </div>

            <div className="mx-4 mt-4 bg-surface-container rounded-lg px-4 pt-4 pb-1 border border-surface-container-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-normal text-[#111]">
                  Payment History
                </span>
                {history.length > 0 && (
                  <button
                    onClick={() => navigate("/member/transactions")}
                    className="bg-transparent border-none cursor-pointer text-[13px] font-semibold text-[#9CA3AF] p-0"
                  >
                    See All
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <EmptyHistoryState />
              ) : (
                history.map((item) => (
                  <HistoryRow
                    key={item.id}
                    item={item}
                    onOpen={(t) => navigate(`/member/transactions/${t.id}`)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>

      {autoPayPrompt && (
        <AutoPayPrompt
          prompt={autoPayPrompt}
          onDismiss={dismissAutoPayPrompt}
          onEnable={enableAutoPay}
        />
      )}

      <JoinApprovedModal
        entry={activeApproval}
        onOpen={openApprovedCommunity}
        onDismiss={dismissJoin}
      />
    </>
  );
}
