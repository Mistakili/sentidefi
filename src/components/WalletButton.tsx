import { useWallet, shortAddress, LIVE_CHAINS, MOBILE_WALLETS } from "@/lib/wallet";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function WalletButton() {
  const {
    address,
    chainId,
    connecting,
    connect,
    disconnect,
    switchChain,
    wallets,
    error,
    activeChain,
    isSupportedChain,
    isMobile,
  } = useWallet();
  const [open, setOpen] = useState(false);
  const [picker, setPicker] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!address) {
    return (
      <div className="relative flex flex-col items-end gap-1">
        <button
          onClick={() => setPicker(true)}
          disabled={connecting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
        >
          {connecting ? "Connecting…" : "Connect wallet"}
        </button>
        {error && <span className="text-[10px] text-destructive">{error}</span>}
        {mounted && picker && (
          <WalletPicker
            wallets={wallets}
            isMobile={isMobile}
            onPick={async (rdns) => {
              setPicker(false);
              await connect(rdns);
            }}
            onClose={() => setPicker(false)}
          />
        )}
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

function WalletPicker({
  wallets,
  isMobile,
  onPick,
  onClose,
}: {
  wallets: ReturnType<typeof useWallet>["wallets"];
  isMobile: boolean;
  onPick: (rdns: string) => void;
  onClose: () => void;
}) {
  const currentUrl =
    typeof window !== "undefined" ? window.location.href : "https://sentidefi.lovable.app";

  // On mobile with no injected provider, we're in a plain browser (Safari/Chrome).
  // Show deep-links that reopen this page inside the wallet's in-app browser.
  const showMobileLinks = isMobile && wallets.length === 0;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-base font-semibold">Connect a wallet</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          {showMobileLinks
            ? "Open SentinelFi inside your wallet app to continue."
            : "Choose which wallet to connect."}
        </p>

        {!showMobileLinks && wallets.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {wallets.map((w) => (
              <button
                key={w.uuid}
                onClick={() => onPick(w.rdns)}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition hover:border-primary/40 hover:bg-primary/5"
              >
                {w.icon ? (
                  <img src={w.icon} alt="" className="size-8 rounded-md" />
                ) : (
                  <div className="grid size-8 place-items-center rounded-md bg-muted text-xs font-semibold">
                    {w.name.slice(0, 1)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium">{w.name}</div>
                  <div className="text-[10px] text-muted-foreground">{w.rdns}</div>
                </div>
                <span className="text-xs text-muted-foreground">Connect →</span>
              </button>
            ))}
          </div>
        )}

        {showMobileLinks && (
          <div className="flex flex-col gap-1.5">
            {MOBILE_WALLETS.map((w) => (
              <a
                key={w.rdns}
                href={w.deeplink(currentUrl)}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="grid size-8 place-items-center rounded-md bg-muted text-xs font-semibold">
                  {w.name.slice(0, 1)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Open in {w.name}</div>
                  <div className="text-[10px] text-muted-foreground">Uses in-app browser</div>
                </div>
                <span className="text-xs text-muted-foreground">Open ↗</span>
              </a>
            ))}
          </div>
        )}

        {!showMobileLinks && wallets.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            No wallet extension detected in this browser.
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {MOBILE_WALLETS.map((w) => (
                <a
                  key={w.rdns}
                  href={w.install}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:border-primary/40"
                >
                  Install {w.name} ↗
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}