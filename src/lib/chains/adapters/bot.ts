import type { ChainAdapter } from "./types";

// BotChain adapter — placeholder until BotChain publishes its public RPC.
// When it does: set BOT_RPC_URL, mirror hsk.ts, and flip the chain to
// status:"live" in src/lib/chains.ts. Nothing else in the Trust API changes.
const BOT_CHAIN_ID = 45454;
const NOT_LIVE_MSG = "BotChain adapter is not live yet — RPC pending.";

export const botAdapter: ChainAdapter = {
  chainId: BOT_CHAIN_ID,
  name: "BotChain",
  async getTokenOnChainData() {
    throw new Error(NOT_LIVE_MSG);
  },
  async getBytecode() {
    throw new Error(NOT_LIVE_MSG);
  },
  async isContract() {
    throw new Error(NOT_LIVE_MSG);
  },
};