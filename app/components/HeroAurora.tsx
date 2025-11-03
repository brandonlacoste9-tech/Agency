import { memo } from "react";

const HeroAurora = memo(function HeroAurora() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Aurora backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-[80vh] w-[90vw] rounded-full blur-3xl
                        bg-[radial-gradient(60%_60%_at_40%_40%,rgba(53,227,255,.28),transparent)]" />
        <div className="absolute -top-12 right-0 h-[70vh] w-[80vw] rounded-full blur-3xl
                        bg-[radial-gradient(60%_60%_at_60%_40%,rgba(124,77,255,.24),transparent)]" />
        <div className="absolute bottom-[-15%] left-1/2 -translate-x-1/2 h-[60vh] w-[90vw] rounded-full blur-3xl
                        bg-[radial-gradient(60%_60%_at_50%_50%,rgba(255,215,106,.22),transparent)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-12 md:pt-28">
        {/* Heading */}
        <div className="max-w-3xl">
          <p className="uppercase tracking-[0.25em] text-cyan-700/70 text-xs mb-3">AdGenXAI</p>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05]
                         text-transparent bg-clip-text
                         bg-gradient-to-r from-[#35E3FF] via-[#7C4DFF] to-[#FFD76A]">
            The Aurora Engine for Growth
          </h1>
          <p className="mt-4 text-black/70 text-lg">
            Generate ads and reels, refine with personas, and publish everywhere—automatically.
          </p>

        {/* Primary actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="#create"
              className="rounded-xl bg-[#35E3FF] text-[#071022] font-semibold px-6 py-3
                         hover:bg-[#29c7e1] transition-colors
                         shadow-[0_8px_40px_rgba(53,227,255,.35)]"
            >
              Start Creating
            </a>
            <a
              href="#features"
              className="rounded-xl border border-black/10 bg-black/5 px-6 py-3 text-black/80 hover:bg-black/[.07] transition-colors"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Hero image (placeholder SVG; swap to your final JPEG any time) */}
        <div className="mt-10 md:mt-14">
          <img
            src="/hero-aurora-studio@1792x1024.svg"
            alt="AdGenXAI studio with aurora backdrop and creator widgets"
            className="w-full rounded-2xl border border-black/10
                       shadow-[0_10px_60px_rgba(124,77,255,.2)]"
            loading="eager"
          />
        </div>

        {/* Export bar */}
        <div className="mt-6 flex items-center gap-3 text-sm text-black/70">
          <span className="px-2 py-1 rounded-full border border-black/10 bg-white/60">Export</span>
          <div className="flex gap-2">
            {["TikTok","Instagram","YouTube","X"].map(name => (
              <span key={name} className="rounded-xl border border-black/10 bg-white/70 px-3 py-1 hover:shadow
                                          hover:shadow-[0_0_24px_rgba(124,77,255,.20)] transition-all">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default HeroAurora;
