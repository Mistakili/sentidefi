import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "SentinelFi Docs — MCP-Native Risk Infrastructure for EVM DeFi" },
      {
        name: "description",
        content:
          "How SentinelFi works: MCP server, risk scans, portfolio insight, and public dataset. Agent-callable safety infrastructure for HSK and every EVM.",
      },
      { property: "og:title", content: "SentinelFi Docs — MCP-Native Risk Infrastructure" },
      {
        property: "og:description",
        content:
          "The agent-callable safety layer for EVM DeFi. HSK-native, chain-agnostic, MCP-first — explained.",
      },
      { property: "og:type", content: "article" },
    ],
  }),
  component: DocsPage,
});

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "mcp", label: "MCP Server" },
  { id: "copilot", label: "The Copilot" },
  { id: "risk", label: "Risk Scans" },
  { id: "portfolio", label: "Portfolio Insight" },
  { id: "strategy", label: "Strategy Engine" },
  { id: "onchain", label: "Public Registry" },
  { id: "architecture", label: "Architecture" },
  { id: "chains", label: "Supported Chains" },
  { id: "positioning", label: "Why We're Different" },
  { id: "roadmap", label: "Roadmap" },
  { id: "faq", label: "FAQ" },
];

function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-primary">
            <span className="inline-block size-2 rounded-full bg-primary" /> SentinelFi
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/copilot" className="rounded-md bg-primary px-3 py-1.5 font-semibold text-primary-foreground hover:brightness-110">
              Launch Copilot →
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-14 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 text-sm">
            <div className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              Whitepaper
            </div>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded-md px-3 py-1.5 text-muted-foreground transition hover:bg-card hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <article className="prose prose-invert max-w-none prose-headings:scroll-mt-24 prose-h1:text-4xl prose-h2:mt-14 prose-h2:text-2xl prose-h3:mt-8 prose-h3:text-lg prose-p:text-foreground/85 prose-strong:text-foreground prose-code:rounded prose-code:bg-card prose-code:px-1.5 prose-code:py-0.5 prose-code:text-primary prose-code:font-normal prose-a:text-primary">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            v0.1 · Whitepaper
          </div>
          <h1>SentinelFi — MCP-Native Risk Infrastructure for EVM DeFi</h1>
          <p className="text-lg text-muted-foreground">
            The agent-callable safety layer for HSK, BotChain, and every EVM. One public MCP
            endpoint. Three read-only tools. Any wallet, protocol, or AI assistant plugs in
            in minutes — no SDK, no keys, no scraping.
          </p>

          <section id="overview">
            <h2>1. Overview</h2>
            <p>
              Every new chain has the same cold-start problem: wallets won't integrate without
              safety data; safety data doesn't exist without scanners; scanners don't build for
              small chains. Meanwhile the existing scanners (GoPlus, De.Fi, Honeypot.is) are
              websites, not protocols — nothing else can plug in.
            </p>
            <p>
              SentinelFi is built the opposite way: <strong>infrastructure first, UI second</strong>.
              The same engine that powers our Copilot ships as a public MCP server, so any
              wallet, launchpad, DEX, or AI assistant can call it directly. HSK is the launch
              chain; the architecture is chain-agnostic from day one.
            </p>
          </section>

          <section id="mcp">
            <h2>2. MCP Server</h2>
            <p>
              SentinelFi exposes a public <a href="/mcp"><code>/mcp</code></a> endpoint that
              speaks the Model Context Protocol. No auth. No API keys. Add the URL to Claude,
              ChatGPT, Cursor, Codex, or any MCP-aware client and three tools appear:
            </p>
            <ul>
              <li>
                <code>scan_token</code> — live on-chain read for any EVM contract: metadata,
                supply, contract-vs-EOA, bytecode size. Returns a compact structured verdict.
              </li>
              <li>
                <code>get_wallet_portfolio</code> — native + tracked ERC20 balances with USD
                values and total for any address on any supported chain.
              </li>
              <li>
                <code>list_recent_risk_scans</code> — the public verdict feed. Optional
                address filter. Score, level, summary, and tx hash.
              </li>
            </ul>
            <p>
              Every tool is <code>readOnlyHint: true</code> and touches only already-public
              data — safe to expose without login. Wallets can warn users pre-sign; launchpads
              can gate listings; AI assistants can answer "is this token safe?" natively.
            </p>
          </section>

          <section id="copilot">
            <h2>3. The Copilot</h2>
            <p>
              The Copilot is our reference client for the same tools that ship over MCP.
              It's a streaming LLM agent that routes intent automatically — token scans,
              wallet lookups, strategy suggestions — so users get the shortest path to an
              answer.
            </p>
            <h3>What you can ask</h3>
            <ul>
              <li>
                <strong>“Scan <code>0x…</code>”</strong> — risk analysis of any HSK token
                contract. Bare addresses default to a token scan.
              </li>
              <li>
                <strong>“Is <code>0x…</code> safe?”</strong> / “Audit this token” — same
                path, different phrasing.
              </li>
              <li>
                <strong>“Analyze my portfolio”</strong> — connected wallet holdings,
                USD values, concentration risk, stablecoin ratio.
              </li>
              <li>
                <strong>“Suggest a strategy”</strong> — 2–4 concrete actions
                (HOLD / BUY / SELL / SWAP / STAKE) with target allocations.
              </li>
              <li>
                <strong>“What is HSK?”</strong> / general DeFi questions — plain
                explanations grounded in what the Copilot can see on-chain.
              </li>
            </ul>
            <h3>How intent is routed</h3>
            <p>
              A bare <code>0x…</code> address is always treated as a{" "}
              <strong>token risk scan</strong>. To analyze a wallet, say “my wallet”,
              “my portfolio”, or connect a wallet first — the Copilot then knows your
              address without you pasting it.
            </p>
          </section>

          <section id="risk">
            <h2>3. Risk Scans</h2>
            <p>
              When you submit a token address, the Copilot calls{" "}
              <code>getTokenOnChainData</code> against an HSK RPC node and inspects:
            </p>
            <ul>
              <li>Whether the address is a contract or an EOA.</li>
              <li>ERC20 metadata: <code>name</code>, <code>symbol</code>, <code>decimals</code>, <code>totalSupply</code>.</li>
              <li>Bytecode size (a proxy signal for honeypots and stubs).</li>
              <li>Supply anomalies, missing standard methods, and unverifiable metadata.</li>
            </ul>
            <p>The model then produces a verdict:</p>
            <ul>
              <li>
                <strong>Score</strong> 0–100, and a <strong>Level</strong> of{" "}
                <code>LOW</code>, <code>MEDIUM</code>, <code>HIGH</code>, or{" "}
                <code>CRITICAL</code>.
              </li>
              <li>2–4 machine-readable <strong>reason codes</strong>.</li>
              <li>A plain-English summary and a clear recommendation.</li>
            </ul>
            <p>
              The verdict is written to a public feed and attested on-chain (see §6).
            </p>
          </section>

          <section id="portfolio">
            <h2>4. Portfolio Insight</h2>
            <p>
              With a connected wallet, the Copilot calls{" "}
              <code>getWalletPortfolio</code>, which reads native balance and tracked
              ERC20 balances for the active chain, prices them, and returns a compact
              holdings snapshot. The Copilot then narrates:
            </p>
            <ul>
              <li>Total USD value and per-token breakdown.</li>
              <li>
                <strong>Concentration risk</strong> — any single position above ~60%
                of the portfolio.
              </li>
              <li>
                <strong>Stablecoin ratio</strong> — how much dry powder you carry.
              </li>
              <li>Exposure to any token that has a HIGH/CRITICAL verdict on record.</li>
            </ul>
          </section>

          <section id="strategy">
            <h2>5. Strategy Engine</h2>
            <p>
              After a portfolio read, the Copilot can call <code>suggestStrategy</code>,
              which is rendered as an actionable card:
            </p>
            <ul>
              <li>A short title and a plain-English rationale.</li>
              <li>A risk level: <code>CONSERVATIVE</code>, <code>BALANCED</code>, or <code>AGGRESSIVE</code>.</li>
              <li>
                2–4 actions, each with a <code>kind</code> (HOLD / BUY / SELL / SWAP /
                STAKE), a token symbol, a target allocation %, and a one-line reason.
              </li>
            </ul>
            <p>
              Strategies are suggestions, not signed transactions. Execution flows
              (per-action Execute buttons that route to a DEX or staking contract) are
              on the roadmap.
            </p>
          </section>

          <section id="onchain">
            <h2>6. On-Chain Registry</h2>
            <p>
              Every finalized verdict is published to a <code>RiskRegistry</code>{" "}
              contract on HSK, keyed by the token address. Anyone — wallets, DEX
              front-ends, aggregators, other AI agents — can read the registry with a
              single <code>view</code> call before letting a user sign a swap.
            </p>
            <p>
              This is what makes SentinelFi <strong>infrastructure</strong>, not just
              another dashboard. Verdicts are attributable, composable, and
              censorship-resistant.
            </p>
          </section>

          <section id="architecture">
            <h2>7. Architecture</h2>
            <ul>
              <li>
                <strong>Frontend</strong> — TanStack Start (React 19, SSR, Vite 7),
                Tailwind v4, streaming AI SDK chat UI.
              </li>
              <li>
                <strong>Server functions</strong> — <code>createServerFn</code> for
                app-internal RPC; server routes under <code>/api/*</code> for
                streaming and webhooks.
              </li>
              <li>
                <strong>Wallet</strong> — EIP-1193 provider (MetaMask &amp; compatible),
                multi-chain aware, HSK by default.
              </li>
              <li>
                <strong>Data</strong> — direct JSON-RPC to HSK for balances,
                metadata, and bytecode. No third-party indexer required.
              </li>
              <li>
                <strong>AI</strong> — Lovable AI Gateway with tool calling; the model
                is bound to <em>read</em> tools plus <code>publishOnChain</code> and{" "}
                <code>saveRiskVerdict</code>.
              </li>
              <li>
                <strong>Public feed</strong> — verdicts stored in Lovable Cloud
                (Postgres + RLS) and streamed live to the landing page.
              </li>
            </ul>
          </section>

          <section id="chains">
            <h2>8. Supported Chains</h2>
            <p>
              SentinelFi is chain-agnostic at the code level. Adding a new EVM chain
              is a single entry in <code>src/lib/chains.ts</code>: chain id, RPC URL,
              explorer, and tracked tokens.
            </p>
            <ul>
              <li><strong>HSK Chain</strong> (chainId 177) — live.</li>
              <li><strong>HSK Testnet</strong> (chainId 133) — used for on-chain attestation.</li>
              <li>More EVM chains (including BotChain) — scaffolded, enable per launch.</li>
            </ul>
          </section>

          <section id="roadmap">
            <h2>9. Roadmap</h2>
            <ol>
              <li>Live risk scans + on-chain registry (shipped).</li>
              <li>Wallet portfolio + AI strategy suggestions (shipped).</li>
              <li>One-click strategy execution via HSK DEX router.</li>
              <li>Continuous monitoring: alerts when a held token’s verdict changes.</li>
              <li>
                Embeddable <code>&lt;SafeSwap /&gt;</code> component for other HSK
                dApps.
              </li>
              <li>Cross-chain portfolio view (BotChain and beyond).</li>
            </ol>
          </section>

          <section id="faq">
            <h2>10. FAQ</h2>
            <h3>Does SentinelFi ever move my funds?</h3>
            <p>
              No. The Copilot only reads on-chain data and produces recommendations.
              Any transaction still requires you to sign in your wallet.
            </p>
            <h3>Where do the risk scores come from?</h3>
            <p>
              From live on-chain data plus LLM reasoning against explicit heuristics
              (contract vs EOA, ERC20 conformance, bytecode size, supply anomalies).
              Scores are opinions, not guarantees — always DYOR.
            </p>
            <h3>Why is my token’s scan showing “Unknown”?</h3>
            <p>
              The contract either doesn’t implement standard ERC20 metadata calls, or
              the RPC didn’t return them. That itself is a risk signal.
            </p>
            <h3>Is this open source?</h3>
            <p>
              The scanning heuristics and registry contract will be published under a
              permissive license after the hackathon.
            </p>
          </section>

          <div className="mt-16 rounded-xl border border-primary/30 bg-primary/5 p-6 not-prose">
            <div className="text-[11px] uppercase tracking-widest text-primary">
              Ready?
            </div>
            <h3 className="mt-1 text-xl font-semibold">
              Try the Copilot on any HSK token
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Paste an address, ask about your portfolio, or request a strategy — the
              Copilot streams a verdict in seconds.
            </p>
            <Link
              to="/copilot"
              className="mt-4 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
            >
              Launch Copilot →
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}