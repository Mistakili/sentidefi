import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { HSK_CHAIN } from "./hsk-tokens";

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
  switchToHsk: () => Promise<void>;
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

  const switchToHsk = useCallback(async () => {
    if (!window.ethereum) throw new Error("No wallet detected");
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HSK_CHAIN.chainIdHex }],
      });
    } catch (e) {
      const err = e as { code?: number };
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: HSK_CHAIN.chainIdHex,
              chainName: HSK_CHAIN.name,
              rpcUrls: [HSK_CHAIN.rpcUrl],
              nativeCurrency: HSK_CHAIN.nativeCurrency,
              blockExplorerUrls: [HSK_CHAIN.explorer],
            },
          ],
        });
      } else throw e;
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError("No wallet detected. Install MetaMask to continue.");
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
      setChainId(parseInt(cid, 16));
      if (parseInt(cid, 16) !== HSK_CHAIN.chainId) {
        try {
          await switchToHsk();
        } catch {
          // user rejected — that's fine, they can still view the portfolio
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect");
    } finally {
      setConnecting(false);
    }
  }, [switchToHsk]);

  const disconnect = useCallback(() => {
    setAddress(null);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ address, chainId, connecting, error, connect, disconnect, switchToHsk, hasWallet }),
    [address, chainId, connecting, error, connect, disconnect, switchToHsk, hasWallet],
  );

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
      switchToHsk: async () => {},
      hasWallet: false,
    };
  }
  return ctx;
}

export function shortAddress(addr: string | null): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}