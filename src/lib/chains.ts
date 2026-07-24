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

/** BOT Chain Mainnet — https://dev-docs.botchain.ai/docs/Developers/json-rpc-endpoint/ */
export const BOTCHAIN_MAINNET_CHAIN_ID = 677;

/** BOT Chain Testnet */
export const BOTCHAIN_TESTNET_CHAIN_ID = 968;

const BOTCHAIN_MAINNET: Chain = {
  id: BOTCHAIN_MAINNET_CHAIN_ID,
  idHex: "0x2a5",
  name: "BotChain",
  shortName: "BOT",
  rpcUrl: "https://rpc.botchain.ai",
  explorer: "https://scan.botchain.ai",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  status: "live",
  tokens: [],
};

const BOTCHAIN_TESTNET: Chain = {
  id: BOTCHAIN_TESTNET_CHAIN_ID,
  idHex: "0x3c8",
  name: "BotChain Testnet",
  shortName: "BOT-T",
  rpcUrl: "https://rpc.bohr.life",
  explorer: "https://scan.bohr.life",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  status: "live",
  tokens: [],
};

export const CHAINS: Chain[] = [HSK, BOTCHAIN_MAINNET, BOTCHAIN_TESTNET];

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
