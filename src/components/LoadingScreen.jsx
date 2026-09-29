import PageLoadingState from "./common/PageLoadingState";

// Full-viewport loading overlay for route transitions and guard checks — the
// five route guards, the App-level Suspense boundary, SignIn's session
// bootstrap, and PaymentCallback's status poll.
//
// This used to render a bare BrandedSpinner with no label, which meant the
// app had two different full-screen loading treatments: this one (silent) and
// PageLoadingState (spinner + message). It now delegates to the same component
// so the visual is identical, and only the positioning stays different — a
// fixed overlay rather than a flex-1 block, because a guard has no page
// layout to fill.
//
// subtitle defaults to null, not PageLoadingState's "This won't take long.".
// This overlay covers both sub-100ms route-guard checks — where a second line
// of copy is pure flicker — and the App Suspense boundary, where a lazy chunk
// can take an unbounded amount of time to arrive and that claim would be a
// lie. One line is the correct default; callers that genuinely want to explain
// the wait can pass a subtitle explicitly.
export default function LoadingScreen({ label = "Loading…", subtitle = null }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <PageLoadingState label={label} subtitle={subtitle} size={64} padding="0" />
    </div>
  );
}
