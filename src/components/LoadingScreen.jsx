import BrandedSpinner from "./common/BrandedSpinner";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <BrandedSpinner size={64} />
    </div>
  );
}
