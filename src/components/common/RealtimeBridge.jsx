import useRealtimeStream from "../../hooks/useRealtimeStream";

// Renders nothing — exists so the realtime SSE connection lives at the app
// root (inside AuthProvider + QueryClientProvider) rather than being tied
// to any one layout, and survives route changes between the admin
// dashboard and the member app.
export default function RealtimeBridge() {
  useRealtimeStream();
  return null;
}
