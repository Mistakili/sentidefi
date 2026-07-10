import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useWallet, shortAddress } from "@/lib/wallet";
import { WalletButton } from "@/components/WalletButton";
import { getWalletPortfolioFn } from "@/lib/portfolio.functions";
import type { WalletPortfolio } from "@/lib/portfolio.server";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — SentinelFi" },
      {
        name: "description",
        content:
          "Your HSK Chain portfolio, watched by the SentinelFi AI Guardian. Connect your wallet to see balances, risk, and AI strategy suggestions.",
      },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { address } = useWallet();
  const [data, setData] = useState<WalletPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr(null);
    getWalletPortfolioFn({ data: { address } })
      .then((p) => {
        if (!cancelled) setData(p);
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load portfolio");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-primary">◆</span> SentinelFi
            <span className="ml-2 text-muted-foreground">/ Portfolio</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/copilot"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Copilot
            </Link>
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {!address ? <ConnectPrompt /> : <PortfolioView data={data} loading={loading} err={err} address={address} />}
      </main>
    </div>
  );
}

function ConnectPrompt() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card/60 p-10 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary/15 text-primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-7">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <h1 className="mt-5 text-2xl font-bold">Connect your wallet</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        SentinelFi reads your HSK Chain positions on-chain. Nothing is ever transmitted — we sign nothing without your approval.
      </p>
      <div className="mt-6 flex justify-center">
        <WalletButton />
      </div>
    </div>
  );
}

function PortfolioView({
  data,
  loading,
  err,
  address,
}: {
  data: WalletPortfolio | null;
  loading: boolean;
  err: string | null;
  address: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Wallet</div>
          <div className="mt-1 font-mono text-lg">{shortAddress(address)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total value</div>
          <div className="mt-1 text-4xl font-bold">
            {data?.totalValueUsd !== null && data?.totalValueUsd !== undefined
              ? `$${data.totalValueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              : loading
              ? "…"
              : "—"}
          </div>
        </div>
      </div>

      {err && (
        <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {err}
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card/60">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 border-b border-border px-5 py-3 text-[10px] uppercase tracking-wider text-muted-foreground">
          <div>Token</div>
          <div className="text-right">Balance</div>
          <div className="text-right">Price</div>
          <div className="text-right">Value</div>
        </div>
        {loading && !data ? (
          <div className="px-5 py-8 text-sm text-muted-foreground">Loading balances…</div>
        ) : data?.holdings.length ? (
          data.holdings.map((h) => (
            <div
              key={h.token.address}
              className="grid grid-cols-[1fr_1fr_1fr_1fr] items-center gap-4 border-b border-border/50 px-5 py-4 last:border-0"
            >
              <div>
                <div className="font-semibold">{h.token.symbol}</div>
                <div className="text-xs text-muted-foreground">{h.token.name}</div>
              </div>
              <div className="text-right font-mono text-sm">
                {h.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </div>
              <div className="text-right font-mono text-sm text-muted-foreground">
                {h.priceUsd !== null ? `$${h.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 4 })}` : "—"}
              </div>
              <div className="text-right font-mono text-sm">
                {h.valueUsd !== null
                  ? `$${h.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                  : "—"}
              </div>
            </div>
          ))
        ) : (
          <div className="px-5 py-8 text-sm text-muted-foreground">No tracked holdings yet.</div>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              AI Guardian
            </div>
            <h2 className="mt-1 text-xl font-semibold">Ask the Copilot about this portfolio</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              "Am I too concentrated?" · "What should I do?" · "Any risks in my holdings?"
            </p>
          </div>
          <Link
            to="/copilot"
            search={{ address }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
          >
            Open Copilot →
          </Link>
        </div>
      </div>
    </div>
  );
}