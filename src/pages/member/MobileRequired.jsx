import { useSearchParams } from "react-router-dom";
import QRScanScreen from "../../components/auth/QRScanScreen";
import { buildMobileUrl } from "../../utils/deviceRedirect";

export default function MobileRequired() {
  const [searchParams] = useSearchParams();
  const target = searchParams.get("to") || "/member/sign-in";
  const url = buildMobileUrl(target);

  return (
    <QRScanScreen
      heading="Scan To Continue On Your Phone"
      subheading="Glass for members is best experienced on mobile!"
      url={url}
    >
      <p className="text-xs text-gray-400 break-all max-w-sm text-center mt-2">{url}</p>
    </QRScanScreen>
  );
}
