// Back-compat re-exports. All new code should import from "@/lib/chains".
import { getLiveChain, DEFAULT_CHAIN_ID, type ChainToken } from "./chains";

export type TrackedToken = ChainToken;

const hsk = getLiveChain(DEFAULT_CHAIN_ID);
export const HSK_TOKENS: TrackedToken[] = hsk.tokens;
export const HSK_CHAIN = {
  chainId: hsk.id,
  chainIdHex: hsk.idHex,
  name: hsk.name,
  rpcUrl: hsk.rpcUrl,
  explorer: hsk.explorer,
  nativeCurrency: hsk.nativeCurrency,
};