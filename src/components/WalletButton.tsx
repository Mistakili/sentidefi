import { useWallet, shortAddress, LIVE_CHAINS } from "@/lib/wallet";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function WalletButton() {
  const { address, chainId, connecting, connect, disconnect, switchChain, hasWallet, error, activeChain, isSupportedChain } =
    useWallet();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!address) {
    // No wallet extension detected: send them to install MetaMask instead of
    // a click that would fail silently.
    if (mounted && !hasWallet) {
      return (
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:brightness-110"
          title="No wallet detected in this browser"
        >
          Install wallet ↗
        </a>
      );
    }
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={connect}
          disabled={connecting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
        >
          {connecting ? "Connecting…" : "Connect wallet"}
        </button>
        {error && <span className="text-[10px] text-destructive">{error}</span>}
      </div>
    );
  }

  const wrongChain = !isSupportedChain;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:border-primary/40"
      >
        <span className={`size-2 rounded-full ${wrongChain ? "bg-amber-400" : "bg-emerald-400"}`} />
        <span className="hidden text-xs text-muted-foreground sm:inline">{activeChain.shortName}</span>
        <span className="font-mono">{shortAddress(address)}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-border bg-card p-2 shadow-lg">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            Wallet
          </div>
          <div className="px-3 py-1 font-mono text-xs text-foreground/80 break-all">{address}</div>
          <div className="mt-2 px-3 py-1 text-xs text-muted-foreground">
            {wrongChain
              ? `Unsupported network (chainId ${chainId}). Switch to a supported chain below.`
              : `Connected to ${activeChain.name}`}
          </div>
          {error && <div className="px-3 py-1 text-xs text-destructive">{error}</div>}
          <div className="mt-2 flex flex-col gap-1">
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Switch network
            </div>
            {LIVE_CHAINS.map((c) => (
              <button
                key={c.id}
                onClick={() => switchChain(c.id)}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-xs transition hover:bg-background ${
                  chainId === c.id ? "bg-primary/10 text-primary" : ""
                }`}
              >
                <span>{c.name}</span>
                {chainId === c.id && <span className="text-[10px]">active</span>}
              </button>
            ))}
            <Link
              to="/portfolio"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-md px-3 py-2 text-left text-xs hover:bg-background"
            >
              View portfolio →
            </Link>
            <button
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="rounded-md px-3 py-2 text-left text-xs text-muted-foreground hover:bg-background hover:text-destructive"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}