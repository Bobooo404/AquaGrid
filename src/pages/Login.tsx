import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sun, Moon, ArrowRight } from "lucide-react";
import aquagridLogo from "../assets/aquagrid-logo.png";
import { login, type AuthUser } from "../auth/auth";

interface LoginProps {
  darkMode: boolean;
  onToggleDark: () => void;
  onLogin: (user: AuthUser) => void;
}

export default function Login({ darkMode, onToggleDark, onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    background: "var(--bg-primary)",
    border: "1px solid var(--border-strong)",
    color: "var(--text-primary)",
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter both email and password.");
      return;
    }

    setLoading(true);
    window.setTimeout(() => {
      const user = login(email, password);
      setLoading(false);
      if (!user) {
        setError("Invalid email or password.");
        return;
      }
      onLogin(user);
    }, 350);
  };

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <div
      className="relative flex items-center justify-center h-screen overflow-hidden p-6"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Ambient blobs */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl"
        style={{ background: "rgba(14,165,233,0.18)" }}
      />
      <div
        className="absolute -bottom-40 -right-24 w-[26rem] h-[26rem] rounded-full blur-3xl"
        style={{ background: "rgba(37,99,235,0.14)" }}
      />

      <button
        onClick={onToggleDark}
        className="absolute top-5 right-5 p-2 rounded-xl transition-colors hover:bg-blue-50 z-10"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}
        title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
        aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
      >
        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div
        className="relative w-full max-w-md rounded-3xl p-8 alert-enter"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-strong)",
          boxShadow: "0 24px 64px rgba(14,165,233,0.14)",
        }}
      >
        {/* Brand */}
        <div className="flex flex-col items-center mb-7">
          <div
            className="flex items-center justify-center rounded-2xl mb-3"
            style={{
              width: 58,
              height: 58,
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-strong)",
              padding: 8,
            }}
          >
            <img src={aquagridLogo} alt="AquaGrid" className="w-full h-full object-contain" />
          </div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            AquaGrid
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Sign in to access the water management console
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-mono mb-1.5 block" style={{ color: "var(--text-muted)" }}>
              Email
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@aquagrid.io"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono mb-1.5 block" style={{ color: "var(--text-muted)" }}>
              Password
            </label>
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none transition-colors"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="text-xs px-3 py-2 rounded-lg alert-enter"
              style={{
                background: "var(--danger-surface)",
                border: "1px solid var(--danger-border)",
                color: "var(--danger-text)",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))" }}
          >
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Demo accounts */}
        <div
          className="mt-6 rounded-xl p-3"
          style={{ background: "var(--bg-subtle)", border: "1px dashed var(--border-strong)" }}
        >
          <div
            className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            <ShieldCheck size={12} /> Demo accounts
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => fillDemo("admin@aquagrid.io", "admin123")}
              className="text-left text-xs px-2 py-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)", background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <span style={{ color: "var(--accent-blue)", fontWeight: 700 }}>ADMIN</span> · admin@aquagrid.io / admin123
            </button>
            <button
              type="button"
              onClick={() => fillDemo("user@aquagrid.io", "user123")}
              className="text-left text-xs px-2 py-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)", background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>USER</span> · user@aquagrid.io / user123
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
