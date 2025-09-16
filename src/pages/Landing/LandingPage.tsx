export default function LandingPage() {
  return (
    <div className="relative">
      {/* HERO */}
      <section id="home" className="relative">
        <div className="mx-auto max-w-7xl px-4 pt-16 lg:pt-24 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl/tight md:text-6xl font-semibold tracking-tight">
              Speak <span className="text-[--primary]">any language</span>.<br />
              Keep <span className="bg-clip-text text-transparent bg-[linear-gradient(90deg,var(--primary),var(--primary-2))]">your voice</span>.
            </h1>
            <p className="mt-5 text-base md:text-lg opacity-90 max-w-xl">
              Real-time translation with voice preservation and precision lip-sync (visemes).
              Built for lightning-fast demos and studio-quality previews.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/avatar/speak" className="px-6 py-3 rounded-xl text-white bg-[--primary] hover:bg-[--primary-hover]">
                Try Live Demo
              </a>
              <a href="/signup" className="px-6 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10">
                Create account
              </a>
            </div>

            <div className="mt-6 text-xs opacity-60">
              API: <span className="font-mono">{import.meta.env.VITE_API_BASE_URL}</span>
            </div>
          </div>

          <div className="relative rounded-2xl p-4 lg:p-6 bg-[--bg-alt] shadow-[0_40px_120px_-60px_rgba(0,0,0,.8)] ring-1 ring-white/5">
            <div className="aspect-video rounded-xl bg-black/50 grid place-items-center overflow-hidden">
              <div className="text-center px-6">
                <div className="text-sm uppercase tracking-wider opacity-60">Preview</div>
                <div className="mt-2 text-lg">Avatar Player</div>
                <div className="mt-4 h-1.5 rounded-full w-56 mx-auto bg-white/10 overflow-hidden">
                  <div className="h-full w-1/2 animate-[pulse_2s_ease-in-out_infinite] bg-white/40"></div>
                </div>
                <p className="mt-3 text-xs opacity-70">Visual placeholder—live demo on the next screen.</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
              {["EN → MY", "EN → ZH", "EN → MM"].map((t) => (
                <button key={t} className="rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 py-2 transition">
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section-sep">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-3xl font-semibold">Built for multilingual demos</h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <article
                key={f.title}
                className="rounded-2xl p-6 bg-[--bg-alt] ring-1 ring-white/5 hover:ring-[--primary] transition shadow-[0_20px_60px_-40px_rgba(0,0,0,.9)] hover:shadow-[0_40px_120px_-50px_color-mix(in_oklab,var(--primary),transparent_70%)]"
              >
                <div className="flex items-center gap-3">
                  <span className="h-9 w-9 rounded-xl bg-[--primary]/15 inline-grid place-items-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-[--primary]"></span>
                  </span>
                  <h3 className="font-medium">{f.title}</h3>
                </div>
                <p className="mt-3 text-sm opacity-80">{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="section-sep">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-3xl font-semibold">How it works</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="rounded-2xl p-6 bg-[--bg-alt] ring-1 ring-white/5">
                <div className="text-sm opacity-60">Step {i + 1}</div>
                <div className="mt-1 text-lg font-medium">{s.t}</div>
                <p className="mt-2 text-sm opacity-80">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <a href="/avatar/speak" className="inline-block px-5 py-3 rounded-xl bg-[--primary] text-white hover:bg-[--primary-hover]">
              Open the demo
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section-sep">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-3xl font-semibold">FAQ</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <Faq q="Do I need an account?" a="Preview is open; saving voices/profiles requires sign-in." />
            <Faq q="Which languages are supported?" a="Start with EN↔MY, EN↔ZH, EN↔MM—extend in Settings." />
            <Faq q="Where does processing happen?" a={`Everything runs on ${import.meta.env.VITE_API_BASE_URL}.`} />
            <Faq q="Is my data stored?" a="Demo uses streaming; nothing is stored unless you opt in." />
          </div>
        </div>
      </section>
    </div>
  );
}

const features = [
  { title: "Real-time TTS + visemes", desc: "Backend generates phonemes/visemes; player renders lip-sync smoothly." },
  { title: "Accurate translation", desc: "Send text/mic input and receive translated speech in your voice." },
  { title: "Low-latency preview", desc: "Chunked playback with streaming endpoints keeps the UI responsive." },
];

const steps = [
  { t: "Input", d: "Type text or talk. Choose source and target languages." },
  { t: "Generate", d: "Backend returns audio + visemes for precise mouth shapes." },
  { t: "Play", d: "Canvas syncs audio & visemes with transport controls." },
];

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="rounded-2xl p-5 bg-[--bg-alt] ring-1 ring-white/5 open:bg-white/[0.02]">
      <summary className="cursor-pointer list-none flex items-center justify-between">
        <span className="font-medium">{q}</span>
        <span className="opacity-60">+</span>
      </summary>
      <p className="mt-3 text-sm opacity-80">{a}</p>
    </details>
  );
}
