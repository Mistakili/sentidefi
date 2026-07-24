import { BOTCHAIN_MAINNET_CHAIN_ID, BOTCHAIN_TESTNET_CHAIN_ID, getChain } from "@/lib/chains";
import { hskAdapter } from "./adapters/hsk";
import { botchainMainnetAdapter, botchainTestnetAdapter } from "./adapters/botchain";
import type { ChainAdapter } from "./adapters/types";

const ADAPTERS: Record<number, ChainAdapter> = {
  [hskAdapter.chainId]: hskAdapter,
  [BOTCHAIN_MAINNET_CHAIN_ID]: botchainMainnetAdapter,
  [BOTCHAIN_TESTNET_CHAIN_ID]: botchainTestnetAdapter,
};

export function getAdapter(chainId: number): ChainAdapter {
  const adapter = ADAPTERS[chainId];
  if (!adapter) {
    const chain = getChain(chainId);
    throw new Error(
      chain
        ? `No trust adapter wired for ${chain.name} (chainId ${chainId}).`
        : `Unsupported chainId ${chainId}. Supported: ${Object.keys(ADAPTERS).join(", ")}.`,
    );
  }
  return adapter;
}

export function listAdapters(): ChainAdapter[] {
  return Object.values(ADAPTERS);
}
