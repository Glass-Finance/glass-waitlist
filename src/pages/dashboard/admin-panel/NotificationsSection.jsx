import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Bell } from "lucide-react";
import ModalShell from "../../../components/dashboard/ModalShell";
import { createAdminNotification, getAdminNotificationJobs } from "../../../api/admin";
import { fmtDate, unwrap, pageParams } from "./shared";
import { SectionHeader, TableShell, TableFooter } from "./SharedUI";

const NOTIF_TYPES = [
  "ACCOUNT_VERIFICATION",
  "PAYMENT_DUE",
  "PAYMENT_RECEIVED",
  "PAYMENT_FAILED",
  "INVITE_SENT",
  "INVITE_ACCEPTED",
  "GENERAL_ANNOUNCEMENT",
];
const NOTIF_CHANNELS = ["IN_APP", "EMAIL", "SMS", "PUSH"];

function SendNotificationModal({ onClose }) {
  const queryClient = useQueryClient();
  const [targetMode, setTargetMode] = useState("emails");
  const [targets, setTargets] = useState("");
  const [notificationType, setNotificationType] = useState(
    "GENERAL_ANNOUNCEMENT",
  );
  const [channels, setChannels] = useState(["IN_APP"]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: (payload) => createAdminNotification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notification-jobs"] });
      onClose();
    },
    meta: { successMessage: "Notification queued" },
  });

  function toggleChannel(ch) {
    setChannels((cs) =>
      cs.includes(ch) ? cs.filter((c) => c !== ch) : [...cs, ch],
    );
  }

  function submit(e) {
    e.preventDefault();
    const list = targets
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    mutation.mutate({
      notificationType,
      channels,
      title,
      message,
      ...(targetMode === "emails" ? { emails: list } : { userIds: list }),
    });
  }

  const f = { border: "1px solid #D0D0D0" };
  const ff = { borderColor: "var(--color-brand)" };

  return (
    <ModalShell title="Send Notification" onClose={onClose}>
      <form
        onSubmit={submit}
        className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto"
      >
        {/* Target mode */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Recipients
          </label>
          <div className="flex gap-2 mb-2">
            {[
              { val: "emails", label: "By Email" },
              { val: "userIds", label: "By User ID" },
            ].map(({ val, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => setTargetMode(val)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  targetMode === val
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <textarea
            value={targets}
            onChange={(e) => setTargets(e.target.value)}
            rows={3}
            required
            className="w-full px-3 py-2.5 rounded-lg text-xs text-gray-800 outline-none resize-none font-mono transition-colors"
            style={f}
            onFocus={(e) => Object.assign(e.target.style, ff)}
            onBlur={(e) => Object.assign(e.target.style, f)}
            placeholder={
              targetMode === "emails"
                ? "user@example.com, another@example.com"
                : "uuid1, uuid2"
            }
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Type
          </label>
          <select
            value={notificationType}
            onChange={(e) => setNotificationType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-xs text-gray-700 outline-none"
            style={f}
          >
            {NOTIF_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Channels */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Channels
          </label>
          <div className="flex gap-2 flex-wrap">
            {NOTIF_CHANNELS.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => toggleChannel(ch)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  channels.includes(ch)
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-lg text-xs text-gray-800 outline-none transition-colors"
            style={f}
            onFocus={(e) => Object.assign(e.target.style, ff)}
            onBlur={(e) => Object.assign(e.target.style, f)}
            placeholder="Notification title"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
            className="w-full px-3 py-2.5 rounded-lg text-xs text-gray-800 outline-none resize-none transition-colors"
            style={f}
            onFocus={(e) => Object.assign(e.target.style, ff)}
            onBlur={(e) => Object.assign(e.target.style, f)}
            placeholder="Notification body…"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer border-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || channels.length === 0}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer border-none bg-brand"
          >
            {mutation.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Bell size={12} />
            )}
            {mutation.isPending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

const JOB_COLORS = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-700" },
  COMPLETED: { bg: "bg-green-50", text: "text-green-700" },
  FAILED: { bg: "bg-red-50", text: "text-red-700" },
  PARTIAL: { bg: "bg-orange-50", text: "text-orange-700" },
};

export default function NotificationsSection() {
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const params = pageParams(page);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-notification-jobs", params],
    queryFn: () => getAdminNotificationJobs(params).then(unwrap),
    staleTime: 30_000,
    placeholderData: (p) => p,
  });

  const items = data?.content ?? [];

  return (
    <div>
      <SectionHeader
        title="Notifications"
        desc="Platform-sent notification jobs and delivery status."
        count={data?.totalElements ?? 0}
        isFetching={isFetching && !isLoading}
        right={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer border-none bg-brand"
          >
            <Bell size={12} /> Send Notification
          </button>
        }
      />

      <TableShell
        isLoading={isLoading}
        isEmpty={items.length === 0}
        error={error}
        emptyIcon={Bell}
        emptyLabel="No notifications found"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-stacked-container">
              {[
                "Type",
                "Channels",
                "Recipients",
                "Delivered",
                "Failed",
                "Status",
                "Created",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((j, i) => {
              const sc = JOB_COLORS[j.status] ?? {
                bg: "bg-gray-100",
                text: "text-gray-500",
              };
              return (
                <tr
                  key={j.jobId}
                  className={`hover:bg-gray-50 transition-colors ${i < items.length - 1 ? "border-b border-[#F9FAFB]" : "border-b-0"}`}
                >
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-gray-700 font-medium">
                      {(j.notificationType ?? "—").replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-gray-500">
                      {(j.channels ?? []).join(", ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] text-gray-700">
                      {j.recipientCount ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-medium text-green-600">
                      {j.deliveredCount ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[12px] font-medium ${(j.failedCount ?? 0) > 0 ? "text-red-500" : "text-gray-400"}`}
                    >
                      {j.failedCount ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-[11px] text-gray-500">
                      {fmtDate(j.createdAt)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableShell>

      <TableFooter
        totalElements={data?.totalElements ?? 0}
        noun="job"
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPage={setPage}
      />
      {showCreate && (
        <SendNotificationModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
