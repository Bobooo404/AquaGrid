import { useState, type FormEvent } from "react";
import { MessageSquare, Send, CheckCircle2, Star } from "lucide-react";
import type { AuthUser } from "../auth/auth";

interface FeedbackPageProps {
  user: AuthUser;
}

const inputStyle = {
  background: "var(--bg-primary)",
  border: "1px solid var(--border-strong)",
  color: "var(--text-primary)",
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 13,
  outline: "none",
} as const;

export default function FeedbackPage({ user }: FeedbackPageProps) {
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setCategory("general");
    setSubject("");
    setMessage("");
    setRating(0);
    setSent(true);
    window.setTimeout(() => setSent(false), 4000);
  };

  const cardStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    boxShadow: "0 1px 8px var(--surface-shadow-soft)",
  } as const;

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto" style={{ background: "var(--bg-primary)" }}>
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Feedback</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Share your experience and help us improve AquaGrid
        </p>
      </div>

      <div className="rounded-2xl p-5 flex flex-col gap-4 max-w-2xl" style={cardStyle}>
        <div className="flex items-center gap-2">
          <MessageSquare size={16} style={{ color: "var(--accent-blue)" }} />
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Submit Feedback</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
                <option value="general">General</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="data">Data / Sensor Issue</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary"
                style={{ ...inputStyle, width: "100%" }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={20}
                    style={
                      n <= rating
                        ? { color: "#f59e0b", fill: "#f59e0b" }
                        : { color: "var(--text-muted)" }
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Your feedback</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts, report an issue, or suggest an improvement..."
              rows={5}
              className="resize-none"
              style={{ ...inputStyle, width: "100%", lineHeight: 1.5 }}
            />
          </div>

          {sent && (
            <div
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg alert-enter"
              style={{ background: "var(--success-surface)", border: "1px solid var(--success-border)", color: "var(--success-text)" }}
            >
              <CheckCircle2 size={14} /> Thanks! Your feedback has been submitted.
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              Submitting as {user.name} · {user.role}
            </span>
            <button
              type="submit"
              disabled={!message.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-mono font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))" }}
            >
              <Send size={14} /> Send Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
