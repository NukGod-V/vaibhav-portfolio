// components/ChatWidget.jsx
//
// Floating chat widget for the "vaibhav_clone" AI agent.
// Talks ONLY to our own /api/chat/start and /api/chat/status routes —
// never directly to Camber — so the Camber API key stays server-side.
//
// Camber's agent runs are ASYNC (agents_chat_start returns immediately,
// agents_chat_status must be polled until status is "idle" or "failed").
// A single agents_chat_status call can legitimately take up to ~30s
// internally on Camber's side, so both this widget and the status.js
// route must be configured with long-enough timeouts to match.

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";

const WELCOME_MESSAGE = {
  role: "agent",
  text: "> connection established. I'm Vaibhav's AI clone — ask me about his projects, stack, or how to reach him.",
};

// ---------------------------------------------------------------------
// Polling configuration
// ---------------------------------------------------------------------
const POLL_INTERVAL_MS = 2000; // time between status checks
const MAX_POLL_ATTEMPTS = 25; // ~50s ceiling before giving up client-side

// ---------------------------------------------------------------------
// Hook: encapsulates the start -> poll(status) -> reply flow
// ---------------------------------------------------------------------
function useCamberChat() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const conversationIdRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const pollAttemptsRef = useRef(0);
  const activeRequestIdRef = useRef(0);

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearPolling(), [clearPolling]);

  // Parses a fetch Response defensively — if the server returns HTML (e.g. a
  // 404 or 504 gateway page) instead of JSON, this throws a clear error
  // instead of letting JSON.parse blow up with a cryptic "Unexpected token".
  async function parseJsonResponse(res, routeLabel) {
    const raw = await res.text();
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(
        `${routeLabel} returned a non-JSON response (status ${res.status}). Check the route exists and isn't timing out.`
      );
    }
  }

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
      setIsLoading(true);

      const requestId = ++activeRequestIdRef.current;
      clearPolling();
      pollAttemptsRef.current = 0;

      try {
        // ---- STEP 1: start the run ----
        const startRes = await fetch("/api/chat/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            conversation_id: conversationIdRef.current,
          }),
        });
        const startData = await parseJsonResponse(startRes, "/api/chat/start");
        if (!startRes.ok) throw new Error(startData.error || "Failed to start chat.");

        conversationIdRef.current = startData.conversation_id;

        if (startData.status === "idle" && startData.content) {
          finish(requestId, startData.content);
          return;
        }

        // ---- STEP 2: poll for the result ----
        let isChecking = false; // Add a lock to prevent overlapping network calls

        pollIntervalRef.current = setInterval(async () => {
          if (requestId !== activeRequestIdRef.current) {
            clearPolling();
            return;
          }

          if (isChecking) return; // If a request is still pending, skip this interval tick
          isChecking = true;

          pollAttemptsRef.current += 1;
          if (pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
            clearPolling();
            fail(requestId, "The agent is taking longer than expected. Please try again.");
            return;
          }

          try {
            const statusRes = await fetch("/api/chat/status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ conversation_id: conversationIdRef.current }),
            });
            const statusData = await parseJsonResponse(statusRes, "/api/chat/status");
            if (!statusRes.ok) throw new Error(statusData.error || "Failed to check chat status.");

            if (statusData.status === "idle") {
              clearPolling();
              finish(requestId, statusData.content);
            } else if (statusData.status === "failed") {
              clearPolling();
              fail(requestId, statusData.error || "The agent run failed. Please try again.");
            }
            // status === "running" -> keep polling
          } catch (pollErr) {
            clearPolling();
            fail(requestId, pollErr.message || "Lost connection while waiting for a reply.");
          } finally {
            isChecking = false; // Release the lock
          }
        }, POLL_INTERVAL_MS);
      } catch (startErr) {
        fail(requestId, startErr.message || "Failed to reach the agent.");
      }
    },
    [isLoading, clearPolling]
  );

  function finish(requestId, replyText) {
    if (requestId !== activeRequestIdRef.current) return; // superseded by a newer message
    setMessages((prev) => [...prev, { role: "agent", text: replyText || "…" }]);
    setIsLoading(false);
  }

  function fail(requestId, message) {
    if (requestId !== activeRequestIdRef.current) return;
    setError(message);
    setMessages((prev) => [
      ...prev,
      { role: "agent", text: "> connection error — couldn't reach the agent. Try again in a moment.", isError: true },
    ]);
    setIsLoading(false);
  }

  return { messages, isLoading, error, sendMessage };
}

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------
export default function ChatWidget() {
  const { messages, isLoading, error, sendMessage } = useCamberChat();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  }

  return (
    <>
      {/* ── Floating toggle button ───────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat with Vaibhav's AI agent"}
        style={styles.toggleBtn(open)}
        className="hoverable"
      >
        {open ? <X size={22} /> : <MessageSquare size={22} />}
        {!open && <span style={styles.pulseDot} />}
      </button>

      {/* ── Chat panel ────────────────────────────────────────── */}
      {open && (
        <div className="chat-widget-panel" style={styles.panel} role="dialog" aria-label="Chat with Vaibhav's AI agent">
          {/* Header */}
          <div style={styles.header}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={styles.statusDot} />
              <div>
                <div style={styles.headerTitle}>VAIBHAV_CLONE.AGENT</div>
                <div style={styles.headerSub}>ONLINE // CAMBER MCP</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={styles.closeBtn}
              className="hoverable"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={styles.messages}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  ...styles.bubbleRow,
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    ...(m.role === "user" ? styles.bubbleUser : styles.bubbleAgent),
                    ...(m.isError ? styles.bubbleErrorText : {}),
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ ...styles.bubbleRow, justifyContent: "flex-start" }}>
                <div style={{ ...styles.bubble, ...styles.bubbleAgent, display: "flex", alignItems: "center", gap: 8 }}>
                  <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />
                  <span>thinking…</span>
                </div>
              </div>
            )}
          </div>

          {/* Error banner */}
          {error && <div style={styles.errorBanner}>⚠ {error}</div>}

          {/* Input row */}
          <form onSubmit={handleSubmit} style={styles.inputRow}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the agent something…"
              disabled={isLoading}
              style={styles.input}
              maxLength={4000}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={styles.sendBtn(isLoading || !input.trim())}
              aria-label="Send message"
              className="hoverable"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Local keyframes + mobile responsiveness + hover states
          (scoped, no external CSS file needed) */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* .hoverable had no rules before, which is why buttons had no
           hover/press feedback ("mouse issue"). Adding real states here. */
        .hoverable {
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }
        .hoverable:hover {
          transform: scale(1.05);
        }
        .hoverable:active {
          transform: scale(0.96);
        }
        .hoverable:disabled {
          cursor: default;
          transform: none;
        }

        @media (max-width: 640px) {
          .chat-widget-panel {
            right: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            max-height: 100% !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────────
// Inline style objects (kept consistent with the portfolio's
// mono/terminal, blue #00e5ff + orange #ff6d00 palette)
// ─────────────────────────────────────────────────
const styles = {
  toggleBtn: (open) => ({
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 1100,
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: open ? "#111113" : "#00e5ff",
    color: open ? "#00e5ff" : "#050505",
    border: open ? "1px solid rgba(0,229,255,0.4)" : "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 24px rgba(0,229,255,0.25)",
    transition: "transform 0.2s, background 0.2s",
  }),
  pulseDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: "#ff6d00",
    border: "2px solid #050505",
  },
  panel: {
    position: "fixed",
    bottom: 92,
    right: 24,
    zIndex: 1100,
    width: "min(380px, calc(100vw - 32px))",
    height: "min(560px, calc(100vh - 140px))",
    maxHeight: "70vh",
    background: "#0a0a0c",
    border: "1px solid #1e1e22",
    borderRadius: 8,
    boxShadow: "0 12px 48px rgba(0,0,0,0.6), 0 0 40px rgba(0,229,255,0.05)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "'Share Tech Mono', monospace",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid #1a1a1a",
    background: "#0d0d0f",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#00e5ff",
    boxShadow: "0 0 8px #00e5ff",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 11,
    letterSpacing: "0.1em",
    color: "#e8e8f0",
  },
  headerSub: {
    fontSize: 9,
    letterSpacing: "0.1em",
    color: "#3a3a3a",
    marginTop: 2,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#5a5a64",
    cursor: "pointer",
    padding: 4,
    display: "flex",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  bubbleRow: {
    display: "flex",
    width: "100%",
  },
  bubble: {
    maxWidth: "85%",
    padding: "10px 14px",
    fontSize: 12,
    lineHeight: 1.6,
    borderRadius: 6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  bubbleAgent: {
    background: "#111113",
    border: "1px solid rgba(0,229,255,0.15)",
    color: "#c8c8d0",
    borderBottomLeftRadius: 2,
  },
  bubbleUser: {
    background: "rgba(255,109,0,0.1)",
    border: "1px solid rgba(255,109,0,0.3)",
    color: "#f0d8c8",
    borderBottomRightRadius: 2,
  },
  bubbleErrorText: {
    borderColor: "rgba(255,80,80,0.35)",
    color: "#ff8a8a",
  },
  errorBanner: {
    fontSize: 10,
    color: "#ff8a8a",
    padding: "6px 16px",
    borderTop: "1px solid rgba(255,80,80,0.2)",
    background: "rgba(255,80,80,0.05)",
  },
  inputRow: {
    display: "flex",
    gap: 8,
    padding: 12,
    borderTop: "1px solid #1a1a1a",
    background: "#0d0d0f",
  },
  input: {
    flex: 1,
    background: "#050505",
    border: "1px solid #1e1e22",
    borderRadius: 4,
    color: "#e8e8f0",
    fontSize: 12,
    fontFamily: "'Share Tech Mono', monospace",
    padding: "10px 12px",
    outline: "none",
  },
  sendBtn: (disabled) => ({
    background: disabled ? "#1a1a1a" : "#00e5ff",
    color: disabled ? "#3a3a3a" : "#050505",
    border: "none",
    borderRadius: 4,
    width: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "default" : "pointer",
    transition: "background 0.2s",
  }),
};