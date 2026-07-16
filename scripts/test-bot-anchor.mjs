/**
 * End-to-end BOT testnet smoke test: RPC read + trust eval + sign + anchor.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { JsonRpcProvider, Wallet, Contract, keccak256, toUtf8Bytes } from "ethers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (m) process.env[m[1]] = m[2];
}

const RPC = process.env.BOTCHAIN_RPC_URL;
const CHAIN_ID = Number(process.env.BOTCHAIN_CHAIN_ID);
const REGISTRY = process.env.BOTCHAIN_REGISTRY_ADDRESS;
const PK = process.env.BOTCHAIN_ATTESTOR_PRIVATE_KEY;
const contract = "0x0000000000000000000000000000000000000001";

// --- RPC read (adapter logic) ---
const rpcRes = await fetch(RPC, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "eth_getCode",
    params: [contract, "latest"],
  }),
});
const rpcJson = await rpcRes.json();
const code = rpcJson.result;
const isContract = code !== "0x" && code !== "0x0";
console.log("RPC read OK — isContract:", isContract, "chainId:", CHAIN_ID);

// --- Sign attestation ---
const wallet = new Wallet(PK);
const receiptId = crypto.randomUUID();
const reasoning = ["Address is a deployed contract.", "Phase 1 heuristics on BOT testnet."];
const reasoningHash = keccak256(toUtf8Bytes(JSON.stringify(reasoning)));
const payload = [
  "sentinelfi-safety-attestation/v2",
  receiptId,
  new Date().toISOString(),
  String(CHAIN_ID),
  contract,
  "",
  "smoke-test",
  "swap",
  "10",
  "ALLOW",
  "A",
  "Proceed",
  "LOW",
  "85",
  JSON.stringify({ isContract: true, hasERC20Metadata: false, bytecodeSizeOk: true, verifiedContract: false, knownExploit: false }),
  reasoningHash,
].join("|");
const signature = await wallet.signMessage(payload);
console.log("Attestation signed — attestor:", wallet.address);

// --- Anchor on-chain ---
const REGISTRY_ABI = [
  "function anchorAttestation(bytes32 attestationId, bytes32 payloadHash) external",
];
const provider = new JsonRpcProvider(RPC, CHAIN_ID);
const signer = new Wallet(PK, provider);
const registry = new Contract(REGISTRY, REGISTRY_ABI, signer);
const attestationId =
  "0x" + Buffer.from(receiptId, "utf8").toString("hex").padStart(64, "0").slice(-64);
const payloadHash = keccak256(toUtf8Bytes([receiptId, reasoningHash, signature].join("|")));
const tx = await registry.anchorAttestation(attestationId, payloadHash);
await tx.wait();
console.log("Anchored on-chain — tx:", tx.hash);
console.log("Explorer:", `${process.env.BOTCHAIN_EXPLORER}/tx/${tx.hash}`);
console.log("\n✓ Full BOT testnet flow complete");