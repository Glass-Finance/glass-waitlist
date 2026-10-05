import PageLoadingState from "./common/PageLoadingState";

// Full-viewport loading overlay for route transitions and guard checks — the
// five route guards, the App-level Suspense boundary, SignIn's session
// bootstrap, and PaymentCallback's status poll.
//
// This used to render a bare BrandedSpinner with no label, then briefly
// delegated to PageLoadingState's spinner-plus-message treatment. The
// message is gone everywhere now: this overlay covers both sub-100ms
// route-guard checks — where any copy is pure flicker — and the App
// Suspense boundary, where a lazy chunk can take an unbounded amount of
// time to arrive and any claim about the wait would be a lie.
export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <PageLoadingState size={64} padding="0" />
    </div>
  );
}
