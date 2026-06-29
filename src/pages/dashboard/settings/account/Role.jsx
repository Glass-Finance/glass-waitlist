import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveCommunityId } from "../../../../hooks/useActiveCommunityId";
import { useMyMemberRecord } from "../../../../hooks/useMyAccount";
import { updateCommunityMember } from "../../../../api/communities";

const OPTIONS = [
  {
    id: "pays",
    title: "I Pay Dues",
    description: "You are a paying member. Payment reminders, due dates, and Auto-Pay apply to you like every other member.",
  },
  {
    id: "exempt",
    title: "I am exempt from payments",
    description: "You manage this community but do not contribute financially. No reminders will be sent to you and you will not appear in the unpaid members count.",
  },
];

export default function Role() {
  const communityId = useActiveCommunityId();
  const { data: memberRecord, isLoading } = useMyMemberRecord(communityId);
  const queryClient = useQueryClient();

  const [role, setRole] = useState("pays");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (memberRecord) setRole(memberRecord.billingExempt ? "exempt" : "pays");
  }, [memberRecord]);

  const updateExemption = useMutation({
    mutationFn: (billingExempt) =>
      updateCommunityMember(communityId, memberRecord.id, { billingExempt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-record", communityId] });
    },
  });

  async function handleSelect(id) {
    setRole(id);
    setSaving(true);
    try {
      await updateExemption.mutateAsync(id === "exempt");
      if (typeof pendo !== "undefined") {
        pendo.track("billing_exemption_changed", {
          community_id: communityId,
          new_status: id,
        });
      }
    } catch {
      setRole(memberRecord?.billingExempt ? "exempt" : "pays"); // revert on failure
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl flex flex-col gap-5 w-full">
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">My role</p>
        <p className="text-xs text-gray-500">Define Your Membership and Payment participation</p>
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
                disabled={isLoading || saving}
                className={`flex items-start gap-3 px-4 py-4 rounded-xl text-left transition-all
                  ${isSelected ? "bg-blue-50" : "bg-gray-50 hover:bg-gray-100"}`}
                style={{ border: isSelected ? "1.5px solid #002FA7" : "1.5px solid #E5E7EB" }}
              >
                <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center
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

      {/* Info banner */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-blue-50" style={{ border: "1px solid #002FA7" }}>
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
