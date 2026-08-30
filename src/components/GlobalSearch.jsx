import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, Briefcase, Users, X } from "lucide-react";

export default function GlobalSearch({ clients, matters, clientName, onSelectMatter, onSelectClient }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { matterHits: [], clientHits: [] };

    const matterHits = matters
      .filter((m) => (
        m.title + " " + (m.case_number || "") + " " + (m.opposing_party || "") + " " + clientName(m.client_id)
      ).toLowerCase().includes(q))
      .slice(0, 6);

    const clientHits = clients
      .filter((c) => (c.name + " " + (c.company || "") + " " + (c.email || "")).toLowerCase().includes(q))
      .slice(0, 4);

    return { matterHits, clientHits };
  }, [query, matters, clients, clientName]);

  const hasResults = results.matterHits.length > 0 || results.clientHits.length > 0;

  const clear = () => { setQuery(""); setOpen(false); };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: 10, color: "#8A93B0" }} />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search matters, clients…"
          style={{
            width: "100%", boxSizing: "border-box", padding: "8px 30px 8px 30px", borderRadius: 6,
            border: "1px solid #2C3450", background: "rgba(255,255,255,0.06)", color: "#E8E4D8",
            fontSize: 12.5, fontFamily: "'IBM Plex Sans', sans-serif", outline: "none",
          }}
        />
        {query && (
          <button onClick={clear} style={{ position: "absolute", right: 8, top: 8, background: "none", border: "none", cursor: "pointer", color: "#8A93B0", padding: 0 }}>
            <X size={13} />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, width: 320, maxHeight: 360, overflowY: "auto",
          background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, boxShadow: "0 20px 50px rgba(28,35,51,0.35)",
          zIndex: 200,
        }}>
          {!hasResults && (
            <div style={{ padding: "18px 16px", fontSize: 12.5, color: "#8A8578", textAlign: "center" }}>
              No matters or clients matching "{query}"
            </div>
          )}

          {results.matterHits.length > 0 && (
            <div>
              <div style={{ padding: "8px 14px 4px", fontSize: 10.5, fontWeight: 600, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.4 }}>Matters</div>
              {results.matterHits.map((m) => (
                <div
                  key={m.id}
                  onClick={() => { onSelectMatter(m.id); clear(); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", cursor: "pointer" }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Briefcase size={14} style={{ color: "#8A8578", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#22262B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                    <div style={{ fontSize: 11.5, color: "#8A8578", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {clientName(m.client_id)}{m.case_number ? ` · ${m.case_number}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.clientHits.length > 0 && (
            <div>
              <div style={{ padding: "8px 14px 4px", fontSize: 10.5, fontWeight: 600, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.4, borderTop: results.matterHits.length ? "1px solid #E4DFD3" : "none" }}>Clients</div>
              {results.clientHits.map((c) => (
                <div
                  key={c.id}
                  onClick={() => { onSelectClient(c.id); clear(); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", cursor: "pointer" }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Users size={14} style={{ color: "#8A8578", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#22262B" }}>{c.name}</div>
                    {c.company && <div style={{ fontSize: 11.5, color: "#8A8578" }}>{c.company}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
