import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "@/services/auth";

export default function SignupPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const strength = getStrength(pw);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!fullName.trim()) return setErr("Please enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Please enter a valid email address.");
    if (pw.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw !== pw2) return setErr("Passwords do not match.");

    setLoading(true);
    try {
      await signup(fullName, email, pw);
      setOk("Account created! Redirecting to login…");
      setTimeout(() => navigate("/login"), 900);
    } catch (e: unknown) {
      if (e instanceof Error) setErr(e.message);
      else setErr("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[--bg] text-[--fg] grid place-items-center px-4">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <button
          onClick={() => navigate("/")}
          className="mb-5 flex items-center gap-1 text-sm text-[--primary] hover:underline"
        >
          ← Back to home
        </button>

        {/* Card */}
        <div className="rounded-2xl bg-[--bg-alt] ring-1 ring-white/10 p-6 md:p-8 shadow-[0_40px_120px_-60px_rgba(0,0,0,.8)]">
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm opacity-80">
            Sign up to try the avatar speak demo and save your settings.
          </p>

          {err && (
            <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
              {err}
            </div>
          )}
          {ok && (
            <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm">
              {ok}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="fullName" className="text-sm opacity-90">Full name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 outline-none focus:border-[--primary] transition"
                placeholder="e.g., Alice"
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm opacity-90">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 outline-none focus:border-[--primary] transition"
                placeholder="alice@gmail.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm opacity-90">Password</label>
              <div className="mt-2 flex items-stretch gap-2">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 outline-none focus:border-[--primary] transition"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="px-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm hover:border-white/20"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>

              {/* Strength meter */}
              <div className="mt-2">
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={[
                      "h-full transition-all",
                      strength.width,
                      strength.color,
                    ].join(" ")}
                    aria-hidden
                  />
                </div>
                <div className="mt-1 text-xs opacity-70">{strength.label}</div>
              </div>
            </div>

            <div>
              <label htmlFor="password2" className="text-sm opacity-90">Confirm password</label>
              <input
                id="password2"
                type={showPw ? "text" : "password"}
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                className="mt-2 w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 outline-none focus:border-[--primary] transition"
                placeholder="Retype your password"
                autoComplete="new-password"
              />
            </div>

            {/* Primary action */}
            <button
              type="submit"
              disabled={loading}
              className={[
                "w-full mt-4 px-6 py-3 rounded-xl font-medium text-sm",
                "bg-white/[0.03] border border-white/10 text-[--fg]",
                "hover:bg-white/[0.06] hover:text-white",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "transition-colors duration-200"
              ].join(" ")}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-sm opacity-80">
            Already have an account?{" "}
            <Link to="/login" className="text-[--primary] hover:underline">
              Log in
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs opacity-60">
          By signing up you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}

/* ——— helpers ——— */
function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const pct = Math.min(score / 5, 1);

  const width =
    pct === 0 ? "w-0" :
    pct <= 0.4 ? "w-1/4" :
    pct <= 0.6 ? "w-2/4" :
    pct <= 0.8 ? "w-3/4" : "w-full";

  const color =
    pct <= 0.4 ? "bg-red-500/70" :
    pct <= 0.6 ? "bg-yellow-500/80" :
    pct <= 0.8 ? "bg-emerald-500/80" : "bg-[--primary]";

  const label =
    pct === 0 ? "Too short" :
    pct <= 0.4 ? "Weak" :
    pct <= 0.6 ? "Okay" :
    pct <= 0.8 ? "Good" : "Strong";

  return { width, color, label };
}
