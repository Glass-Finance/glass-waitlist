import GlassLogo from "../assets/Glass.png";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-[1.5px] border-[#1C2B8A]/10 border-t-[#1C2B8A] animate-spin" />
        <img src={GlassLogo} alt="Glass" className="w-7 h-7 object-contain" />
      </div>
    </div>
  );
}
