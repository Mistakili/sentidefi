// Curated list of tracked tokens on HSK Chain (chainId 177).
// Kept small on purpose — extend as we index more.
export type TrackedToken = {
  address: string; // 0x... lowercase; "native" for HSK
  symbol: string;
  name: string;
  decimals: number;
  coingeckoId?: string;
};

export const HSK_TOKENS: TrackedToken[] = [
  {
    address: "native",
    symbol: "HSK",
    name: "HashKey",
    decimals: 18,
    coingeckoId: "hashkey-platform-token",
  },
  {
    address: "0xb9c5fcca50c2a8ed5aa9cc6fa030f0acdc7ded66",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    coingeckoId: "tether",
  },
  {
    address: "0xb210d2120d57b758ee163cffb43e73728c471cf1",
    symbol: "WHSK",
    name: "Wrapped HSK",
    decimals: 18,
    coingeckoId: "hashkey-platform-token",
  },
];

export const HSK_CHAIN = {
  chainId: 177,
  chainIdHex: "0xb1",
  name: "HashKey Chain",
  rpcUrl: "https://mainnet.hsk.xyz",
  explorer: "https://hashkey.blockscout.com",
  nativeCurrency: { name: "HashKey", symbol: "HSK", decimals: 18 },
};