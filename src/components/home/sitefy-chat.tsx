"use client";

import * as React from "react";

type Msg = { role: "ai" | "user"; text: string };
type Edge = "" | "edge-left" | "edge-right" | "edge-top";

const QUICK = [
  "What's included in my plan?",
  "How long does it take to build?",
  "Can I edit my site after it's live?",
  "What domains can I register?",
];

const EDGE_THRESH = 48; // px from a screen edge to dock the assistant there

export function SitefyChat() {
  const [open, setOpen] = React.useState(false);
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [edge, setEdge] = React.useState<Edge>("");
  const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const fabRef = React.useRef<HTMLDivElement>(null);
  const handleRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  // Drag-to-move via the 6-dot handle. On release it snaps to the nearest
  // edge and sets an edge class so the panel propagates in the right
  // direction (the .ai-fab.edge-* CSS handles the actual panel placement).
  React.useEffect(() => {
    const fab = fabRef.current;
    const h = handleRef.current;
    if (!fab || !h) return;
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      try { h.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      const r = fab.getBoundingClientRect();
      // Switch to absolute left/top positioning for the drag.
      fab.style.left = r.left + "px";
      fab.style.top = r.top + "px";
      fab.style.right = "auto";
      fab.style.bottom = "auto";
      fab.classList.remove("edge-left", "edge-right", "edge-top");
      setEdge("");
      sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      let nx = ox + (e.clientX - sx);
      let ny = oy + (e.clientY - sy);
      nx = Math.max(0, Math.min(window.innerWidth - fab.offsetWidth, nx));
      ny = Math.max(0, Math.min(window.innerHeight - fab.offsetHeight, ny));
      fab.style.left = nx + "px";
      fab.style.top = ny + "px";
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      try { h.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      const r = fab.getBoundingClientRect();
      const W = window.innerWidth;
      const dL = r.left, dR = W - r.right, dT = r.top;
      let nextEdge: Edge = "";
      let left = r.left, top = r.top;
      if (dT < EDGE_THRESH && dT <= dL && dT <= dR) { nextEdge = "edge-top"; top = 8; }
      else if (dL < EDGE_THRESH && dL <= dR) { nextEdge = "edge-left"; left = 0; }
      else if (dR < EDGE_THRESH) { nextEdge = "edge-right"; left = W - fab.offsetWidth; }
      setEdge(nextEdge);
      setPos({ left, top });
    };

    h.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      h.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json();
      const answer = data?.answer ?? "I'm here to help with SGSitefy! Ask me anything about getting your business online.";
      setMsgs((m) => [...m, { role: "ai", text: answer }]);
    } catch {
      setMsgs((m) => [...m, { role: "ai", text: "Sorry — I couldn't reach the server. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  const fabStyle: React.CSSProperties | undefined = pos
    ? { left: pos.left, top: pos.top, right: "auto", bottom: "auto" }
    : undefined;

  return (
    <div
      ref={fabRef}
      className={`ai-fab ${edge}`.trim()}
      id="ai-fab"
      role="complementary"
      aria-label="SitefyAI assistant"
      style={fabStyle}
    >
      <div className={`ai-panel${open ? " open" : ""}`} aria-hidden={!open} role="dialog" aria-labelledby="ai-panel-title" aria-modal="false">
        <div className="ai-panel-head">
          <div className="ai-panel-avatar" aria-hidden="true">✦</div>
          <div className="ai-panel-title">
            <strong id="ai-panel-title">SitefyAI</strong>
            <span>powered by Gemini</span>
          </div>
          <button className="ai-panel-close" onClick={() => setOpen(false)} aria-label="Minimise SitefyAI panel" title="Minimise">✕</button>
        </div>
        <div className="ai-panel-body" ref={bodyRef}>
          <div className="ai-bubble ai-msg">
            Hi! I&apos;m SitefyAI. Ask me how SGSitefy works, what&apos;s included, pricing, or how to get started.
          </div>
          {msgs.length === 0 && (
            <div className="ai-quick-chips">
              {QUICK.map((q) => (
                <button key={q} type="button" className="ai-chip" onClick={() => ask(q)}>{q}</button>
              ))}
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`ai-bubble ${m.role === "user" ? "ai-user" : "ai-msg"}`}>{m.text}</div>
          ))}
          {busy && <div className="ai-bubble ai-msg">…</div>}
          <div className="ai-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about SGSitefy…"
              aria-label="Type a question for SitefyAI"
              onKeyDown={(e) => { if (e.key === "Enter") ask(input); }}
            />
            <button className="ai-send-btn" onClick={() => ask(input)} aria-label="Send message">Send</button>
          </div>
        </div>
        <div className="ai-powered-tag">SitefyAI · <span>powered by Gemini</span></div>
      </div>
      <div className="ai-fab-bar">
        <button ref={handleRef} className="ai-drag-handle" aria-label="Drag to move SitefyAI" title="Drag to move">
          <span /><span /><span /><span /><span /><span />
        </button>
        <button className="ai-fab-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="ai-panel">
          <span className="ai-fab-dot" aria-hidden="true" />
          <span className="ai-fab-label">
            <span className="fab-main">SitefyAI</span>
            <span className="fab-sub">Ask me anything</span>
          </span>
        </button>
      </div>
    </div>
  );
}
