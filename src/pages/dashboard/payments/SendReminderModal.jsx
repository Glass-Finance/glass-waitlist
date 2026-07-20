import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toTitleCase } from "../../../utils/format";
import { inputCls, REMINDER_FREQUENCIES, REMINDER_CHANNELS } from "./constants";

// ── Send reminder modal ───────────────────────────────────────────────────────
// Only reachable action for triggering payment reminders — there's no
// "auto-scheduled" reminder configured at plan creation; admins choose
// frequency + channels here and send on demand.
export default function SendReminderModal({ plan, onClose, onSend, sending }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  const [frequency, setFrequency] = useState("EVERY_3_DAYS");
  const [channels, setChannels] = useState(new Set(["IN_APP"]));

  function toggleChannel(value) {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  const canSend = channels.size > 0;

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-6 bg-[rgba(15,29,110,0.2)] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-surface-container-border">
        <div className="flex items-start justify-between px-6 pt-5">
          <div>
            <h2 className="text-base font-semibold text-black">Send Reminder</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {toTitleCase(plan?.name)} — sent to members who haven't paid yet.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent border-solid"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Repeat this reminder
            </label>
            <select
              className={inputCls}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              {REMINDER_FREQUENCIES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Send via
            </label>
            <div className="flex flex-col gap-2">
              {REMINDER_CHANNELS.map((c) => (
                <label key={c.value} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.has(c.value)}
                    onChange={() => toggleChannel(c.value)}
                    className="w-3.5 h-3.5 accent-brand cursor-pointer"
                  />
                  {c.label}
                </label>
              ))}
            </div>
            {!canSend && (
              <p className="text-[11px] text-red-500 mt-1.5">
                Choose at least one channel.
              </p>
            )}
          </div>

          <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-gray-500">
            Sends immediately, then repeats on this schedule until the member pays or the plan closes.
          </div>
        </div>

        <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSend({
                reminderFrequency: frequency,
                reminderChannels: [...channels],
              })
            }
            disabled={!canSend || sending}
            className="px-6 py-2 rounded text-xs font-normal text-white bg-brand hover:opacity-90 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending…" : "Send Reminder"}
          </button>
        </div>
      </div>
    </div>
  );
}
