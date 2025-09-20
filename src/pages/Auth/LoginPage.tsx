import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login as loginThunk, selectAuth } from "@/store/auth.slice";

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status } = useAppSelector(selectAuth); // optional: use to disable button

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Please enter a valid email address.");
    if (!pw) return setErr("Please enter your password.");

    setLoading(true);
    try {
      // use the thunk from auth.slice.ts
      await dispatch(loginThunk({ email, password: pw })).unwrap();
      navigate("/account");
    } catch (e: unknown) {
      // thunk uses rejectWithValue(string), so e is usually the message string
      setErr(typeof e === "string" ? e : "Unexpected error occurred.");
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
          <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
          <p className="mt-1 text-sm opacity-80">Access your account and continue where you left off.</p>

          {err && (
            <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
                  placeholder="Your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="px-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm hover:border-white/20"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Primary action */}
            <button
              type="submit"
              disabled={loading || status === "loading"}
              className={[
                "w-full mt-4 px-6 py-3 rounded-xl font-medium text-sm",
                "bg-white/[0.03] border border-white/10 text-[--fg]",
                "hover:bg-white/[0.06] hover:text-white",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "transition-colors duration-200"
              ].join(" ")}
            >
              {loading || status === "loading" ? "Logging in…" : "Log in"}
            </button>
          </form>

          <div className="mt-6 text-sm opacity-80">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-[--primary] hover:underline">
              Sign up
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs opacity-60">
          Forgot your password?{" "}
          <a href="#" className="text-[--primary] hover:underline">
            Reset here
          </a>
        </p>
      </div>
    </div>
  );
}
