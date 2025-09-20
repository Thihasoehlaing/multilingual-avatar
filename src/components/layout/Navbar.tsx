import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout, selectAuth } from "@/store/auth.slice";

export default function Navbar() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector(selectAuth);

  const onLogout = () => {
    dispatch(logout());
    nav("/", { replace: true });
  };

  const isActive = (path: string) =>
    pathname === path
      ? "text-white"
      : "text-[--fg]/80 hover:text-white";

  const Authed = (
    <div className="flex items-center gap-3">
      <Link
        to="/avatar/speak"
        className={`px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/[0.06] ${isActive("/avatar/speak")}`}
      >
        Avatar Speak
      </Link>

      <div className="relative group">
        <button
          className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-sm"
          aria-haspopup="menu"
          aria-expanded="false"
        >
          {user?.full_name ?? user?.email ?? "Account"}
        </button>
        <div
          className="absolute right-0 mt-2 hidden group-hover:block rounded-xl border border-white/10 bg-[--bg-alt] shadow min-w-44 overflow-hidden"
          role="menu"
        >
          <Link
            to="/account"
            className="block px-4 py-2 text-sm hover:bg-white/[0.06]"
            role="menuitem"
          >
            Profile
          </Link>
          <button
            onClick={onLogout}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-white/[0.06]"
            role="menuitem"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  const Guest = (
    <div className="flex items-center gap-3">
      <Link
        to="/login"
        className={`px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/[0.06] ${isActive("/login")}`}
      >
        Login
      </Link>
      <Link
        to="/signup"
        className={`px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] ${isActive("/signup")}`}
      >
        Sign up
      </Link>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-[--bg]/70 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-semibold hover:opacity-90">
          Multilingual Avatar
        </Link>

        {/* left area (optional nav links) */}
        <nav className="ml-6 hidden md:flex items-center gap-4 text-sm">
          <Link to="/" className={isActive("/")}>Home</Link>
        </nav>

        {token ? Authed : Guest}
      </div>
    </header>
  );
}
