import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "SentinelFi × BotChain — Live demo" },
      {
        name: "description",
        content:
          "End-to-end demo of the SentinelFi Trust Protocol on BotChain. Enter a contract, get a signed Safety Attestation, watch the recommendation drive execution.",
      },
    ],
  }),
  component: Demo,
});

type CheckResult = {
  verdict: string;
  trustGrade: string;
  recommendation: string;
  riskScore: number;
  severity: string;
  confidence: number;
  reasoning: string[];
  chainId: number;
  contract: string | null;
  attestation: {
    receiptId: string;
    attestor: string;
    signature: string;
    reasoningHash: string;
  };
  anchor:
    | { status: "anchored"; txHash: string; explorerUrl: string; registry: string }
    | { status: "skipped"; reason: string }
    | { status: "unconfigured"; reason: string }
    | { status: "error"; error: string };
};

function Demo() {
  const [contract, setContract] = useState("0xb9c5fcca50c2a8ed5aa9cc6fa030f0acdc7ded66");
  const [chainId, setChainId] = useState<number>(677);
  const [anchor, setAnchor] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);

  async function run() {
    setError(null);
    setResult(null);
    setLoading(true);
    setStep(1);
    try {
      await new Promise((r) => setTimeout(r, 250));
      setStep(2);
      const res = await fetch("/api/v1/trust/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chainId,
          action: "swap",
          contract,
          agentId: "sentinelfi-demo",
          anchor,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as CheckResult;
      setStep(3);
      await new Promise((r) => setTimeout(r, 400));
      setResult(data);
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-sm font-semibold tracking-tight">SentinelFi</Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/docs" className="hover:text-foreground">Docs</Link>
            <Link to="/verified" className="hover:text-foreground">Verified</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">
          Live demo · SentinelFi × BotChain
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          The trust checkpoint, in one call.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Enter any contract. We call the Trust Protocol, sign a Safety Attestation,
          and (optionally) anchor it on BotChain. This is exactly the flow an AI
          agent would run before signing a transaction.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-[2fr,3fr]">
          <div className="rounded-2xl border border-border bg-card/60 p-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Target chain
            </label>
            <div className="mt-2 flex gap-2">
              {[
                { id: 677, label: "BotChain Mainnet" },
                { id: 968, label: "BotChain Testnet" },
                { id: 177, label: "HSK Chain" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setChainId(c.id)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    chainId === c.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <label className="mt-6 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contract address
            </label>
            <input
              value={contract}
              onChange={(e) => setContract(e.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
              placeholder="0x…"
            />

            <label className="mt-6 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={anchor}
                onChange={(e) => setAnchor(e.target.checked)}
              />
              Anchor Safety Attestation on-chain
            </label>

            <button
              onClick={run}
              disabled={loading || !/^0x[0-9a-fA-F]{40}$/.test(contract)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Run trust check
            </button>

            {error && (
              <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card/60 p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Execution flow
            </div>
            <ol className="mt-4 space-y-3 text-sm">
              {[
                "Agent prepares transaction",
                "Trust Protocol reads chain state",
                "Safety Attestation signed",
                "Attestation anchored on-chain",
                "Agent branches on recommendation",
              ].map((label, i) => {
                const active = step >= (i + 1) as unknown as boolean;
                return (
                  <li key={label} className="flex items-center gap-3">
                    <div
                      className={`flex size-6 items-center justify-center rounded-full border text-[10px] font-bold ${
                        active
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className={active ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                    {step === i + 1 && loading && <Loader2 className="size-3 animate-spin text-primary" />}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {result && <ResultCard r={result} />}
      </section>
    </main>
  );
}

function ResultCard({ r }: { r: CheckResult }) {
  const gradeColor =
    r.trustGrade === "A" || r.trustGrade === "B"
      ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/5"
      : r.trustGrade === "C"
        ? "text-yellow-400 border-yellow-400/40 bg-yellow-400/5"
        : "text-red-400 border-red-400/40 bg-red-400/5";
  return (
    <div className="mt-10 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className={`rounded-2xl border p-6 ${gradeColor}`}>
          <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Trust Grade</div>
          <div className="mt-2 text-6xl font-bold">{r.trustGrade}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recommendation</div>
          <div className="mt-2 flex items-center gap-2 text-xl font-semibold">
            {r.recommendation === "Proceed" ? (
              <CheckCircle2 className="size-5 text-emerald-400" />
            ) : r.recommendation === "Block" ? (
              <XCircle className="size-5 text-red-400" />
            ) : (
              <ArrowRight className="size-5 text-yellow-400" />
            )}
            {r.recommendation}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            {r.severity} severity · {r.confidence}% confidence · score {r.riskScore}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card/60 p-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">On-chain anchor</div>
          <div className="mt-2 text-sm">
            {r.anchor.status === "anchored" ? (
              <a
                href={r.anchor.explorerUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-emerald-400 underline"
              >
                {r.anchor.txHash.slice(0, 10)}…{r.anchor.txHash.slice(-6)}
              </a>
            ) : r.anchor.status === "unconfigured" ? (
              <span className="text-muted-foreground">Not configured — off-chain only</span>
            ) : r.anchor.status === "skipped" ? (
              <span className="text-muted-foreground">Skipped</span>
            ) : (
              <span className="text-red-400">Error: {(r.anchor as { error: string }).error}</span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Reasoning</div>
        <ul className="mt-3 space-y-1.5 text-sm">
          {r.reasoning.map((line, i) => (
            <li key={i} className="text-foreground/90">• {line}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-[#0b1020] p-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Safety Attestation</div>
        <div className="mt-3 grid gap-2 font-mono text-xs">
          <div><span className="text-muted-foreground">receiptId:</span> {r.attestation.receiptId}</div>
          <div className="truncate"><span className="text-muted-foreground">attestor:</span> {r.attestation.attestor}</div>
          <div className="truncate"><span className="text-muted-foreground">reasoningHash:</span> {r.attestation.reasoningHash}</div>
          <div className="truncate"><span className="text-muted-foreground">signature:</span> {r.attestation.signature.slice(0, 66)}…</div>
        </div>
      </div>
    </div>
  );
}