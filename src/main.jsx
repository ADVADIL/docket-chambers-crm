import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Chambers App ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) registration.unregister();
        });
      }
      if ("caches" in window) {
        caches.keys().then((names) => {
          for (const name of names) caches.delete(name);
        });
      }
    } catch (e) {}
    window.location.href = window.location.origin + "?ts=" + Date.now();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px 30px", fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: 700, margin: "60px auto", background: "#FCFAF6", borderRadius: 10, border: "1px solid #E4DFD3", boxShadow: "0 15px 35px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 26 }}>⚖️</span>
            <h2 style={{ margin: 0, fontSize: 22, color: "#6B2737" }}>Docket Chambers CRM — System Notice</h2>
          </div>
          <p style={{ fontSize: 14, color: "#4A453C", lineHeight: 1.5 }}>
            A temporary client-side display error occurred. Resetting the local session will restore immediate access to your cases and dockets.
          </p>
          <div style={{ background: "#FFEBEE", border: "1px solid #FFCDD2", padding: "12px 14px", borderRadius: 6, margin: "16px 0", fontSize: 12.5, color: "#B71C1C", fontFamily: "monospace", overflowX: "auto" }}>
            <strong>{this.state.error?.toString()}</strong>
          </div>
          <button
            onClick={this.handleReset}
            style={{ padding: "10px 22px", background: "#6B2737", color: "#FFFFFF", border: "none", borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
          >
            Clear Local Cache & Restore CRM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
