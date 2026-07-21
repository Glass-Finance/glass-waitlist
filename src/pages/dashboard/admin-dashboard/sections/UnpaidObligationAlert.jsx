import { X } from "lucide-react";
import { toTitleCase, formatDate } from "../../../../utils/format";
import WarnSignIcon from "../../../../assets/dashboard/warn-sign.webp";
import { formatNaira } from "../helpers";

export default function UnpaidObligationAlert({
  myUpcoming,
  onPayNow,
  onDismiss,
  hasActiveAutoPay,
}) {
  const dueList = myUpcoming.filter(
    (o) => (o.status ?? "").toUpperCase() !== "PAID",
  );
  const due = dueList[0];
  if (!due) return null;
  const othersDue = dueList.length - 1;
  const daysLeft = due.dueDate
    ? Math.ceil((new Date(due.dueDate) - new Date()) / 86400000)
    : null;

  return (
    <div className="flex items-start justify-between px-4 py-4 rounded-md mb-5 bg-[#D7E2FF] border border-blue-100">
      <div className="flex items-start gap-6">
        <img
          src={WarnSignIcon}
          alt=""
          className="w-[26px] h-[26px] object-contain flex-shrink-0 mt-1.5"
        />
        <div>
          <p className="text-[13px] font-medium text-gray-800">
            Your {toTitleCase(due.name)} payment
            {daysLeft != null
              ? ` is due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
              : " is due soon"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatNaira(due.amount)}
            {due.dueDate ? ` due ${formatDate(due.dueDate)}` : ""}
            {due.type === "recurring" && (
              <>
                {" · "}
                <span className="text-brand font-medium">
                  Auto-Pay is {hasActiveAutoPay(due) ? "on" : "off"}
                </span>
              </>
            )}
          </p>
          {othersDue > 0 && (
            <p className="text-xs text-brand font-medium mt-1">
              + {othersDue} other payment{othersDue === 1 ? "" : "s"} due
              — see Your Payments below.
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        <button
          onClick={() => onPayNow(due)}
          className="px-4 py-2 rounded-sm text-xs font-semibold text-brand border cursor-pointer"
        >
          Pay Now
        </button>
        <button
          onClick={onDismiss}
          className="text-brand bg-transparent border-none cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
