import React, { useState } from "react";
import { X, Send, MessageSquare } from "lucide-react";
import { fmtDate } from "../utils";

const DISPOSAL_OPTIONS = ["Part-heard", "Heard & reserved", "Adjourned", "Not reached"];

export default function HearingBriefModal({
  hearing,
  matter,
  onClose,
  onSave, // (hearingPatch, { createNext: {date, time} | null }, { updateDeadline: {deadlineDate, deadlineType, deadlineNotes} | null }, notifyClient)
}) {
  if (!hearing) return null;

  const [disposal, setDisposal] = useState(hearing.outcome && DISPOSAL_OPTIONS.includes(hearing.outcome) ? hearing.outcome : "");
  const [orderNotes, setOrderNotes] = useState(hearing.orderNotes || "");
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState("");
  const [setDeadline, setSetDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState(matter?.deadlineDate || "");
  const [deadlineType, setDeadlineType] = useState(matter?.deadlineType || "");
  const [notify, setNotify] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(
      { outcome: disposal || hearing.outcome || "Scheduled", orderNotes },
      nextDate ? { createNext: { date: nextDate, time: nextTime } } : { createNext: null },
      setDeadline && deadlineDate ? { updateDeadline: { deadlineDate, deadlineType, deadlineNotes: orderNotes } } : { updateDeadline: null },
      notify
    );
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,35,51,0.55)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
      <div style={{ background: "#F7F5F0", border: "1px solid #E4DFD3", borderRadius: 10, width: "100%", maxWidth: 980, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 45px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #E4DFD3", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "#FCFAF6" }}>
          <div>
            <div style={{ fontSize: 11.5, color: "#8A8578", marginBottom: 3 }}>Hearings / {fmtDate(hearing.date)}</div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 19, fontWeight: 600 }}>Hearing brief — {matter?.title || "Matter"}</div>
            <div style={{ fontSize: 12, color: "#8A8578", marginTop: 3 }}>{hearing.court || "Court TBD"}{hearing.time ? ` · listed ${hearing.time}` : ""}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578" }}><X size={18} /></button>
        </div>

        <div style={{ padding: "22px 24px", flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, padding: "16px 18px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              <div><div style={{ fontSize: 11, fontWeight: 600, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>Appearance</div><div style={{ fontSize: 13 }}>{matter?.advocate || "—"}</div></div>
              <div><div style={{ fontSize: 11, fontWeight: 600, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>Opposing party</div><div style={{ fontSize: 13 }}>{matter?.opposingParty || "—"}</div></div>
              <div><div style={{ fontSize: 11, fontWeight: 600, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>Matter reference</div><div style={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}>{matter?.caseNumber || "—"}</div></div>
              <div><div style={{ fontSize: 11, fontWeight: 600, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>Forum</div><div style={{ fontSize: 13 }}>{hearing.court || "—"}</div></div>
            </div>

            <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 16, fontWeight: 600 }}>Agenda / notes for hearing</div>
              <div style={{ padding: "14px 18px", fontSize: 13, lineHeight: 1.6, color: "#22262B" }}>
                {hearing.notes || <span style={{ color: "#8A8578" }}>No agenda notes recorded for this hearing.</span>}
              </div>
            </div>
          </div>

          <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid #E4DFD3", background: "#FBF9F4", fontFamily: "'Source Serif 4', serif", fontSize: 16, fontWeight: 600, color: "#6B2737" }}>Record outcome</div>
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16, flex: 1, overflowY: "auto" }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 }}>Disposal</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                  {DISPOSAL_OPTIONS.map((opt) => (
                    <div
                      key={opt}
                      onClick={() => setDisposal(opt)}
                      style={{
                        padding: 8, borderRadius: 5, border: `1px solid ${disposal === opt ? "#6B2737" : "#D9D2C2"}`,
                        background: disposal === opt ? "#6B273712" : "#FFF",
                        color: disposal === opt ? "#6B2737" : "#6B6255",
                        fontSize: 12.5, fontWeight: 600, textAlign: "center", cursor: "pointer"
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5 }}>Order / directions</div>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="What the tribunal/bench directed, and what happens next..."
                  style={{ width: "100%", minHeight: 104, padding: "9px 10px", border: "1px solid #D9D2C2", borderRadius: 5, background: "#FFF", fontSize: 13, lineHeight: 1.5, color: "#22262B", fontFamily: "inherit", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>Next date</div>
                  <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #D9D2C2", borderRadius: 5, background: "#FFF", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>Time</div>
                  <input type="time" value={nextTime} onChange={(e) => setNextTime(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #D9D2C2", borderRadius: 5, background: "#FFF", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }} />
                </div>
                {nextDate && <div style={{ gridColumn: "1 / -1", fontSize: 11, color: "#8A8578" }}>A new hearing will be scheduled at the same court on save.</div>}
              </div>

              <div style={{ padding: "12px 14px", borderRadius: 6, background: "rgba(176,141,87,0.12)", border: "1px solid #B08D5744" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "#8A6D3B", cursor: "pointer" }}>
                  <input type="checkbox" checked={setDeadline} onChange={(e) => setSetDeadline(e.target.checked)} />
                  Update this matter's statutory deadline
                </label>
                {setDeadline && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                    <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} style={{ padding: "7px 9px", border: "1px solid #D9D2C2", borderRadius: 5, background: "#FFF", fontSize: 12.5 }} />
                    <input value={deadlineType} onChange={(e) => setDeadlineType(e.target.value)} placeholder="Deadline type" style={{ padding: "7px 9px", border: "1px solid #D9D2C2", borderRadius: 5, background: "#FFF", fontSize: 12.5 }} />
                  </div>
                )}
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#6B6255", cursor: "pointer" }}>
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
                <MessageSquare size={13} /> Notify client when saved
              </label>
            </div>

            <div style={{ padding: "14px 18px", borderTop: "1px solid #E4DFD3", display: "flex", gap: 10 }}>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: 10, borderRadius: 5, background: "#6B2737", color: "#F7F5F0", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : "Save outcome"}
              </button>
              <button onClick={onClose} style={{ padding: "10px 14px", borderRadius: 5, background: "transparent", color: "#6B6255", border: "1px solid #D9D2C2", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
