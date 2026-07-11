import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getExportJob } from "../api/exports";
import { getErrorMessage, notifyError } from "../utils/errorHandler";
import { toastSuccess, toastProgress } from "../utils/toast";

const POLL_INTERVAL_MS = 1500;
const MAX_POLLS = 30; // ~45s — generous for a CSV export job

const TERMINAL = new Set(["COMPLETED", "FAILED"]);

// Wraps the async export-job flow documented by GET/POST /exports*:
// trigger a job (one of the exportCommunity* functions in api/exports.js),
// poll GET /exports/{id} until it reaches a terminal status, then open the
// resulting file's download URL. Every payment-plans/transactions/
// obligations export in the app should go through this one hook rather
// than hand-rolling CSV client-side, which silently caps at whatever's
// already loaded on the page and has no escaping for commas in names.
export function useExportJob() {
  const [isExporting, setIsExporting] = useState(false);
  const cancelledRef = useRef(false);

  // Stop polling if the component unmounts mid-export (e.g. the admin
  // navigates away) rather than continuing to hit the API in the background.
  useEffect(() => () => { cancelledRef.current = true; }, []);

  const run = useCallback(async (trigger) => {
    setIsExporting(true);
    cancelledRef.current = false;
    const toastId = toastProgress("Preparing export…", "Usually takes a few seconds");
    try {
      const res = await trigger();
      let job = res.data?.data;
      if (!job?.id) throw new Error("Export didn't start — please try again.");

      let attempts = 0;
      while (!TERMINAL.has(job.status) && attempts < MAX_POLLS) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        if (cancelledRef.current) {
          toast.dismiss(toastId);
          return;
        }
        const pollRes = await getExportJob(job.id);
        job = pollRes.data?.data ?? job;
        attempts += 1;
      }

      if (job.status !== "COMPLETED" || !job.fileData?.url) {
        throw new Error(
          job.failureReason ||
            (job.status === "FAILED"
              ? "Export failed — please try again."
              : "Export is taking longer than expected — check back in a moment."),
        );
      }

      toastSuccess(
        job.truncated
          ? `Export ready (first ${job.rowCount ?? "many"} rows — file was truncated)`
          : "Export ready",
        { id: toastId },
      );
      window.open(job.fileData.url, "_blank", "noopener");
    } catch (err) {
      // Morph the loading toast into an error rather than leaving it stuck
      // (it has duration: Infinity) — notifyError still logs in dev, but
      // its own toast is suppressed since this one already covers it.
      toast.error(getErrorMessage(err, "Export failed"), { id: toastId });
      notifyError(err, { context: "Export", silent: true });
    } finally {
      if (!cancelledRef.current) setIsExporting(false);
    }
  }, []);

  return { run, isExporting };
}
