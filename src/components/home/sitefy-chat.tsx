"use client";

import * as React from "react";

type Msg = { role: "ai" | "user"; text: string };

const QUICK = [
  "What's included in my plan?",
  "How long does it take to build?",
  "Can I edit my site after it's live?",
  "What domains can I register?",
];

export function SitefyChat() {
  const [open, setOpen] = React.useState(false);
  const [msgs, setMsgs] = React.useState<Msg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

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

  return (
    <div className="ai-fab" id="ai-fab" role="complementary" aria-label="SitefyAI assistant">
      <div className="ai-panel" aria-hidden={!open} role="dialog" aria-labelledby="ai-panel-title" aria-modal="false" style={{ display: open ? undefined : "none" }}>
        <div className="ai-panel-head">
          <div className="ai-panel-avatar" aria-hidden="true">✦</div>
          <div className="ai-panel-title">
            <strong id="ai-panel-title">SitefyAI</strong>
            <span>powered by Gemini</span>
          </div>
          <button className="ai-panel-close" onClick={() => setOpen(false)} aria-label="Close SitefyAI panel">✕</button>
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
