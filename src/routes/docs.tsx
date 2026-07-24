import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "SentinelFi Docs — Trust infrastructure for BotChain & autonomous agents" },
      {
        name: "description",
        content:
          "Integrate the SentinelFi Trust Protocol on BotChain mainnet: REST Trust API, MCP tools, signed Safety Attestations, and on-chain RiskRegistry. One call before every autonomous transaction.",
      },
      { property: "og:title", content: "SentinelFi Docs — BotChain Trust Protocol" },
      {
        property: "og:description",
        content:
          "MCP-native trust layer for BotChain. Mainnet RiskRegistry live. Signed verdicts agents can verify.",
      },
      { property: "og:type", content: "article" },
    ],
  }),
  component: DocsPage,
});

const SECTIONS = [
  { id: "quickstart", label: "5-minute quickstart" },
  { id: "why", label: "Why SentinelFi" },
  { id: "trust-api", label: "Trust API" },
  { id: "mcp", label: "MCP for agents" },
  { id: "registry", label: "RiskRegistry (mainnet)" },
  { id: "attestation", label: "Safety Attestations" },
  { id: "scoring", label: "Scoring (v1)" },
  { id: "chains", label: "Supported chains" },
  { id: "integrate", label: "Who integrates" },
  { id: "roadmap", label: "Roadmap" },
  { id: "faq", label: "FAQ" },
];

const MAINNET_REGISTRY = "0x9De70CA7Aa0BC1CEA1fBa33A1A7510A95B1c9883";
const DEPLOY_TX = "0xfa95a598d1ca87558b64e496dbcc1d8d2d47c3179584e704a0665f0ef7b424a8";
const ANCHOR_TX = "0xb2ac918261773f7a3041bb0a8c0794fa4fa4b0637beb60c83ec5af7f98329097";

