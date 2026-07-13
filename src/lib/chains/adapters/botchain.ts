import type { ChainAdapter, TokenOnChainData } from "./types";

/**
 * BotChain adapter.
 *
 * Runs off env-driven configuration so the moment the BotChain team publishes
 * a public RPC and gives us a chainId, we flip a single secret and it's live —
 * no code change, no redeploy of any other module.
 *
 *   BOTCHAIN_RPC_URL   — public JSON-RPC endpoint
 *   BOTCHAIN_CHAIN_ID  — decimal chainId (optional; defaults to 45454)
 *
 * The Trust API, MCP tool, and demo talk only to this adapter through the
 * ChainAdapter interface. Nothing else in the app knows BotChain specifics.
 */
const DEFAULT_BOT_CHAIN_ID = 45454;

function config(): { chainId: number; rpcUrl: string | null } {
  const rpcUrl = process.env.BOTCHAIN_RPC_URL ?? null;
  const chainId = Number(process.env.BOTCHAIN_CHAIN_ID ?? DEFAULT_BOT_CHAIN_ID);
  return { chainId, rpcUrl };
}

function ensureConfigured(): string {
  const { rpcUrl } = config();
  if (!rpcUrl) {
    throw new Error(
      "BotChain adapter not configured. Set BOTCHAIN_RPC_URL (and optionally BOTCHAIN_CHAIN_ID) to enable trust checks on BotChain.",
    );
  }
  return rpcUrl;
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const url = ensureConfigured();
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

export const botchainAdapter: ChainAdapter = {
  get chainId() {
    return config().chainId;
  },
  name: "BotChain",

  async getBytecode(address) {
    return rpc<string>("eth_getCode", [address.toLowerCase(), "latest"]);
  },

  async isContract(address) {
    const code = await rpc<string>("eth_getCode", [address.toLowerCase(), "latest"]);
    return code !== "0x" && code !== "0x0";
  },

  async getTokenOnChainData(address): Promise<TokenOnChainData> {
    const { chainId, rpcUrl } = config();
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
        rpcUrl: rpcUrl ?? undefined,
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
      rpcUrl: rpcUrl ?? undefined,
    };
  },
};

export function botchainIsConfigured(): boolean {
  return Boolean(process.env.BOTCHAIN_RPC_URL);
}