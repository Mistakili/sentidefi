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
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

type WalletState = {
  address: string | null;
  chainId: number | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  activeChain: Chain;
  isSupportedChain: boolean;
  hasWallet: boolean;
};

const WalletContext = createContext<WalletState | null>(null);

const STORAGE_KEY = "sentinelfi:wallet";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHasWallet(!!window.ethereum);
    if (!window.ethereum) return;

    const shouldRestore = window.localStorage.getItem(STORAGE_KEY) === "1";
    if (shouldRestore) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((res) => {
          const accounts = res as string[];
          if (accounts[0]) setAddress(accounts[0].toLowerCase());
        })
        .catch(() => {});
      window.ethereum
        .request({ method: "eth_chainId" })
        .then((res) => setChainId(parseInt(res as string, 16)))
        .catch(() => {});
    }

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
    window.ethereum.on?.("accountsChanged", onAccounts);
    window.ethereum.on?.("chainChanged", onChain);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", onAccounts);
      window.ethereum?.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const switchChain = useCallback(async (targetId: number) => {
    if (!window.ethereum) throw new Error("No wallet detected");
    const chain = getLiveChain(targetId);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chain.idHex }],
      });
    } catch (e) {
      const err = e as { code?: number };
      if (err.code === 4902) {
        await window.ethereum.request({
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
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError("No wallet detected. Install MetaMask or another EVM wallet to continue.");
      return;
    }
    setConnecting(true);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (accounts[0]) {
        setAddress(accounts[0].toLowerCase());
        window.localStorage.setItem(STORAGE_KEY, "1");
      }
      const cid = (await window.ethereum.request({ method: "eth_chainId" })) as string;
      const parsed = parseInt(cid, 16);
      setChainId(parsed);
      if (parsed !== DEFAULT_CHAIN_ID) {
        try {
          await switchChain(DEFAULT_CHAIN_ID);
        } catch {
          // user rejected — that's fine, they can still view the portfolio
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect");
    } finally {
      setConnecting(false);
    }
  }, [switchChain]);

  const disconnect = useCallback(() => {
    setAddress(null);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
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
      hasWallet,
    };
  }, [address, chainId, connecting, error, connect, disconnect, switchChain, hasWallet]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    // Safe default so components using this outside the provider (e.g. SSR) don't crash.
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
    };
  }
  return ctx;
}

export { LIVE_CHAINS };

export function shortAddress(addr: string | null): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}