function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-primary">
            <span className="inline-block size-2 rounded-full bg-primary" /> SentinelFi
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/demo" className="text-muted-foreground hover:text-foreground">
              Live demo
            </Link>
            <Link
              to="/demo"
              className="rounded-md bg-primary px-3 py-1.5 font-semibold text-primary-foreground hover:brightness-110"
            >
              Try mainnet →
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-14 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 text-sm">
            <div className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              Integration guide
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
          <div className="mb-3 flex flex-wrap gap-2 not-prose">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
              ● BotChain Mainnet live · chainId 677
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              MCP · REST · On-chain
            </span>
          </div>
          <h1>The trust layer BotChain agents call before every transaction</h1>
          <p className="text-lg text-muted-foreground">
            SentinelFi is MCP-native risk infrastructure for autonomous finance. One public
            call returns a clear recommendation (Proceed / Caution / Review / Block), a Trust
            Grade, and a cryptographically signed Safety Attestation — optionally anchored on
            BotChain mainnet so anyone can verify it forever.
          </p>

          <div className="not-prose my-8 grid gap-3 sm:grid-cols-3">
            {[
              { k: "Mainnet registry", v: "Deployed", d: "RiskRegistry on 677" },
              { k: "Agent surface", v: "MCP + REST", d: "Zero-auth read tools" },
              { k: "Proof", v: "Signed + anchored", d: "Attestation anyone can verify" },
            ].map((c) => (
              <div key={c.k} className="rounded-xl border border-border bg-card/60 p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.k}</div>
                <div className="mt-1 text-lg font-bold text-primary">{c.v}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{c.d}</div>
              </div>
            ))}
          </div>

          <section id="quickstart">
            <h2>5-minute quickstart (BotChain Mainnet)</h2>
            <p>
              <strong>Three lines of code. One trust decision. Before every autonomous transaction.</strong>
            </p>
            <pre><code>{`const res = await fetch("https://sentidefi.lovable.app/api/v1/trust/check", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    chainId: 677,              // BotChain Mainnet
    action: "swap",
    contract: "0x…",           // target contract
    agentId: "my-agent",
    anchor: true,              // write attestation hash on-chain
  }),
});
const verdict = await res.json();
if (verdict.recommendation === "Block") throw new Error("Unsafe");
// proceed with tx — attach verdict.attestation.receiptId to your audit log`}</code></pre>
            <p>
              No API key. No SDK required. Same call works over{" "}
              <a href="#mcp">MCP</a> as tool <code>check_trust</code>.
            </p>
            <p>
              <Link to="/demo">→ Run it live on /demo</Link>
            </p>
          </section>

          <section id="why">
            <h2>Why this exists — and why BotChain needs it</h2>
            <p>
              Autonomous agents and wallets execute in milliseconds. Existing scanners
              (GoPlus, De.Fi, Honeypot.is) are <strong>websites for humans</strong> — nothing
              else can plug in, and no verdict is cryptographically attributable after the fact.
            </p>
            <p>
              Every new chain hits the same cold-start problem: wallets won't integrate without
              safety data; safety data doesn't exist without scanners; scanners don't prioritize
              young ecosystems. <strong>BotChain shouldn't wait</strong> for that cycle.
            </p>
            <p>
              SentinelFi flips the model: <strong>infrastructure first</strong>. The same engine
              powers a public REST Trust API, a public MCP server, and a mainnet{" "}
              <code>RiskRegistry</code>. Agents, wallets, launchpads, and explorers share one
              primitive.
            </p>
            <ul>
              <li>
                <strong>Agent-native.</strong> MCP is first-class — Claude, Cursor, Codex, and
                custom agent runtimes call <code>check_trust</code> without scrapers or keys.
              </li>
              <li>
                <strong>Provable.</strong> Every check returns a signed Safety Attestation;
                optional on-chain anchor on BotChain mainnet.
              </li>
              <li>
                <strong>Composable.</strong> One HTTP call. Branch on{" "}
                <code>recommendation</code>. Log the grade. Keep the attestation.
              </li>
            </ul>
          </section>

          <section id="trust-api">
            <h2>Trust API</h2>
            <p>
              <strong>Endpoint:</strong>{" "}
              <code>POST https://sentidefi.lovable.app/api/v1/trust/check</code> — public, no auth.
            </p>
            <h3>Request (mainnet)</h3>
            <pre><code>{`curl -X POST https://sentidefi.lovable.app/api/v1/trust/check \\
  -H "content-type: application/json" \\
  -d '{
    "chainId": 677,
    "action": "swap",
    "contract": "0x0000000000000000000000000000000000000001",
    "agentId": "botchain-partner-demo",
    "anchor": true
  }'`}</code></pre>
            <h3>Response shape</h3>
            <pre><code>{`{
  "recommendation": "Block",
  "trustGrade": "D",
  "verdict": "BLOCK",
  "safe": false,
  "riskScore": 60,
  "severity": "HIGH",
  "confidence": 60,
  "chainId": 677,
  "checks": { "isContract": false, "hasERC20Metadata": false, ... },
  "reasoning": ["Target address is an EOA, not a contract."],
  "attestation": {
    "receiptId": "…",
    "issuedAt": "…Z",
    "chainId": 677,
    "attestor": "0x7D9640ed408b74f1Eb8B745032A4683b25bDd955",
    "reasoningHash": "0x…",
    "signature": "0x…"
  },
  "anchor": {
    "status": "anchored",
    "chainId": 677,
    "txHash": "0x…",
    "registry": "${MAINNET_REGISTRY}",
    "explorerUrl": "https://scan.botchain.ai/tx/0x…"
  }
}`}</code></pre>
            <h3>Branch on recommendation</h3>
            <p>
              Agents should branch on <code>recommendation</code>, not raw score:
            </p>
            <ul>
              <li><code>Proceed</code> — execute</li>
              <li><code>Proceed with Caution</code> — execute with limits / UI warning</li>
              <li><code>Manual Review Required</code> — escalate to human</li>
              <li><code>Block</code> — refuse the transaction</li>
            </ul>
            <p>
              Trust Grade (A–F) is the chip you render in a wallet or explorer. Score 0–100 is
              for analytics and ranking.
            </p>
          </section>

          <section id="mcp">
            <h2>MCP for agents</h2>
            <p>
              Point any MCP client at{" "}
              <code>https://sentidefi.lovable.app/mcp</code>. Tools appear automatically:
            </p>
            <ul>
              <li>
                <code>check_trust</code> — <strong>primary</strong>. Full trust checkpoint for
                chainId <strong>677</strong> (mainnet), 968 (testnet), 177 (HSK).
              </li>
              <li>
                <code>scan_token</code> — raw on-chain metadata / contract-vs-EOA.
              </li>
              <li>
                <code>get_wallet_portfolio</code> — balances + USD values on supported chains.
              </li>
              <li>
                <code>list_recent_risk_scans</code> — public verdict feed.
              </li>
            </ul>
            <p>
              REST companion for scripts and audits:{" "}
              <code>GET /.mcp/list-tools</code> ·{" "}
              <code>POST /.mcp/invoke-tool/check_trust</code>
            </p>
            <pre><code>{`curl -s -X POST https://sentidefi.lovable.app/.mcp/invoke-tool/check_trust \\
  -H "content-type: application/json" \\
  -d '{"chainId":677,"action":"swap","contract":"0x…","agentId":"cli","anchor":false}'`}</code></pre>
          </section>

          <section id="registry">
            <h2>RiskRegistry — live on BotChain Mainnet</h2>
            <p>
              This is what makes SentinelFi <strong>infrastructure</strong>, not a dashboard.
              Attestations can be written on-chain so explorers, wallets, and third parties
              can prove a check ran without calling us again.
            </p>
            <div className="not-prose overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <tbody>
                  {[
                    ["Network", "BotChain Mainnet"],
                    ["Chain ID", "677"],
                    ["RPC", "https://rpc.botchain.ai"],
                    ["Contract", MAINNET_REGISTRY],
                    ["Deploy tx", DEPLOY_TX],
                    ["Sample anchor", ANCHOR_TX],
                    ["Explorer", `https://scan.botchain.ai/address/${MAINNET_REGISTRY}`],
                  ].map(([k, v]) => (
                    <tr key={k} className="border-b border-border/60">
                      <td className="whitespace-nowrap px-4 py-2 font-semibold text-muted-foreground">{k}</td>
                      <td className="break-all px-4 py-2 font-mono text-xs text-foreground">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              Key methods: <code>anchorAttestation(bytes32,bytes32)</code>,{" "}
              <code>attestationOf</code>, <code>publish</code>, <code>riskOf</code>,{" "}
              <code>quickCheck</code>, <code>requireSafe</code>.
            </p>
            <p>
              Source:{" "}
              <a href="https://github.com/Mistakili/sentidefi/blob/main/contracts/RiskRegistry.sol">
                contracts/RiskRegistry.sol
              </a>
              . Testnet (968) also live at the same CREATE address for parity.
            </p>
          </section>

          <section id="attestation">
            <h2>Safety Attestations</h2>
            <p>
              Every check returns a signed attestation over a stable canonical payload plus a{" "}
              <code>keccak256</code> of the reasoning array. Anyone with the attestor address can
              verify offline — no chain call required for the signature itself.
            </p>
            <pre><code>{`// Attestor (mainnet + testnet)
0x7D9640ed408b74f1Eb8B745032A4683b25bDd955

// With anchor:true, payload hash is written via RiskRegistry.anchorAttestation`}</code></pre>
            <p>
              That is the proof due diligence occurred <em>before</em> the agent signed.
            </p>
          </section>

          <section id="scoring">
            <h2>Scoring (v1) — honest and open</h2>
            <p>
              Phase-1 heuristics are deliberately small, explainable, and live on BotChain RPC:
            </p>
            <ul>
              <li>Contract vs EOA</li>
              <li>ERC20 metadata completeness (name / symbol / decimals / supply)</li>
              <li>Bytecode size (stub / proxy signal)</li>
              <li>Structured Trust Grade + recommendation</li>
            </ul>
            <p>
              We are <strong>not</strong> claiming GoPlus-depth honeypot simulation today.
              We are shipping the <em>protocol surface</em> and the on-chain anchor first —
              so BotChain agents and wallets can integrate now while scoring depth compounds.
            </p>
            <p>
              <em>Next:</em> liquidity locks, ownership renouncement, mint/blacklist/pause,
              honeypot + tax simulation, deployer history, open versioned rulesets.
            </p>
          </section>

          <section id="chains">
            <h2>Supported chains</h2>
            <ul>
              <li>
                <strong>BotChain Mainnet</strong> (677) — production. RPC{" "}
                <code>https://rpc.botchain.ai</code>. RiskRegistry live.
              </li>
              <li>
                <strong>BotChain Testnet</strong> (968) — RPC{" "}
                <code>https://rpc.bohr.life</code>. Same registry interface.
              </li>
              <li>
                <strong>HSK Chain</strong> (177) — live portfolio + scan surface.
              </li>
              <li>
                <strong>Any EVM</strong> — drop-in via <code>src/lib/chains.ts</code> + adapter.
              </li>
            </ul>
          </section>

          <section id="integrate">
            <h2>Who integrates — and what they get</h2>
            <ul>
              <li>
                <strong>AI agents / MCP clients</strong> — native pre-tx gate. Refuse unsafe
                swaps without human UI.
              </li>
              <li>
                <strong>Wallets</strong> — pre-sign warning chip (grade + recommendation) in
                one round-trip.
              </li>
              <li>
                <strong>Launchpads / DEXs</strong> — listing gate and pool flagging from a
                shared primitive.
              </li>
              <li>
                <strong>Explorers</strong> — ✓ SentinelFi Verified badge next to txs that
                carry a receiptId / on-chain anchor.
              </li>
              <li>
                <strong>Chains</strong> — instant safety infra so ecosystems don't stay cold
                waiting for legacy scanners.
              </li>
            </ul>
            <p>
              Badge &amp; product language: <Link to="/verified">/verified</Link>
            </p>
          </section>

          <section id="roadmap">
            <h2>Roadmap</h2>
            <h3>Shipped</h3>
            <ul>
              <li>Public MCP + Trust API with signed Safety Attestations</li>
              <li>
                <strong>BotChain Mainnet RiskRegistry</strong> — deploy + live anchors
              </li>
              <li>BotChain Testnet parity (968)</li>
              <li>Chain-agnostic adapters · public verdict feed · Copilot reference client</li>
            </ul>
            <h3>Next</h3>
            <ul>
              <li>Deeper scoring (locks, ownership, honeypot/tax sim)</li>
              <li>Behavioral signals (deployer history, rug patterns)</li>
              <li>Open, versioned scoring rulesets</li>
              <li>Continuous monitoring &amp; alerts</li>
              <li>Broader multi-chain surface on the same MCP endpoint</li>
            </ul>
          </section>

          <section id="faq">
            <h2>FAQ</h2>
            <h3>Is BotChain mainnet really live?</h3>
            <p>
              Yes. RiskRegistry at <code>{MAINNET_REGISTRY}</code>, chainId 677. Deploy and
              anchor txs are public on scan.botchain.ai.
            </p>
            <h3>How do I connect Claude / Cursor / Codex?</h3>
            <p>
              Add <code>https://sentidefi.lovable.app/mcp</code> as an MCP server. Tools
              appear with no keys.
            </p>
            <h3>Does SentinelFi move funds?</h3>
            <p>
              Never. Read-only tools and signed opinions. Users still sign in their wallet.
            </p>
            <h3>Why should we trust the score?</h3>
            <p>
              You shouldn't blind-trust any score. You should trust the{" "}
              <em>process</em>: live chain reads, explicit reasoning, cryptographic
              attestation, optional on-chain anchor. Scoring depth is v1 and expanding —
              the protocol surface is ready for partners now.
            </p>
            <h3>Is the code public?</h3>
            <p>
              Yes —{" "}
              <a href="https://github.com/Mistakili/sentidefi">
                github.com/Mistakili/sentidefi
              </a>
              .
            </p>
          </section>

          <div className="mt-16 rounded-xl border border-primary/30 bg-primary/5 p-6 not-prose">
            <div className="text-[11px] uppercase tracking-widest text-primary">
              For BotChain partners
            </div>
            <h3 className="mt-1 text-xl font-semibold">
              Make every autonomous BotChain tx pass through a trust check
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Mainnet registry is live. API and MCP are public. Integrate in an afternoon —
              or list us as the recommended pre-tx checkpoint for agents on chain 677.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/demo"
                className="inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
              >
                Run mainnet demo →
              </Link>
              <a
                href="https://github.com/Mistakili/sentidefi"
                className="inline-block rounded-md border border-border bg-card/60 px-5 py-2.5 text-sm font-semibold hover:bg-card"
              >
                View GitHub
              </a>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
