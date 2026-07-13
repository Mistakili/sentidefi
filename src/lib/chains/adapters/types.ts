// Chain-agnostic surface for the Trust API.
// Every EVM we support implements this small interface — adding a new chain
// is a single adapter file plus one entry in src/lib/chains.ts.

export type TokenOnChainData = {
  address: string;
  isContract: boolean;
  bytecodeSize: number;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  totalSupply: string | null;
  totalSupplyFormatted?: string | null;
  looksLikeERC20: boolean;
  chainId: number;
  rpcUrl?: string;
  note?: string;
};

export type ChainAdapter = {
  chainId: number;
  name: string;
  /** ERC20 metadata + contract/EOA + bytecode size. */
  getTokenOnChainData(address: string): Promise<TokenOnChainData>;
  /** Raw bytecode via eth_getCode. */
  getBytecode(address: string): Promise<string>;
  /** True if address holds bytecode. */
  isContract(address: string): Promise<boolean>;
};