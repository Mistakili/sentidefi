import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_CHAIN_ID, LIVE_CHAINS, getChain, getLiveChain, type Chain } from "./chains";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isTrust?: boolean;
  isRabby?: boolean;
  providers?: EthereumProvider[];
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

// EIP-6963 discovered wallet
export type DetectedWallet = {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
  provider: EthereumProvider;
};

type WalletState = {
  address: string | null;
  chainId: number | null;
  connecting: boolean;
  error: string | null;
  connect: (rdns?: string) => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  activeChain: Chain;
  isSupportedChain: boolean;
  hasWallet: boolean;
  wallets: DetectedWallet[];
  activeWallet: DetectedWallet | null;
  isMobile: boolean;
};

const WalletContext = createContext<WalletState | null>(null);

const STORAGE_KEY = "sentinelfi:wallet";
const STORAGE_RDNS = "sentinelfi:wallet:rdns";

function detectMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

// Fallback: turn a legacy window.ethereum into a synthetic 6963 entry so users
// with only-injected (no announcement) providers still get a choice.
function legacyToDetected(p: EthereumProvider): DetectedWallet {
  const name = p.isMetaMask
    ? "MetaMask"
    : p.isCoinbaseWallet
      ? "Coinbase Wallet"
      : p.isTrust
        ? "Trust Wallet"
        : p.isRabby
          ? "Rabby"
          : "Injected Wallet";
  const rdns = p.isMetaMask
    ? "io.metamask"
    : p.isCoinbaseWallet
      ? "com.coinbase.wallet"
      : p.isTrust
        ? "com.trustwallet.app"
        : p.isRabby
          ? "io.rabby"
          : "injected";
  return { uuid: rdns, name, icon: "", rdns, provider: p };
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [activeUuid, setActiveUuid] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Discover wallets via EIP-6963 + legacy fallback
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsMobile(detectMobile());

    const found = new Map<string, DetectedWallet>();

    const onAnnounce = (event: Event) => {
      const e = event as CustomEvent<{
        info: { uuid: string; name: string; icon: string; rdns: string };
        provider: EthereumProvider;
      }>;
      const { info, provider } = e.detail;
      found.set(info.rdns, {
        uuid: info.uuid,
        name: info.name,
        icon: info.icon,
        rdns: info.rdns,
        provider,
      });
      setWallets(Array.from(found.values()));
    };

    window.addEventListener("eip6963:announceProvider", onAnnounce as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    // Legacy window.ethereum fallback (some wallets don't announce)
    setTimeout(() => {
      const eth = window.ethereum;
      if (!eth) return;
      const legacyList = eth.providers?.length ? eth.providers : [eth];
      for (const p of legacyList) {
        const d = legacyToDetected(p);
        if (!found.has(d.rdns)) found.set(d.rdns, d);
      }
      setWallets(Array.from(found.values()));
    }, 150);

    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce as EventListener);
    };
  }, []);

  const activeWallet = useMemo(
    () => wallets.find((w) => w.uuid === activeUuid) ?? null,
    [wallets, activeUuid],
  );

  // Restore session
  useEffect(() => {
    if (typeof window === "undefined" || wallets.length === 0) return;
    if (address) return;
    const shouldRestore = window.localStorage.getItem(STORAGE_KEY) === "1";
    if (!shouldRestore) return;
    const savedRdns = window.localStorage.getItem(STORAGE_RDNS);
    const w = wallets.find((x) => x.rdns === savedRdns) ?? wallets[0];
    if (!w) return;
    setActiveUuid(w.uuid);
    w.provider
      .request({ method: "eth_accounts" })
      .then((res) => {
        const accounts = res as string[];
        if (accounts[0]) setAddress(accounts[0].toLowerCase());
      })
      .catch(() => {});
    w.provider
      .request({ method: "eth_chainId" })
      .then((res) => setChainId(parseInt(res as string, 16)))
      .catch(() => {});
  }, [wallets, address]);

  // Subscribe to active provider events
  useEffect(() => {
    if (!activeWallet) return;
    const p = activeWallet.provider;
    const onAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts?.[0]) setAddress(accounts[0].toLowerCase());
      else {
        setAddress(null);
        window.localStorage.removeItem(STORAGE_KEY);
      }
    };
    const onChain = (...args: unknown[]) => {
      const cid = args[0] as string;
      setChainId(parseInt(cid, 16));
    };
    p.on?.("accountsChanged", onAccounts);
    p.on?.("chainChanged", onChain);
    return () => {
      p.removeListener?.("accountsChanged", onAccounts);
      p.removeListener?.("chainChanged", onChain);
    };
  }, [activeWallet]);

  const switchChain = useCallback(
    async (targetId: number) => {
      const p = activeWallet?.provider;
      if (!p) throw new Error("No wallet connected");
      const chain = getLiveChain(targetId);
      try {
        await p.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chain.idHex }],
        });
      } catch (e) {
        const err = e as { code?: number };
        if (err.code === 4902) {
          await p.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chain.idHex,
                chainName: chain.name,
                rpcUrls: [chain.rpcUrl],
                nativeCurrency: chain.nativeCurrency,
                blockExplorerUrls: [chain.explorer],
              },
            ],
          });
        } else throw e;
      }
    },
    [activeWallet],
  );

  const connect = useCallback(
    async (rdns?: string) => {
      setError(null);
      const target = rdns
        ? wallets.find((w) => w.rdns === rdns)
        : wallets[0];
      if (!target) {
        setError("No wallet detected. Install a wallet extension to continue.");
        return;
      }
      setActiveUuid(target.uuid);
      setConnecting(true);
      try {
        const accounts = (await target.provider.request({
          method: "eth_requestAccounts",
        })) as string[];
        if (accounts[0]) {
          setAddress(accounts[0].toLowerCase());
          window.localStorage.setItem(STORAGE_KEY, "1");
          window.localStorage.setItem(STORAGE_RDNS, target.rdns);
        }
        const cid = (await target.provider.request({ method: "eth_chainId" })) as string;
        const parsed = parseInt(cid, 16);
        setChainId(parsed);
        if (parsed !== DEFAULT_CHAIN_ID) {
          try {
            await target.provider.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: getLiveChain(DEFAULT_CHAIN_ID).idHex }],
            });
          } catch {
            /* user rejected */
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to connect");
      } finally {
        setConnecting(false);
      }
    },
    [wallets],
  );

  const disconnect = useCallback(() => {
    setAddress(null);
    setActiveUuid(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(STORAGE_RDNS);
    }
  }, []);

  const value = useMemo<WalletState>(() => {
    const known = chainId !== null ? getChain(chainId) : undefined;
    const isSupportedChain = !!(known && known.status === "live");
    const activeChain = isSupportedChain
      ? (known as Chain)
      : getLiveChain(DEFAULT_CHAIN_ID);
    return {
      address,
      chainId,
      connecting,
      error,
      connect,
      disconnect,
      switchChain,
      activeChain,
      isSupportedChain,
      hasWallet: wallets.length > 0,
      wallets,
      activeWallet,
      isMobile,
    };
  }, [
    address,
    chainId,
    connecting,
    error,
    connect,
    disconnect,
    switchChain,
    wallets,
    activeWallet,
    isMobile,
  ]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    return {
      address: null,
      chainId: null,
      connecting: false,
      error: null,
      connect: async () => {},
      disconnect: () => {},
      switchChain: async () => {},
      activeChain: getLiveChain(DEFAULT_CHAIN_ID),
      isSupportedChain: false,
      hasWallet: false,
      wallets: [],
      activeWallet: null,
      isMobile: false,
    };
  }
  return ctx;
}

export { LIVE_CHAINS };

export function shortAddress(addr: string | null): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// Mobile deep links — open the dapp inside the wallet's in-app browser.
export type MobileWalletLink = {
  rdns: string;
  name: string;
  deeplink: (currentUrl: string) => string;
  install: string;
};

export const MOBILE_WALLETS: MobileWalletLink[] = [
  {
    rdns: "io.metamask",
    name: "MetaMask",
    deeplink: (url) => {
      const host = url.replace(/^https?:\/\//, "");
      return `https://metamask.app.link/dapp/${host}`;
    },
    install: "https://metamask.io/download/",
  },
  {
    rdns: "com.trustwallet.app",
    name: "Trust Wallet",
    deeplink: (url) =>
      `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(url)}`,
    install: "https://trustwallet.com/download",
  },
  {
    rdns: "com.coinbase.wallet",
    name: "Coinbase Wallet",
    deeplink: (url) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`,
    install: "https://www.coinbase.com/wallet/downloads",
  },
  {
    rdns: "me.rainbow",
    name: "Rainbow",
    deeplink: (url) => `https://rnbwapp.com/dapp?url=${encodeURIComponent(url)}`,
    install: "https://rainbow.me/download",
  },
];