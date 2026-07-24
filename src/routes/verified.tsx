import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, CheckCircle2, Code2 } from "lucide-react";

export const Route = createFileRoute("/verified")({
  head: () => ({
    meta: [
      { title: "SentinelFi Verified — Trust standard for AI agents on BotChain" },
      {
        name: "description",
        content:
          "SentinelFi Verified is the trust checkpoint every AI agent, wallet, and protocol runs before executing on BotChain. Signed Safety Attestations, a public Trust Grade, and a badge you can display.",
      },
      { property: "og:title", content: "SentinelFi Verified — the trust standard for BotChain" },
      { property: "og:type", content: "website" },
      {
        property: "og:description",
        content: "The trust standard for AI agents on BotChain. One check. One signed attestation. One badge.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Verified,
});

function Verified() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-sm font-semibold tracking-tight">SentinelFi</Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/docs" className="hover:text-foreground">Docs</Link>
            <Link to="/demo" className="hover:text-foreground">Demo</Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-border/40">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            <ShieldCheck className="size-3.5" />
            SentinelFi Verified · v1
          </div>
          <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            The trust standard for AI agents on BotChain.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            One trust check before every autonomous transaction on{" "}
            <strong className="text-foreground">BotChain Mainnet (677)</strong>. One signed
            Safety Attestation anchored on the live RiskRegistry. One badge every wallet,
            launchpad, and explorer can display:{" "}
            <strong className="text-foreground">✓ SentinelFi Verified</strong>.
          </p>
          <p className="mx-auto mt-4 max-w-xl font-mono text-xs text-muted-foreground">
            Registry {`0x9De70CA7Aa0BC1CEA1fBa33A1A7510A95B1c9883`}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/demo" className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:brightness-110">
              Run mainnet demo →
            </Link>
            <Link to="/docs" className="rounded-md border border-border bg-card/60 px-6 py-3 text-sm font-semibold hover:bg-card">
              Integration docs
            </Link>
          </div>
          <div className="mt-14 flex justify-center">
            <img src="/api/v1/verified/badge.svg?grade=A" alt="SentinelFi Verified — Grade A" width={260} height={40} />
          </div>
        </div>
      </section>

      <section className="border-b border-border/40">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <ol className="mt-8 space-y-6 text-base">
            {[
              { t: "AI agent prepares a transaction on BotChain", d: "Swap, approval, transfer, or arbitrary contract call — anything that would touch chain state." },
              { t: "Agent calls the SentinelFi Trust Protocol", d: "POST /api/v1/trust/check with chainId, action, and target contract. Returns a Trust Grade and recommendation in one round-trip." },
              { t: "Safety Attestation is signed and anchored", d: "SentinelFi signs the verdict off-chain and anchors the attestation hash to the BotChain RiskRegistry — provable to anyone, at any time." },
              { t: "Agent branches on the recommendation", d: "Proceed → execute. Manual Review Required → escalate. Block → refuse. The attestation is attached to the transaction record." },
              { t: "Wallets and explorers display the badge", d: "Any UI can query the RiskRegistry (or the receiptId) and render ✓ SentinelFi Verified next to the transaction." },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-4 rounded-2xl border border-border bg-card/60 p-5">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">{i + 1}</div>
                <div>
                  <div className="font-semibold">{s.t}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-border/40">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight">Rules to display the badge</h2>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "A live SentinelFi Trust Check ran against the exact contract and action being displayed.",
              "The returned recommendation is Proceed OR the integrator displays the exact returned recommendation and grade.",
              "The Safety Attestation is retrievable by receiptId (off-chain) or attestationId on the RiskRegistry (on-chain).",
              "The badge links back to the attestation so end-users can inspect the reasoning.",
            ].map((r) => (
              <li key={r} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="text-foreground/90">{r}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 rounded-2xl border border-border bg-[#0b1020] p-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Code2 className="size-4" /> 5-minute integration
            </div>
            <pre className="mt-4 overflow-x-auto text-[13px] leading-relaxed"><code className="font-mono">{`import { checkTrust, getRecommendation } from "@sentinelfi/sdk";

const verdict = await checkTrust({
  chainId: 677,                // BotChain Mainnet
  action:  "swap",
  contract,
  anchor:  true,               // anchor the attestation on-chain
});

if (getRecommendation(verdict) !== "Proceed") {
  throw new Error("Unsafe transaction — blocked by SentinelFi");
}

await executeTransaction();`}</code></pre>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-4xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight">Embed the badge</h2>
          <p className="mt-4 text-muted-foreground">
            The badge is a single SVG. Point an <code>&lt;img&gt;</code> tag at it — no JS, no CDN, no build step.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-2xl border border-border bg-[#0b1020] p-6 text-[13px] leading-relaxed"><code className="font-mono">{`<img src="https://sentidefi.lovable.app/api/v1/verified/badge.svg" alt="SentinelFi Verified" />`}</code></pre>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <img src="/api/v1/verified/badge.svg" alt="SentinelFi Verified" width={220} height={40} />
            <img src="/api/v1/verified/badge.svg?grade=A" alt="SentinelFi Verified · Grade A" width={260} height={40} />
            <img src="/api/v1/verified/badge.svg?grade=C" alt="SentinelFi Verified · Grade C" width={260} height={40} />
          </div>
        </div>
      </section>
    </main>
  );
}