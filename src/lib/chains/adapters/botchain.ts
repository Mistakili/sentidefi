import {
  BOTCHAIN_MAINNET_CHAIN_ID,
  BOTCHAIN_TESTNET_CHAIN_ID,
  getChain,
} from "@/lib/chains";
import type { ChainAdapter, TokenOnChainData } from "./types";

type BotNetwork = {
  chainId: number;
  name: string;
  defaultRpc: string;
};

const NETWORKS: Record<number, BotNetwork> = {
  [BOTCHAIN_MAINNET_CHAIN_ID]: {
    chainId: BOTCHAIN_MAINNET_CHAIN_ID,
    name: "BotChain",
    defaultRpc: "https://rpc.botchain.ai",
  },
  [BOTCHAIN_TESTNET_CHAIN_ID]: {
    chainId: BOTCHAIN_TESTNET_CHAIN_ID,
    name: "BotChain Testnet",
    defaultRpc: "https://rpc.bohr.life",
  },
};

function rpcUrlFor(chainId: number): string {
  const net = NETWORKS[chainId];
  const chain = getChain(chainId);
  // Prefer chain-specific env only when it matches this network's default intent.
  // BOTCHAIN_RPC_URL is the mainnet override; testnet has a fixed public RPC.
  if (chainId === BOTCHAIN_MAINNET_CHAIN_ID) {
    return process.env.BOTCHAIN_RPC_URL ?? chain?.rpcUrl ?? net.defaultRpc;
  }
  return process.env.BOTCHAIN_TESTNET_RPC_URL ?? chain?.rpcUrl ?? net.defaultRpc;
}

function decodeString(hex: string): string {
  if (!hex || hex === "0x") return "";
  const data = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (data.length === 64) {
    return Buffer.from(data, "hex").toString("utf8").replace(/\0+$/, "");
  }
  try {
    const len = parseInt(data.slice(64, 128), 16);
    return Buffer.from(data.slice(128, 128 + len * 2), "hex").toString("utf8");
  } catch {
    return "";
  }
}

const SIG = {
  name: "0x06fdde03",
  symbol: "0x95d89b41",
  decimals: "0x313ce567",
  totalSupply: "0x18160ddd",
};

function makeBotchainAdapter(chainId: number): ChainAdapter {
  const net = NETWORKS[chainId];
  if (!net) throw new Error(`Unknown BotChain network: ${chainId}`);

  async function rpc<T>(method: string, params: unknown[]): Promise<T> {
    const url = rpcUrlFor(chainId);
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    if (!res.ok) throw new Error(`BotChain RPC ${method} failed: ${res.status}`);
    const json = (await res.json()) as { result?: T; error?: { message: string } };
    if (json.error) throw new Error(`BotChain RPC ${method}: ${json.error.message}`);
    return json.result as T;
  }

  async function ethCall(to: string, data: string): Promise<string> {
    return rpc<string>("eth_call", [{ to, data }, "latest"]);
  }

  async function safeCall<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch {
      return null;
    }
  }

  return {
    chainId,
    name: net.name,

    async getBytecode(address) {
      return rpc<string>("eth_getCode", [address.toLowerCase(), "latest"]);
    },

    async isContract(address) {
      const code = await rpc<string>("eth_getCode", [address.toLowerCase(), "latest"]);
      return code !== "0x" && code !== "0x0";
    },

    async getTokenOnChainData(address): Promise<TokenOnChainData> {
      const rpcUrl = rpcUrlFor(chainId);
      const addr = address.toLowerCase();
      if (!/^0x[a-f0-9]{40}$/.test(addr)) {
        throw new Error("Invalid address — must be a 0x-prefixed 40-char hex string");
      }

      const code = await rpc<string>("eth_getCode", [addr, "latest"]);
      const isContract = code !== "0x" && code !== "0x0";
      const bytecodeSize = isContract ? (code.length - 2) / 2 : 0;

      if (!isContract) {
        return {
          address: addr,
          isContract: false,
          bytecodeSize: 0,
          name: null,
          symbol: null,
          decimals: null,
          totalSupply: null,
          looksLikeERC20: false,
          chainId,
          rpcUrl,
          note: "EOA (externally owned account)",
        };
      }

      const [nameHex, symbolHex, decimalsHex, supplyHex] = await Promise.all([
        safeCall(() => ethCall(addr, SIG.name)),
        safeCall(() => ethCall(addr, SIG.symbol)),
        safeCall(() => ethCall(addr, SIG.decimals)),
        safeCall(() => ethCall(addr, SIG.totalSupply)),
      ]);

      const name = nameHex ? decodeString(nameHex) || null : null;
      const symbol = symbolHex ? decodeString(symbolHex) || null : null;
      const decimals = decimalsHex ? Number(BigInt(decimalsHex)) : null;
      const totalSupply = supplyHex ? BigInt(supplyHex).toString() : null;
      const looksLikeERC20 = Boolean(name && symbol && decimals !== null);

      return {
        address: addr,
        isContract: true,
        bytecodeSize,
        name,
        symbol,
        decimals,
        totalSupply,
        looksLikeERC20,
        chainId,
        rpcUrl,
      };
    },
  };
}

/** Mainnet (677) — default production BotChain surface. */
export const botchainMainnetAdapter = makeBotchainAdapter(BOTCHAIN_MAINNET_CHAIN_ID);

/** Testnet (968). */
export const botchainTestnetAdapter = makeBotchainAdapter(BOTCHAIN_TESTNET_CHAIN_ID);

/** @deprecated use botchainMainnetAdapter or botchainTestnetAdapter */
export const botchainAdapter = botchainMainnetAdapter;

export function botchainIsConfigured(): boolean {
  return true;
}
