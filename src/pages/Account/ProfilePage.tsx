import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAuth, rehydrate } from "@/store/auth.slice";
import { saveAuth } from "@/store/storage";
import { updateProfile } from "@/services/profile.service"; 

type UpdPayload = {
  full_name?: string | null;
  gender?: string | null;
};

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector(selectAuth);

  // Local form state
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [gender, setGender] = useState(user?.gender ?? "");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Voice list (sample defaults; keep user’s current voice at top)
  // const voiceOptions = useMemo(() => {
  //   const base = ["Matthew", "Joanna", "Amy", "Brian", "Aditi", "Raveena", "Zhiyu", "Kajal"];
  //   const uniq = Array.from(new Set([voice || "", ...base])).filter(Boolean);
  //   return uniq;
  // }, [voice]);

  useEffect(() => {
    // sync when Redux changes (e.g., after login)
    setFullName(user?.full_name ?? "");
    setGender(user?.gender ?? "");
  }, [user?.full_name, user?.gender]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!token) { setErr("Not authenticated."); return; }

    // minimal client-side checks
    if (fullName.trim().length === 0) { setErr("Please enter your full name."); return; }

    const payload: UpdPayload = {
      full_name: fullName.trim(),
      gender: gender || null,
    };

    setLoading(true);
    try {
      const updated = await updateProfile(payload); // should return { user_id, email, full_name, gender, voice_pref }
      // persist new profile to localStorage alongside existing token
      const nextUser = {
        id: updated.user_id ?? updated.id ?? user?.id ?? "",
        email: updated.email ?? user?.email ?? "",
        full_name: updated.full_name ?? null,
        gender: updated.gender ?? null,
      };
      saveAuth({ token, user: nextUser });
      // rehydrate Redux from storage so the whole app sees the change
      dispatch(rehydrate());
      setOk("Profile updated.");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Profile</h1>
          <p className="text-sm opacity-75">Manage your account details and preferred voice.</p>
        </div>
        <Link
          to="/avatar/speak"
          className="px-4 py-2 rounded-xl text-sm bg-[--primary] text-white hover:bg-[--primary-hover]"
        >
          Go to Avatar Speak
        </Link>
      </div>

      {/* Alerts */}
      {ok && <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm">{ok}</div>}
      {err && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">{err}</div>}

      <form onSubmit={onSave} className="rounded-2xl bg-[--bg] ring-1 ring-white/10 p-4 md:p-6 space-y-5">
        {/* Email (read-only) */}
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm opacity-85">Email</label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 opacity-70"
            />
          </div>

          {/* Full name */}
          <div className="space-y-2">
            <label className="text-sm opacity-85">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 outline-none focus:border-[--primary] transition"
              required
            />
          </div>
        </div>

        {/* Gender & Voice */}
        <div className="grid gap-2 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm opacity-85">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 outline-none focus:border-[--primary]"
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

    </div>
  );
}
