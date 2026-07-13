import { getTokenOnChainData as _get } from "@/lib/hsk-rpc.server";
import type { ChainAdapter, TokenOnChainData } from "./types";

const HSK_RPC_URL = "https://mainnet.hsk.xyz";

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(HSK_RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`HSK RPC ${method} failed: ${res.status}`);
  const json = (await res.json()) as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(`HSK RPC ${method}: ${json.error.message}`);
  return json.result as T;
}

export const hskAdapter: ChainAdapter = {
  chainId: 177,
  name: "HashKey Chain",
  async getTokenOnChainData(address: string): Promise<TokenOnChainData> {
    const r = await _get(address);
    return {
      address: r.address,
      isContract: r.isContract,
      bytecodeSize: r.bytecodeSize,
      name: r.name ?? null,
      symbol: r.symbol ?? null,
      decimals: r.decimals ?? null,
      totalSupply: r.totalSupply ?? null,
      totalSupplyFormatted: r.totalSupplyFormatted ?? null,
      looksLikeERC20: "looksLikeERC20" in r ? Boolean(r.looksLikeERC20) : false,
      chainId: "chainId" in r ? (r.chainId as number) : 177,
      rpcUrl: "rpcUrl" in r ? (r.rpcUrl as string) : HSK_RPC_URL,
      note: "note" in r ? (r.note as string) : undefined,
    };
  },
  async getBytecode(address: string) {
    return rpc<string>("eth_getCode", [address.toLowerCase(), "latest"]);
  },
  async isContract(address: string) {
    const code = await rpc<string>("eth_getCode", [address.toLowerCase(), "latest"]);
    return code !== "0x" && code !== "0x0";
  },
};