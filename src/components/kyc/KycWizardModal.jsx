import { useNavigate } from "react-router-dom";
import GlassModal from "../common/GlassModal";
import { useAuth } from "../../store/AuthContext";
import useKycFlow from "./useKycFlow";
import GlassPassRail from "./GlassPassRail";
import glassLogo from "../../assets/Glass.webp";

// The KYC wizard modal — primary verification surface. Replaces the old
// KycRequiredSheet interstitial: the gate opens this directly, so there's
// never a modal stacked on a modal.
//
// Layout: at sm+ it's two columns — the Glass Pass rail on the left, the
// wizard on the right. The rail is ambient context for the whole flow (who
// you are, what verification unlocks), which is why it replaced the old
// overview *step* rather than being one. Below sm the modal is a bottom
// sheet, so the rail collapses to a single compact card above the wizard.
//
// Still: fixed header (title + stepper over a translucent brand-tint glass
// band, with the Glass wordmark as a whisper-faint watermark), scrollable
// step body, fixed footer — the primary action can never scroll away.
// Unmounting this component resets the flow's local state, so a reopened
// wizard always starts from the server's current status.
export default function KycWizardModal({ open, onClose, historyPath, onComplete }) {
  if (!open) return null;
  return <WizardContent onClose={onClose} historyPath={historyPath} onComplete={onComplete} />;
}

function WizardContent({ onClose, historyPath, onComplete }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const flow = useKycFlow({
    onDismiss: onClose,
    onComplete,
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
      className="sm:max-w-[760px]"
    >
      {/* Rail first in the DOM so it reads before the wizard on phones. */}
      <GlassPassRail user={user} pass={flow.pass} variant="compact" />
      <div className="flex items-start gap-5">
        <GlassPassRail user={user} pass={flow.pass} />
        <div className="flex-1 min-w-0">{flow.body}</div>
      </div>
    </GlassModal>
  );
}
