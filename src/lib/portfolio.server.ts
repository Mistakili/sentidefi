import { HSK_TOKENS, type TrackedToken } from "./hsk-tokens";

const HSK_RPC_URL = "https://mainnet.hsk.xyz";

type RpcResponse<T> = { result?: T; error?: { code: number; message: string } };

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(HSK_RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`HSK RPC ${method}: ${res.status}`);
  const json = (await res.json()) as RpcResponse<T>;
  if (json.error) throw new Error(`HSK RPC ${method}: ${json.error.message}`);
  return json.result as T;
}

function padAddress(addr: string): string {
  return addr.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

async function balanceOf(token: string, holder: string): Promise<bigint> {
  // balanceOf(address) selector: 0x70a08231
  const data = "0x70a08231" + padAddress(holder);
  const hex = await rpc<string>("eth_call", [{ to: token, data }, "latest"]);
  if (!hex || hex === "0x") return 0n;
  return BigInt(hex);
}

// Cached price map from CoinGecko (5 min TTL).
let priceCache: { at: number; prices: Record<string, number> } | null = null;

async function getPrices(ids: string[]): Promise<Record<string, number>> {
  if (priceCache && Date.now() - priceCache.at < 5 * 60_000) return priceCache.prices;
  const uniq = Array.from(new Set(ids)).filter(Boolean);
  if (uniq.length === 0) return {};
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(uniq.join(","))}&vs_currencies=usd`,
      { headers: { accept: "application/json" } },
    );
    if (!res.ok) return priceCache?.prices ?? {};
    const json = (await res.json()) as Record<string, { usd?: number }>;
    const prices: Record<string, number> = {};
    for (const [id, v] of Object.entries(json)) if (typeof v.usd === "number") prices[id] = v.usd;
    priceCache = { at: Date.now(), prices };
    return prices;
  } catch {
    return priceCache?.prices ?? {};
  }
}

export type Holding = {
  token: TrackedToken;
  balanceRaw: string;
  balance: number;
  priceUsd: number | null;
  valueUsd: number | null;
};

export type WalletPortfolio = {
  address: string;
  chainId: number;
  fetchedAt: string;
  holdings: Holding[];
  totalValueUsd: number | null;
};

export async function fetchWalletPortfolio(address: string): Promise<WalletPortfolio> {
  const addr = address.toLowerCase();
  if (!/^0x[a-f0-9]{40}$/.test(addr)) throw new Error("Invalid address");

  const results = await Promise.all(
    HSK_TOKENS.map(async (token) => {
      try {
        const raw =
          token.address === "native"
            ? BigInt(await rpc<string>("eth_getBalance", [addr, "latest"]))
            : await balanceOf(token.address, addr);
        const balance = Number(raw) / 10 ** token.decimals;
        return { token, balanceRaw: raw.toString(), balance };
      } catch {
        return { token, balanceRaw: "0", balance: 0 };
      }
    }),
  );

  const ids = HSK_TOKENS.map((t) => t.coingeckoId).filter((x): x is string => !!x);
  const prices = await getPrices(ids);

  const holdings: Holding[] = results.map((r) => {
    const priceUsd = r.token.coingeckoId ? prices[r.token.coingeckoId] ?? null : null;
    const valueUsd = priceUsd !== null ? r.balance * priceUsd : null;
    return { ...r, priceUsd, valueUsd };
  });

  const totalValueUsd = holdings.reduce<number | null>((acc, h) => {
    if (h.valueUsd === null) return acc;
    return (acc ?? 0) + h.valueUsd;
  }, null);

  return {
    address: addr,
    chainId: 177,
    fetchedAt: new Date().toISOString(),
    holdings,
    totalValueUsd,
  };
}