import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SentinelFi — AI Risk Copilot for HSK Chain DeFi" },
      { name: "description", content: "On-chain risk scores + an AI copilot that protects every swap on HSK Chain. The safety layer for HSK DeFi." },
      { property: "og:title", content: "SentinelFi — AI Risk Copilot for HSK Chain" },
      { property: "og:description", content: "On-chain risk scores + AI copilot that protects every swap on HSK Chain." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <TrustBar />
      <Problem />
      <HowItWorks />
      <Features />
      <ForBuilders />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2">
          <Shield className="size-6 text-primary" />
          <span className="text-base font-semibold tracking-tight">SentinelFi</span>
          <span className="ml-2 hidden rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary sm:inline">
            HSK Chain
          </span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#builders" className="hover:text-foreground transition">For builders</a>
        </nav>
        <a
          href="#cta"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--glow-gold)] transition hover:brightness-110"
        >
          Try the Copilot
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-border/40 bg-background"
    >
      <GridBg />
      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            HSK On-Chain Horizon Hackathon · DeFi × AI
          </div>
          <h1 className="mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            The safety layer for{" "}
            <span className="text-primary">
              HSK Chain DeFi
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            On-chain risk scores plus an AI copilot that reads contracts, simulates trades, and
            intervenes before you sign something you'll regret.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/copilot"
              className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Launch Copilot →
            </a>
            <a
              href="#how"
              className="rounded-md border border-border bg-card/60 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-card"
            >
              See how it works
            </a>
          </div>
        </div>

        <RiskCard />
      </div>
    </section>
  );
}

