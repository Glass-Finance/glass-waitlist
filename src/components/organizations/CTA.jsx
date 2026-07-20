import { useNavigate } from "react-router-dom";
import { goToApp } from "../../utils/deviceRedirect";
import CTASection from "../common/CTASection";

export default function CTA() {
  const navigate = useNavigate();

  return (
    <CTASection
      headline="Bring clarity to your community finances."
      subtext="Simplify payments. Eliminate follow-ups."
      buttonLabel="Create Your Community"
      buttonHoverVariant="magnetic"
      onButtonClick={() => goToApp("/sign-up", navigate)}
    />
  );
}
