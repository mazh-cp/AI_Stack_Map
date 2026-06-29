import { useState } from "react";
import { ShieldCheck, LogIn, AlertCircle } from "lucide-react";
import { useStore } from "../store/useStore";

const DEMO_ACCOUNTS = [
  { role: "Owner", email: "owner@imbsys.com", note: "full access" },
  { role: "AppSec", email: "appsec@imbsys.com", note: "controls, risks, models, scans" },
  { role: "SOC", email: "soc@imbsys.com", note: "risks, scans, inspections" },
  { role: "Viewer", email: "viewer@imbsys.com", note: "read-only" },
];
const DEMO_PASSWORD = "Demo!1234";

export function Login() {
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState("owner@imbsys.com");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await login(email.trim().toLowerCase(), password);
    if (!res.ok) setError(res.error ?? "Login failed");
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-bg p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="rounded-xl bg-accent/10 p-3 ring-1 ring-accent/20">
            <ShieldCheck className="h-7 w-7 text-accent" />
          </div>
          <h1 className="mt-3 text-xl font-bold text-white">
            AI Security Stack Mapper
          </h1>
          <p className="text-sm text-gray-500">Sign in to continue</p>
        </div>

        <form onSubmit={submit} className="soc-card space-y-4 p-6">
          <div>
            <p className="stat-label mb-1.5">Email</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              className="input-soc"
              placeholder="you@imbsys.com"
            />
          </div>
          <div>
            <p className="stat-label mb-1.5">Password</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-soc"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-status-critical/30 bg-status-critical/10 px-3 py-2 text-xs text-status-critical">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#0f172a] hover:bg-accent/90 disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="soc-card mt-4 p-4">
          <p className="stat-label mb-2">Demo accounts (password: {DEMO_PASSWORD})</p>
          <div className="space-y-1.5">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                onClick={() => {
                  setEmail(a.email);
                  setPassword(DEMO_PASSWORD);
                }}
                className="flex w-full items-center justify-between rounded-md border border-base-border bg-base-bg/50 px-3 py-2 text-left text-xs hover:border-accent/40"
              >
                <span className="font-medium text-gray-200">{a.role}</span>
                <span className="font-mono text-gray-500">{a.email}</span>
                <span className="text-gray-600">{a.note}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
