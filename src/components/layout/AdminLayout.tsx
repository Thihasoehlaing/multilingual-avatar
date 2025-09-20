import { useState, type PropsWithChildren, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout, selectAuth } from "@/store/auth.slice";

type NavItem = { to: string; label: string; icon?: ReactNode };

const NAV: NavItem[] = [
  { to: "/account", label: "Profile", icon: <span aria-hidden>👤</span> },
  { to: "/avatar/speak", label: "Avatar Speak", icon: <span aria-hidden>🗣️</span> },
];

export default function AdminLayout({ children }: PropsWithChildren) {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(selectAuth);

  const [collapsed, setCollapsed] = useState(false);

  const isActive = (to: string) =>
    pathname.startsWith(to)
      ? "bg-white/[0.06] text-white"
      : "text-[--fg]/80 hover:text-white hover:bg-white/[0.04]";

  const onLogout = () => {
    dispatch(logout());
    nav("/", { replace: true });
  };

  return (
    <div
      className="min-h-dvh grid grid-rows-[auto_1fr]"
      style={{ gridTemplateColumns: collapsed ? "72px 1fr" : "240px 1fr" }}
    >
      {/* Sidebar */}
      <aside className="row-span-2 bg-[--bg-alt] border-r border-white/10 flex flex-col">
        {/* Brand / Collapse toggle */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-white/10">
          <Link to="/account" className="font-semibold hover:opacity-90">
            {collapsed ? "MA" : "Multilingual AI Avatar"}
          </Link>
          {/* <button
            onClick={() => setCollapsed((s) => !s)}
            className="px-2 py-1 rounded-lg border border-white/10 bg-white/[0.04] text-sm hover:bg-white/[0.08]"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "»" : "«"}
          </button> */}
        </div>

        {/* Nav */}
        <nav className="p-2 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive(item.to)}`}
              title={collapsed ? item.label : undefined}
            >
              {/* icon */}
              <span className="shrink-0">{item.icon}</span>
              {/* label (hide when collapsed) */}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sidebar footer (user/mini controls) */}
        <div className="border-t border-white/10 p-3 text-xs opacity-70">
          {!collapsed ? (
            <div className="space-y-1">
              <div className="truncate">{user?.full_name ?? user?.email ?? "User"}</div>
              <div className="truncate">{user?.voice_pref ? `Voice: ${user.voice_pref}` : ""}</div>
            </div>
          ) : (
            <div className="text-center">⋯</div>
          )}
        </div>
      </aside>

      {/* Topbar */}
      <header className="h-14 bg-[--bg] border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {/* Mirror collapse toggle for convenience */}
          <button
            onClick={() => setCollapsed((s) => !s)}
            className="px-2 py-1 rounded-lg border border-white/10 bg-white/[0.04] text-sm hover:bg-white/[0.08]"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            ☰
          </button>
          <div className="text-sm opacity-80">
            {pathname.startsWith("/account")
              ? "Account"
              : pathname.startsWith("/avatar")
              ? "Avatar"
              : "Dashboard"}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm opacity-80">
            {user?.full_name ?? user?.email ?? "User"}
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-sm hover:bg-white/[0.08]"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <section className="p-4">
        <div className="mx-auto max-w-6xl">{children}</div>
      </section>
    </div>
  );
}
