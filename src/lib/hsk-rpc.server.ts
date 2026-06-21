// Minimal HSK Chain RPC helpers — ERC20 metadata via eth_call.
// HSK Chain (HashKey Chain) mainnet: chainId 177
// Public RPC endpoint
const HSK_RPC_URL = "https://mainnet.hsk.xyz";

type RpcResponse<T> = { result?: T; error?: { code: number; message: string } };

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(HSK_RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`HSK RPC ${method} failed: ${res.status}`);
  const json = (await res.json()) as RpcResponse<T>;
  if (json.error) throw new Error(`HSK RPC ${method}: ${json.error.message}`);
  return json.result as T;
}

function decodeString(hex: string): string {
  if (!hex || hex === "0x") return "";
  const data = hex.startsWith("0x") ? hex.slice(2) : hex;
  // ABI-encoded string: offset (32) + length (32) + data
  // Some non-compliant tokens return bytes32 directly — handle both.
  if (data.length === 64) {
    // bytes32 — strip trailing zeros
    const bytes = Buffer.from(data, "hex");
    return bytes.toString("utf8").replace(/\0+$/, "");
  }
  try {
    const len = parseInt(data.slice(64, 128), 16);
    const strHex = data.slice(128, 128 + len * 2);
    return Buffer.from(strHex, "hex").toString("utf8");
  } catch {
    return "";
  }
}

function decodeUint(hex: string): bigint {
  if (!hex || hex === "0x") return 0n;
  return BigInt(hex);
}

async function ethCall(to: string, data: string): Promise<string> {
  return rpc<string>("eth_call", [{ to, data }, "latest"]);
}

export async function getTokenOnChainData(address: string) {
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
      note: "Address is an EOA (regular wallet), not a smart contract.",
    };
  }

  // ERC20 selectors
  const selectors = {
    name: "0x06fdde03",
    symbol: "0x95d89b41",
    decimals: "0x313ce567",
    totalSupply: "0x18160ddd",
  };

  const settle = async <T>(p: Promise<T>): Promise<T | null> => {
    try { return await p; } catch { return null; }
  };

  const [nameHex, symbolHex, decimalsHex, supplyHex] = await Promise.all([
    settle(ethCall(addr, selectors.name)),
    settle(ethCall(addr, selectors.symbol)),
    settle(ethCall(addr, selectors.decimals)),
    settle(ethCall(addr, selectors.totalSupply)),
  ]);

  const decimals = decimalsHex ? Number(decodeUint(decimalsHex)) : null;
  const totalSupplyRaw = supplyHex ? decodeUint(supplyHex) : null;

  return {
    address: addr,
    isContract: true,
    bytecodeSize,
    name: nameHex ? decodeString(nameHex) || null : null,
    symbol: symbolHex ? decodeString(symbolHex) || null : null,
    decimals,
    totalSupply: totalSupplyRaw !== null ? totalSupplyRaw.toString() : null,
    totalSupplyFormatted:
      totalSupplyRaw !== null && decimals !== null
        ? (Number(totalSupplyRaw) / 10 ** decimals).toLocaleString()
        : null,
    looksLikeERC20: !!(nameHex && symbolHex && decimalsHex && supplyHex),
    rpcUrl: HSK_RPC_URL,
    chainId: 177,
  };
}