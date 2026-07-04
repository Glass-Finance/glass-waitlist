import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useActiveCommunityId } from "../../../../hooks/useActiveCommunityId";
import { useMyMemberRecord } from "../../../../hooks/useMyAccount";
import { updateCommunityMember } from "../../../../api/communities";
import { getErrorMessage } from "../../../../utils/errorHandler";

const OPTIONS = [
  {
    id: "pays",
    title: "I Pay Dues",
    description:
      "You are a paying member. Payment reminders, due dates, and Auto-Pay apply to you like every other member.",
  },
  {
    id: "exempt",
    title: "I am exempt from payments",
    description:
      "You manage this community but do not contribute financially. No reminders will be sent to you and you will not appear in the unpaid members count.",
  },
];

export default function Role() {
  const communityId = useActiveCommunityId();
  const { data: memberRecord, isLoading, error: fetchError } = useMyMemberRecord(communityId);
  const queryClient = useQueryClient();

  const [role, setRole] = useState(null); // null until memberRecord loads
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (memberRecord) setRole(memberRecord.billingExempt ? "exempt" : "pays");
  }, [memberRecord]);

  const updateExemption = useMutation({
    mutationFn: (billingExempt) => {
      const memberId = memberRecord?.id ?? memberRecord?.memberId;
      if (!memberId) throw new Error("Member record not found.");
      return updateCommunityMember(communityId, memberId, { billingExempt });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-record", communityId] });
    },
  });

  async function handleSelect(id) {
    if (id === role || saving) return;
    setRole(id);
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      await updateExemption.mutateAsync(id === "exempt");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(getErrorMessage(err, "Couldn't save your role. Please try again."));
      setRole(memberRecord?.billingExempt ? "exempt" : "pays");
    } finally {
      setSaving(false);
    }
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-2xl flex flex-col gap-5 w-full">
        <div>
          <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
          <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="bg-[#EFEFF1] rounded-2xl p-6" style={{ border: "1px solid #E5E7EB" }}>
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-4 rounded-xl bg-gray-100 animate-pulse" style={{ border: "1.5px solid #E5E7EB" }}>
                <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="h-3.5 w-32 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-full bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── No member record (admin owner with no member entry) ────────────────────
  if (fetchError || !memberRecord) {
    return (
      <div className="max-w-2xl flex flex-col gap-5 w-full">
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-0.5">My role</p>
          <p className="text-xs text-gray-500">Define Your Membership and Payment participation</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-amber-800 mb-1">No member record found</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Your account doesn't have a member record in this community yet. This usually means
            you haven't been added as a paying member. Ask another admin to add you, or switch to
            a community where you have a member record.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl flex flex-col gap-5 w-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-0.5">My role</p>
          <p className="text-xs text-gray-500">Define Your Membership and Payment participation</p>
        </div>
        {saving && (
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <Loader2 size={13} className="animate-spin" /> Saving…
          </span>
        )}
        {saved && !saving && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600">
            <Check size={13} /> Saved
          </span>
        )}
      </div>

      {/* Role card */}
      <div className="bg-[#EFEFF1] rounded-2xl p-6" style={{ border: "1px solid #E5E7EB" }}>
        <div className="flex flex-col gap-3">
          {OPTIONS.map((opt) => {
            const isSelected = role === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={saving}
                className={`flex items-start gap-3 px-4 py-4 rounded-xl text-left transition-all
                  ${isSelected ? "bg-blue-50" : "bg-gray-50 hover:bg-gray-100"}
                  ${saving ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                style={{ border: isSelected ? "1.5px solid #002FA7" : "1.5px solid #E5E7EB" }}
              >
                <div
                  className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center
                    ${isSelected ? "bg-[#002FA7]" : "bg-white"}`}
                  style={{ border: isSelected ? "none" : "1px solid #D1D5DB" }}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-sm text-gray-900 mb-0.5">{opt.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save error */}
      {saveError && (
        <p className="text-xs text-red-500">{saveError}</p>
      )}

      {/* Info banner */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-blue-50"
        style={{ border: "1px solid #002FA7" }}
      >
        <div className="w-4 h-4 rounded-full border border-[#002FA7] flex items-center justify-center flex-shrink-0">
          <span className="text-[#002FA7] text-[9px] font-bold">i</span>
        </div>
        <p className="text-xs text-gray-700">
          Changes take effect from the next billing cycle. Past payment records are not affected.
        </p>
      </div>
    </div>
  );
}
