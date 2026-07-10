import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WalletButton } from "@/components/WalletButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SentinelFi — MCP-Native Risk Infrastructure for EVM DeFi" },
      { name: "description", content: "Agent-callable safety layer for HSK, BotChain, and every EVM. One MCP endpoint, three read-only tools: any wallet, protocol, or AI can plug in in minutes." },
      { property: "og:title", content: "SentinelFi — MCP-Native Risk Infrastructure" },
      { property: "og:description", content: "The agent-callable safety layer for EVM DeFi. HSK-native, chain-agnostic, MCP-first." },
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
      <WhyNow />
      <MetricsStrip />
      <BuiltFor />
      <Problem />
      <HowItWorks />
      <Features />
      <ForBuilders />
      <Roadmap />
      <LiveFeed />
      <CTA />
      <Footer />
    </div>
  );
}

type Scan = {
  id: string;
  address: string;
  score: number;
  level: string;
  token_name: string | null;
  token_symbol: string | null;
  summary: string | null;
  created_at: string;
  tx_hash: string | null;
};

function LiveFeed() {
  const [scans, setScans] = useState<Scan[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("risk_scans")
        .select("id,address,score,level,token_name,token_symbol,summary,created_at,tx_hash")
        .order("created_at", { ascending: false })
        .limit(6);
      if (!cancelled) setScans((data as Scan[] | null) ?? []);
    };
    load();
    const channel = supabase
      .channel("risk_scans_feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "risk_scans" }, () => load())
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="border-y border-border/40 bg-card/20 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE FEED
            </div>
            <h2 className="text-3xl font-bold md:text-4xl">Recently scanned on HSK Chain</h2>
            <p className="mt-2 text-muted-foreground">Every Copilot verdict is published to a public registry. Anyone can read it. Any dApp can integrate it.</p>
          </div>
        </div>

        {scans === null ? (
          <div className="text-sm text-muted-foreground">Loading feed…</div>
        ) : scans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-background/40 p-10 text-center text-sm text-muted-foreground">
            No scans yet. <a href="/copilot" className="text-primary underline-offset-4 hover:underline">Be the first to run a scan →</a>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {scans.map((s) => (
              <ScanCard key={s.id} scan={s} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ScanCard({ scan }: { scan: Scan }) {
  const color =
    scan.level === "LOW"
      ? "text-emerald-400"
      : scan.level === "MEDIUM"
      ? "text-amber-400"
      : "text-destructive";
  const bg =
    scan.level === "LOW"
      ? "bg-emerald-400/15"
      : scan.level === "MEDIUM"
      ? "bg-amber-400/15"
      : "bg-destructive/15";
  const when = new Date(scan.created_at);
  const ago = timeAgo(when);
  return (
    <a
      href="/copilot"
      className="group rounded-xl border border-border bg-background/60 p-4 transition hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {scan.token_name || "Unknown token"}{" "}
            {scan.token_symbol && <span className="text-muted-foreground">({scan.token_symbol})</span>}
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            {scan.address.slice(0, 10)}…{scan.address.slice(-6)}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${color}`}>{scan.score}</div>
          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${color} ${bg}`}>{scan.level}</span>
        </div>
      </div>
      {scan.summary && (
        <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{scan.summary}</p>
      )}
      <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{ago}</span>
        {scan.tx_hash && (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono normal-case text-emerald-400">
            on-chain ✓
          </span>
        )}
      </div>
    </a>
  );
}

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2">
          <Shield className="size-6 text-primary" />
          <span className="text-base font-semibold tracking-tight">SentinelFi</span>
          <span className="ml-2 hidden rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary sm:inline">
            MCP · EVM
          </span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="/portfolio" className="hover:text-foreground transition">Portfolio</a>
          <a href="/copilot" className="hover:text-foreground transition">Copilot</a>
        </nav>
        <WalletButton />
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
            HSK On-Chain Horizon · MCP-native · Chain-agnostic
          </div>
          <h1 className="mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Give your AI{" "}
            <span className="text-primary">eyes</span>{" "}
            before you give it keys.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            SentinelFi is the public risk <span className="text-foreground">infrastructure</span> AI
            agents call before they touch any EVM protocol. One MCP endpoint. Three read-only tools.
            HSK-native. Chain-agnostic.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/copilot"
              className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Launch Copilot →
            </a>
            <a
              href="#builders"
              className="rounded-md border border-border bg-card/60 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-card"
            >
              Connect via MCP
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
      <div className="absolute inset-0 -z-10 rounded-3xl bg-primary/5" />
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
          ["1 endpoint", "/mcp — public, no login, no key"],
          ["3 tools", "scan · portfolio · scan history"],
          ["Any EVM", "HSK live · BotChain-ready · chain-agnostic"],
          ["Any agent", "Claude · ChatGPT · Cursor · Codex"],
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
              New chains ship faster than <span className="text-muted-foreground">safety tools can follow.</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              GoPlus, De.Fi, Honeypot.is — none cover HSK. And every one of them is a website,
              not a protocol. Wallets, launchpads, and AI agents can't plug in. Users fly blind,
              builders reinvent the same scanner, chains stay cold. SentinelFi fixes all three
              with one shared primitive.
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
      t: "Public risk registry",
      d: "Every Copilot verdict is written to a public dataset with a tx hash. Anyone can query the history; any dApp can gate on it. Trust that's inspectable, not implied.",
    },
    {
      n: "02",
      t: "AI Copilot reasoning",
      d: "The Copilot reads on-chain evidence, scores it, and explains the risk in plain language with citations — so users learn why, not just what.",
    },
    {
      n: "03",
      t: "MCP delivery layer",
      d: "The same engine ships as an MCP server. Claude, ChatGPT, Cursor, wallets, and protocols call scan_token, get_wallet_portfolio, and list_recent_risk_scans — no SDK, no scraping.",
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
    { icon: Code, t: "MCP-native", d: "Public /mcp endpoint. Zero-auth read tools. Any AI assistant connects in seconds — no SDK to maintain." },
    { icon: Shield, t: "Contract X-ray", d: "Bytecode, supply, ownership, contract-vs-EOA, and mint surface — enough signal to catch the obvious traps today." },
    { icon: Activity, t: "Chain-agnostic core", d: "A single chains.ts registry. HSK is live; BotChain and any EVM drop in with an RPC and a token list." },
    { icon: Sparkles, t: "Explainable verdicts", d: "Plain-English reasoning with citations to the on-chain evidence. No black-box score — auditable by users and integrators." },
    { icon: AlertTriangle, t: "Public dataset", d: "Every scan is written to a public feed with score, level, and tx hash. Wallets, dashboards, and researchers can consume it directly." },
    { icon: Zap, t: "Copilot UX", d: "The same tools, wrapped in a conversational agent that routes wallet lookups, token scans, and history queries automatically." },
  ];
  return (
    <section id="features" className="border-b border-border/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Why SentinelFi is different
          </div>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Infrastructure. Not another dashboard.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            Scanners are destinations users visit. Infrastructure is a dependency other products
            build on. SentinelFi is built to be the second.
          </p>
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
              For wallets, protocols & agents
            </div>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              One MCP URL. Ship safety in an afternoon.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Wallets warn users before they sign. Launchpads gate listings on a risk floor.
              DEXs flag risky pairs at the pool level. AI assistants answer "is this token
              safe?" natively. All from the same public endpoint — no SDK, no keys, no scraping.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "scan_token — risk verdict for any EVM contract",
                "get_wallet_portfolio — balances + USD, all tracked assets",
                "list_recent_risk_scans — the public verdict feed",
                "Zero auth. Zero rate-limit friction. Free reads, forever.",
              ].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-foreground/90">{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-[#0b1020]">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <span className="size-2.5 rounded-full bg-destructive/70" />
              <span className="size-2.5 rounded-full bg-primary/70" />
              <span className="size-2.5 rounded-full bg-emerald-500/70" />
              <span className="ml-2 text-xs text-muted-foreground">connect.mcp</span>
            </div>
            <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed">
              <code className="font-mono">
                <span className="text-muted-foreground"># Claude / ChatGPT / Cursor / any MCP client</span>
                {"\n"}
                <span className="text-muted-foreground"># Add server URL:</span>
                {"\n"}
                <span className="text-emerald-300">https://sentidefi.lovable.app/mcp</span>
                {"\n\n"}
                <span className="text-muted-foreground"># Then just ask:</span>
                {"\n"}
                <span className="text-cyan-300">{"> scan token 0x7f3a…b91e on HSK"}</span>
                {"\n"}
                <span className="text-foreground">{"→ score: 82  HIGH RISK"}</span>
                {"\n"}
                <span className="text-foreground">{"  reason: unlocked LP, 64% top holder"}</span>
                {"\n\n"}
                <span className="text-cyan-300">{"> what's in wallet 0xb9C5…Ded66?"}</span>
                {"\n"}
                <span className="text-foreground">{"→ HSK: 12.4  USDT: 830  total $1,204"}</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function Roadmap() {
  const shipped = [
    "Public MCP server with 3 read-only tools",
    "HSK-native on-chain reads (name, supply, bytecode, contract vs EOA)",
    "Chain-agnostic registry (chains.ts) — new EVMs drop in fast",
    "Copilot with intent routing (token vs wallet vs history)",
    "Public risk-scan dataset with tx-hash provenance",
  ];
  const next = [
    { t: "Deeper scoring", d: "Liquidity locks, ownership renouncement, mint / blacklist / pause detection, tax + honeypot simulation." },
    { t: "Behavioral signals", d: "Whale-movement patterns, deployer history, rug-pattern matching across the public dataset." },
    { t: "Open methodology", d: "Scoring rules published as versioned, auditable rulesets — so integrating protocols can trust and challenge the verdict." },
    { t: "Multi-chain rollout", d: "BotChain, Base, BSC, and any HSK-adjacent EVM the ecosystem asks for — same MCP surface, wider coverage." },
  ];
  return (
    <section id="roadmap" className="border-b border-border/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Honest roadmap
          </div>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            What ships today. What ships next.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            We'd rather name the gaps than paper over them. Here's exactly where SentinelFi is,
            and where the next milestones land.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Shipped
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              {shipped.map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  <span className="text-foreground/90">{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Next
            </div>
            <ul className="mt-4 space-y-4 text-sm">
              {next.map((n) => (
                <li key={n.t}>
                  <div className="font-semibold text-foreground">{n.t}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{n.d}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="cta" className="relative overflow-hidden bg-card/30">
      <div className="mx-auto max-w-4xl px-6 py-28 text-center">
        <h2 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
          Make every EVM chain the{" "}
          <span className="text-primary">
            safest place to trade.
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Try the Copilot. Or point your favorite AI assistant at{" "}
          <span className="font-mono text-foreground">sentidefi.lovable.app/mcp</span>{" "}
          and start asking.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a href="/copilot" className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
            Launch Copilot →
          </a>
          <a href="/docs" className="rounded-md border border-border bg-card/60 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-card">
            Read the docs
          </a>
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
          <a href="/docs" className="hover:text-foreground">Docs</a>
          <a href="https://github.com/mistakili" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a>
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
