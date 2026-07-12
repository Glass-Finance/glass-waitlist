import { Component } from "react";
import { captureRenderError } from "../utils/monitoring";
import GlassLogo from "../assets/Glass.webp";
import Background from "../assets/background.webp";

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
        <div
          className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
          style={{
            backgroundImage: `url(${Background})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <img src={GlassLogo} alt="Glass" className="w-10 h-10 object-contain mb-8" />

          <h1 className="text-[22px] font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-500 max-w-[320px] leading-relaxed mb-8">
            An unexpected error occurred. Try refreshing the page — if it keeps happening,
            contact support.
          </p>

          <div className="flex gap-3">
            <a
              href="/"
              className="px-5 py-2.5 rounded-full text-[13px] font-medium text-gray-700 no-underline cursor-pointer transition-colors"
              style={{ background: "#FFFFFF99", border: "1px solid #E5E7EB", backdropFilter: "blur(4px)" }}
            >
              Go home
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-full text-[13px] font-semibold text-white cursor-pointer border-none transition-opacity hover:opacity-90"
              style={{ background: "#002FA7" }}
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