function RiskCard() {
  return (
    <div className="relative mx-auto mt-20 max-w-4xl">
      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20 blur-2xl" />
      <div className="rounded-3xl border border-border/80 bg-card/80 p-2 backdrop-blur-xl">
        <div className="rounded-2xl border border-border/60 bg-background/60 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Token risk report
              </div>
              <div className="mt-1 flex items-center gap-2 font-mono text-sm text-foreground/80">
                0x7f3a…b91e
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  HSK
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Risk Score
                </div>
                <div className="text-3xl font-bold text-destructive">82</div>
              </div>
              <span className="rounded-full bg-destructive/15 px-3 py-1 text-xs font-semibold text-destructive">
                HIGH RISK
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="LP locked" value="No" tone="bad" />
            <Stat label="Top holder" value="64%" tone="bad" />
            <Stat label="Verified" value="Yes" tone="good" />
            <Stat label="Mint fn" value="Found" tone="bad" />
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card/60 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="size-4" />
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                <span className="font-semibold text-primary">Copilot:</span> One wallet holds 64% of
                supply and the LP is unlocked — classic rug setup. I'd skip this. Want me to find a
                liquid, verified HSK alternative with similar exposure?
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" }) {
  const color = tone === "good" ? "text-emerald-400" : "text-destructive";
  return (
    <div className="rounded-lg border border-border bg-card/40 px-3 py-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function TrustBar() {
  return (
    <section className="border-b border-border/40 bg-background/60">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-10 md:grid-cols-4">
        {[
          ["$2.8B", "lost to DeFi exploits in 2024"],
          ["73%", "of new tokens fail safety checks"],
          ["0", "risk primitives native to HSK Chain"],
          ["<200ms", "Copilot pre-trade verdicts"],
        ].map(([n, l]) => (
          <div key={l} className="text-center">
            <div className="text-2xl font-bold text-primary md:text-3xl">{n}</div>
            <div className="mt-1 text-xs text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="border-b border-border/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              The problem
            </div>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              New chain. New tokens. <span className="text-muted-foreground">No safety net.</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              HSK Chain is growing fast — but users are flying blind. Honeypots, unlocked LPs, and
              concentrated whale supply look identical to legit projects in a wallet UI. The first
              loss is the last user.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Honeypots", "Sell function silently disabled"],
              ["Rug pulls", "Single wallet drains LP"],
              ["Mint abuse", "Hidden infinite-mint authority"],
              ["Phishing pairs", "Spoofed token tickers"],
            ].map(([t, d]) => (
              <div
                key={t}
                className="rounded-xl border border-border bg-card/60 p-4 transition hover:border-destructive/50"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="size-4 text-destructive" />
                  {t}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      t: "On-chain Risk Registry",
      d: "A public smart contract on HSK Chain stores tamper-proof risk scores and reason codes for every token, pool, and wallet. Any dApp can call getScore().",
    },
    {
      n: "02",
      t: "AI Copilot reasoning",
      d: "Lovable AI reads the score, simulates your trade, and explains the risk in plain language — with citations to the on-chain evidence.",
    },
    {
      n: "03",
      t: "Safe Swap intervention",
      d: "Our embeddable widget wraps any swap on HSK. It blocks dangerous trades, suggests safer alternatives, and only signs when you're protected.",
    },
  ];
  return (
    <section id="how" className="border-b border-border/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            How it works
          </div>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Three layers. One safety net.
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-6 transition hover:border-primary/40"
            >
              <div className="text-5xl font-bold text-primary/20 transition group-hover:text-primary/40">
                {s.n}
              </div>
              <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Shield, t: "Contract X-ray", d: "Detects honeypots, hidden mint, blacklist, and pause functions in seconds." },
    { icon: Activity, t: "Liquidity radar", d: "Tracks LP depth, lock status, and whale concentration in real time." },
    { icon: Sparkles, t: "AI explanations", d: "Plain-English reasoning with on-chain citations — not a black box." },
    { icon: Zap, t: "Pre-trade sim", d: "Quotes slippage, price impact, and tax before you sign the transaction." },
    { icon: Code, t: "Public primitive", d: "Any HSK dApp reads risk scores from our on-chain registry — for free." },
    { icon: AlertTriangle, t: "Live alerts", d: "Watchlist any token; get pinged the moment its risk profile shifts." },
  ];
  return (
    <section id="features" className="border-b border-border/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            What you get
          </div>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Infrastructure, not another dashboard.
          </h2>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {items.map(({ icon: Icon, t, d }) => (
            <div key={t} className="bg-card/80 p-6 transition hover:bg-card">
              <Icon className="size-6 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForBuilders() {
  return (
    <section id="builders" className="border-b border-border/40 bg-card/30">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              For HSK builders
            </div>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Drop in safety. Ship in an hour.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Wrap any swap, route, or onboarding flow with a single React component or a single
              Solidity call. SentinelFi handles the rest.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "<SafeSwap /> widget — works with any HSK DEX",
                "getScore(address) — public on-chain registry",
                "REST + WebSocket feeds for off-chain bots",
                "No fees on reads. Ever.",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-foreground/90">{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-[#0b1020] shadow-[var(--glow-cyan)]">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <span className="size-2.5 rounded-full bg-destructive/70" />
              <span className="size-2.5 rounded-full bg-primary/70" />
              <span className="size-2.5 rounded-full bg-emerald-500/70" />
              <span className="ml-2 text-xs text-muted-foreground">SafeSwap.tsx</span>
            </div>
            <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed">
              <code className="font-mono">
                <span className="text-pink-400">import</span>{" "}
                <span className="text-foreground">{"{ SafeSwap }"}</span>{" "}
                <span className="text-pink-400">from</span>{" "}
                <span className="text-emerald-300">"@sentinelfi/react"</span>;
                {"\n\n"}
                <span className="text-pink-400">export default function</span>{" "}
                <span className="text-cyan-300">SwapPage</span>() {"{"}
                {"\n  "}
                <span className="text-pink-400">return</span> (
                {"\n    "}
                <span className="text-foreground">{"<SafeSwap"}</span>
                {"\n      "}
                <span className="text-primary">chain</span>=
                <span className="text-emerald-300">"hsk"</span>
                {"\n      "}
                <span className="text-primary">onBlock</span>={"{"}(r) ={">"} alert(r.reason){"}"}
                {"\n    "}
                <span className="text-foreground">{"/>"}</span>
                {"\n  "});
                {"\n}"}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="cta" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ backgroundImage: "var(--gradient-hero)" }} />
      <div className="mx-auto max-w-4xl px-6 py-28 text-center">
        <h2 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
          Make HSK Chain the{" "}
          <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
            safest place to trade.
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Try the Copilot on any HSK token. Free during the hackathon, free forever for readers.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--glow-gold)] transition hover:brightness-110">
            Launch Copilot →
          </button>
          <button className="rounded-md border border-border bg-card/60 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-card">
            Read the docs
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-primary" />
          <span className="font-semibold text-foreground">SentinelFi</span>
          <span>· Built for HSK On-Chain Horizon Hackathon 2026</span>
        </div>
        <div className="flex gap-5">
          <a href="#how" className="hover:text-foreground">Docs</a>
          <a href="#features" className="hover:text-foreground">GitHub</a>
          <a href="#cta" className="hover:text-foreground">Twitter</a>
        </div>
      </div>
    </footer>
  );
}

function GridBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08]"
      style={{
        backgroundImage:
          "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
      }}
    />
  );
}

/* ---------- inline icons (avoid extra deps) ---------- */
type IconProps = { className?: string };
function Shield({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function Sparkles({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}
function AlertTriangle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}
function Activity({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
function Zap({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
function Code({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  );
}
function Check({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
