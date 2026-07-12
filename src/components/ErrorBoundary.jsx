import { Component } from "react";
import { captureRenderError } from "../utils/monitoring";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    captureRenderError(error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", height: "100vh", gap: 16,
          fontFamily: "Inter, sans-serif", padding: 24,
        }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
            Something went wrong
          </p>
          <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center", maxWidth: 320, margin: 0 }}>
            An unexpected error occurred. Try refreshing the page — if it keeps happening, contact support.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 20px", borderRadius: 8, background: "#002FA7",
              color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Refresh page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
