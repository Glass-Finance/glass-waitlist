import { useNavigate } from "react-router-dom";
import GlassModal from "../common/GlassModal";
import useKycFlow from "./useKycFlow";
import glassLogo from "../../assets/Glass.webp";

// The KYC wizard modal — primary verification surface (brief: full modal
// stepper wizard). Replaces the old KycRequiredSheet interstitial: the gate
// opens this directly and the intro step carries the gate's reason, so
// there's never a modal stacked on a modal.
//
// Layout: fixed header (title + stepper over a translucent brand-tint glass
// band, with the Glass wordmark as a whisper-faint watermark), scrollable
// step body, fixed footer — the primary action can never scroll away.
// Unmounting this component resets the flow's local state, so a reopened
// wizard always starts from the server's current status.
export default function KycWizardModal({ open, onClose, reason, historyPath }) {
  if (!open) return null;
  return <WizardContent onClose={onClose} reason={reason} historyPath={historyPath} />;
}

function WizardContent({ onClose, reason, historyPath }) {
  const navigate = useNavigate();
  const flow = useKycFlow({
    reason,
    onDismiss: onClose,
    onHistory: historyPath
      ? () => {
          onClose();
          navigate(historyPath);
        }
      : undefined,
  });

  return (
    <GlassModal
      onClose={onClose}
      label="Identity verification"
      title="Identity verification"
      closeDisabled={flow.closeDisabled}
      headerClassName="bg-brand-tint/50 backdrop-blur-xl border-b border-brand/10"
      headerExtra={
        <div className="relative overflow-hidden px-5 sm:px-6 pb-3.5 pt-1">
          <img
            src={glassLogo}
            alt=""
            aria-hidden="true"
            className="absolute -right-3 -bottom-4 w-24 opacity-[0.07] pointer-events-none select-none"
          />
          <div className="relative">{flow.stepper}</div>
        </div>
      }
      bodyClassName="pt-4"
      footer={flow.footer}
      className="sm:max-w-[480px]"
    >
      {flow.body}
    </GlassModal>
  );
}
