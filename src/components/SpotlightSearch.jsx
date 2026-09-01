import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Briefcase, Users, Gavel, Receipt, 
  ArrowRight, X, Clock, Calendar, Shield, Hash
} from "lucide-react";
import { fmtDate, fmtCurrency } from "../utils";

export default function SpotlightSearch({
  isOpen,
  onClose,
  matters = [],
  clients = [],
  hearings = [],
  billing = [],
  onSelectResult
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Filtered results across all 4 collections
  const matchedMatters = q ? matters.filter((m) => 
    (m.title && m.title.toLowerCase().includes(q)) ||
    (m.caseNumber && m.caseNumber.toLowerCase().includes(q)) ||
    (m.court && m.court.toLowerCase().includes(q)) ||
    (m.practiceArea && m.practiceArea.toLowerCase().includes(q))
  ).slice(0, 5) : [];

  const matchedClients = q ? clients.filter((c) => 
    (c.name && c.name.toLowerCase().includes(q)) ||
    (c.company && c.company.toLowerCase().includes(q)) ||
    (c.email && c.email.toLowerCase().includes(q)) ||
    (c.phone && c.phone.toLowerCase().includes(q))
  ).slice(0, 5) : [];

  const matchedHearings = q ? hearings.filter((h) => 
    (h.court && h.court.toLowerCase().includes(q)) ||
    (h.notes && h.notes.toLowerCase().includes(q)) ||
    (h.outcome && h.outcome.toLowerCase().includes(q)) ||
    (h.date && h.date.includes(q))
  ).slice(0, 5) : [];

  const matchedBilling = q ? billing.filter((b) => 
    (b.description && b.description.toLowerCase().includes(q)) ||
    (b.status && b.status.toLowerCase().includes(q)) ||
    (b.amount && String(b.amount).includes(q))
  ).slice(0, 5) : [];

  const totalResults = matchedMatters.length + matchedClients.length + matchedHearings.length + matchedBilling.length;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(28, 35, 51, 0.65)",
      backdropFilter: "blur(4px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      paddingTop: "12vh",
      fontFamily: "'IBM Plex Sans', sans-serif"
    }} onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 620,
          background: "#FCFAF6",
          borderRadius: 12,
          border: "1px solid #E4DFD3",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          overflow: "hidden",
          animation: "modalSlide 0.18s ease-out"
        }}
      >
        {/* Search Input Bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
          borderBottom: "1px solid #E4DFD3",
          background: "#FFFFFF"
        }}>
          <Search size={20} color="#B08D57" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases, clients, hearings, or fee notes (Ctrl+K)..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 15,
              background: "transparent",
              color: "#1C2333",
              fontFamily: "'IBM Plex Sans', sans-serif"
            }}
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578" }}
            >
              <X size={16} />
            </button>
          ) : (
            <span style={{ fontSize: 11, background: "#F4F0E8", padding: "2px 6px", borderRadius: 4, color: "#8A8578", fontWeight: 600 }}>
              ESC
            </span>
          )}
        </div>

        {/* Results List */}
        <div style={{ maxHeight: 420, overflowY: "auto", padding: "12px 16px" }}>
          {!q ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: "#8A8578" }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Chambers Universal Spotlight</div>
              <div style={{ fontSize: 11.5, marginTop: 4 }}>
                Type to search across active dockets, client registries, court cause lists, and billing.
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: "#8A8578" }}>
              <div style={{ fontSize: 13 }}>No records matching "<strong>{query}</strong>"</div>
              <div style={{ fontSize: 11.5, marginTop: 4 }}>Check spelling or try a case number, client name, or court bench.</div>
            </div>
          ) : (
            <div>
              {/* Matters */}
              {matchedMatters.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                    <Briefcase size={12} color="#6B2737" /> Case Dockets ({matchedMatters.length})
                  </div>
                  {matchedMatters.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => onSelectResult("matters", m)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        cursor: "pointer",
                        background: "#FFFFFF",
                        border: "1px solid #EFEBE1",
                        marginBottom: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.12s"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FBF9F4")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1C2333" }}>{m.title}</div>
                        <div style={{ fontSize: 11, color: "#8A8578", marginTop: 2 }}>
                          {m.caseNumber ? `No: ${m.caseNumber} • ` : ""}{m.court || "Chambers"} • {m.practiceArea || "General"}
                        </div>
                      </div>
                      <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 4, background: "rgba(107, 39, 55, 0.1)", color: "#6B2737", fontWeight: 600 }}>
                        {m.status || "Active"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Clients */}
              {matchedClients.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                    <Users size={12} color="#B08D57" /> Clients ({matchedClients.length})
                  </div>
                  {matchedClients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onSelectResult("clients", c)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        cursor: "pointer",
                        background: "#FFFFFF",
                        border: "1px solid #EFEBE1",
                        marginBottom: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FBF9F4")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1C2333" }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "#8A8578", marginTop: 2 }}>
                          {c.company ? `${c.company} • ` : ""}{c.phone || c.email || "No contact"}
                        </div>
                      </div>
                      <ArrowRight size={13} color="#8A8578" />
                    </div>
                  ))}
                </div>
              )}

              {/* Hearings */}
              {matchedHearings.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                    <Gavel size={12} color="#3D5A4C" /> Hearings & Cause List ({matchedHearings.length})
                  </div>
                  {matchedHearings.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => onSelectResult("hearings", h)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        cursor: "pointer",
                        background: "#FFFFFF",
                        border: "1px solid #EFEBE1",
                        marginBottom: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FBF9F4")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1C2333" }}>
                          {fmtDate(h.date)} • {h.court || "Court"}
                        </div>
                        <div style={{ fontSize: 11, color: "#8A8578", marginTop: 2 }}>
                          {h.notes || "Hearing listed before bench"}
                        </div>
                      </div>
                      <span style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 4, background: "rgba(61, 90, 76, 0.1)", color: "#3D5A4C", fontWeight: 600 }}>
                        {h.outcome || "Scheduled"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Billing */}
              {matchedBilling.length > 0 && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                    <Receipt size={12} color="#6B2737" /> Professional Fee Notes ({matchedBilling.length})
                  </div>
                  {matchedBilling.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => onSelectResult("billing", b)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        cursor: "pointer",
                        background: "#FFFFFF",
                        border: "1px solid #EFEBE1",
                        marginBottom: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FBF9F4")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1C2333" }}>{b.description || "Fee Invoice"}</div>
                        <div style={{ fontSize: 11, color: "#8A8578", marginTop: 2 }}>
                          {fmtDate(b.invoiceDate || b.date)} • {b.status || "Draft"}
                        </div>
                      </div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: "#1C2333", fontSize: 13 }}>
                        {fmtCurrency(b.amount, b.currency || "AED")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div style={{
          padding: "10px 16px",
          background: "#F4F0E8",
          borderTop: "1px solid #E4DFD3",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: "#8A8578"
        }}>
          <span>Press <strong>ESC</strong> to close</span>
          <span>Click any item to jump directly to its tab</span>
        </div>
      </div>
    </div>
  );
}
