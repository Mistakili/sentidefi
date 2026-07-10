import { useWallet, shortAddress } from "@/lib/wallet";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { HSK_CHAIN } from "@/lib/hsk-tokens";

export function WalletButton() {
  const { address, chainId, connecting, connect, disconnect, switchToHsk, hasWallet, error } =
    useWallet();
  const [open, setOpen] = useState(false);

  if (!address) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
      >
        {connecting ? "Connecting…" : hasWallet ? "Connect wallet" : "Install wallet"}
      </button>
    );
  }

  const wrongChain = chainId !== null && chainId !== HSK_CHAIN.chainId;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:border-primary/40"
      >
        <span className={`size-2 rounded-full ${wrongChain ? "bg-amber-400" : "bg-emerald-400"}`} />
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
              ? `Wrong network (chainId ${chainId}). SentinelFi runs on HSK Chain.`
              : "Connected to HSK Chain"}
          </div>
          {error && <div className="px-3 py-1 text-xs text-destructive">{error}</div>}
          <div className="mt-2 flex flex-col gap-1">
            {wrongChain && (
              <button
                onClick={switchToHsk}
                className="rounded-md bg-primary px-3 py-2 text-left text-xs font-semibold text-primary-foreground hover:brightness-110"
              >
                Switch to HSK Chain
              </button>
            )}
            <Link
              to="/portfolio"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-left text-xs hover:bg-background"
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