import { useNavigate } from "react-router-dom";
import CloudImage from "../components/common/CloudImage";
import { Button } from "../components/ui/Button";
import { usePageTitle } from "../hooks/usePageTitle";

export default function NotFound() {
  usePageTitle("Page not found");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-cover bg-center bg-page-default">
      {/* Logo — no container */}
      <CloudImage
        publicId="glass/Glass"
        alt="Glass"
        width={80}
        objectFit="contain"
        className="w-10 h-10 mb-10"
      />

      {/* 404 */}
      <p className="font-black leading-none tracking-tighter mb-5 select-none text-[clamp(96px,20vw,160px)] text-brand opacity-[0.12]">
        404
      </p>

      {/* Text sits over the large faded 404 */}
      <div className="-mt-10">
        <h1 className="text-[22px] font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-[14px] text-gray-500 max-w-[300px] leading-relaxed mb-8 mx-auto">
          This page doesn't exist or may have been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <Button variant="outline-neutral" onClick={() => navigate(-1)} fullWidth={false}>
            Go back
          </Button>
          <Button onClick={() => navigate("/")} fullWidth={false}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
