// SentinelFi supported chains registry.
// Adding a new chain = add an entry here + its tokens. Nothing else in the app
// needs to know about specific chain IDs.

export type ChainToken = {
  address: string; // "native" for the chain's gas token, else 0x… (lowercased)
  symbol: string;
  name: string;
  decimals: number;
  coingeckoId?: string;
};

export type Chain = {
  id: number;
  idHex: string; // 0x-prefixed hex chainId (used by wallet_switchEthereumChain)
  name: string;
  shortName: string;
  rpcUrl: string;
  explorer: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  tokens: ChainToken[];
  status: "live" | "coming-soon";
};

const HSK: Chain = {
  id: 177,
  idHex: "0xb1",
  name: "HashKey Chain",
  shortName: "HSK",
  rpcUrl: "https://mainnet.hsk.xyz",
  explorer: "https://hashkey.blockscout.com",
  nativeCurrency: { name: "HashKey", symbol: "HSK", decimals: 18 },
  status: "live",
  tokens: [
    { address: "native", symbol: "HSK", name: "HashKey", decimals: 18, coingeckoId: "hashkey-platform-token" },
    { address: "0xb9c5fcca50c2a8ed5aa9cc6fa030f0acdc7ded66", symbol: "USDT", name: "Tether USD", decimals: 6, coingeckoId: "tether" },
    { address: "0xb210d2120d57b758ee163cffb43e73728c471cf1", symbol: "WHSK", name: "Wrapped HSK", decimals: 18, coingeckoId: "hashkey-platform-token" },
  ],
};

// Placeholder for the next chain we onboard. Flip to status:"live" and
// populate tokens/rpcUrl to enable it end-to-end — no other code changes.
const BOTCHAIN: Chain = {
  id: 45454,
  idHex: "0xb18e",
  name: "BotChain",
  shortName: "BOT",
  rpcUrl: "",
  explorer: "",
  nativeCurrency: { name: "BotChain", symbol: "BOT", decimals: 18 },
  status: "coming-soon",
  tokens: [],
};

export const CHAINS: Chain[] = [HSK, BOTCHAIN];

export const DEFAULT_CHAIN_ID = HSK.id;

export function getChain(id: number): Chain | undefined {
  return CHAINS.find((c) => c.id === id);
}

export function getLiveChain(id: number): Chain {
  const c = getChain(id);
  if (!c || c.status !== "live") {
    // Fall back to the default live chain so callers never crash on an
    // unknown/coming-soon id (e.g. wallet on a chain we don't support).
    return HSK;
  }
  return c;
}

export const LIVE_CHAINS: Chain[] = CHAINS.filter((c) => c.status === "live");