import { useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { scrollToId } from "@/utils/scrollTo";
import { useActiveSection } from "@/hooks/useActiveSection";

const LINKS = [
  {id: "home", label: "Home" },
  { id: "features", label: "Features" },
  { id: "how", label: "How it works" },
  { id: "faq", label: "FAQ" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = useActiveSection(LINKS.map(l => l.id));

  function goHome() {
    if (pathname !== "/") navigate("/");
    // small delay lets route switch before scroll (when not already on /)
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  function goSection(id: string) {
    if (pathname !== "/") {
      navigate("/");
      // wait a frame for DOM mount
      setTimeout(() => scrollToId(id), 50);
    } else {
      scrollToId(id);
    }
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        {/* Logo (text already baked into the image) */}
        <button onClick={goHome} className="group inline-flex items-center gap-2">
          <img src={logo} alt="Multilingual Avatar" className="h-18 w-auto" />
        </button>

        <nav className="hidden md:flex items-center gap-2">
          {LINKS.map((l) => {
            const isActive = active === l.id;
            return (
              <button
                key={l.id}
                onClick={() => goSection(l.id)}
                className={[
                  "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 outline-none",
                  "hover:text-white hover:bg-white/5",
                  isActive ? "text-white" : "text-[--fg-muted]"
                ].join(" ")}
              >
                {/* Neon pill highlight for active */}
                <span
                  className={[
                    "absolute inset-0 rounded-full -z-10",
                    "opacity-0",
                    isActive ? "opacity-100 animate-[neon_2.6s_ease-in-out_infinite]" : "",
                    "bg-[color-mix(in_oklab,var(--primary)_20%,transparent)]"
                  ].join(" ")}
                />
                {/* Bold underline on hover & active */}
                <span className="relative">
                  {l.label}
                  <span
                    className={[
                      "absolute left-0 right-0 -bottom-1 h-[3px] rounded-full",
                      isActive
                        ? "bg-[--primary] animate-[underline-in_.22s_ease-out_forwards]"
                        : "bg-[--primary] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
                    ].join(" ")}
                  />
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/login")}
            className="px-3 py-2 text-sm rounded-lg border border-white/10 text-[--fg-muted] hover:text-[--primary] hover:border-[--primary] transition"
          >
            Log in
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-4 py-2 text-sm rounded-xl text-white bg-[--primary] hover:bg-[--primary-hover] transition"
          >
            Get started
          </button>
        </div>
      </div>
      <div className="h-[2px] w-full bg-gradient-to-r from-[--primary] via-[--primary-2] to-[--primary] animate-pulse" />
    </header>
  );
}
