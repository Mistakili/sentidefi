/**
 * Deploy RiskRegistry.sol to BOT Chain Testnet (chainId 968).
 *
 * Usage:
 *   BOTCHAIN_ATTESTOR_PRIVATE_KEY=0x… npm run deploy:botchain-registry
 *
 * Optional:
 *   BOTCHAIN_RPC_URL          (default: https://rpc.bohr.life)
 *   BOTCHAIN_ATTESTOR_ADDRESS (default: deployer address)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";
import { JsonRpcProvider, Wallet, ContractFactory } from "ethers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const RPC = process.env.BOTCHAIN_RPC_URL ?? "https://rpc.bohr.life";
const CHAIN_ID = Number(process.env.BOTCHAIN_CHAIN_ID ?? 968);
const EXPLORER = process.env.BOTCHAIN_EXPLORER ?? "https://scan.bohr.life";

function compile() {
  const source = readFileSync(resolve(ROOT, "contracts/RiskRegistry.sol"), "utf8");
  const input = {
    language: "Solidity",
    sources: { "RiskRegistry.sol": { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  if (output.errors?.length) {
    const fatal = output.errors.filter((e) => e.severity === "error");
    if (fatal.length) {
      throw new Error(fatal.map((e) => e.formattedMessage).join("\n"));
    }
  }
  const artifact = output.contracts["RiskRegistry.sol"].RiskRegistry;
  return {
    abi: artifact.abi,
    bytecode: `0x${artifact.evm.bytecode.object}`,
  };
}

async function main() {
  const pk =
    process.env.BOTCHAIN_DEPLOYER_PRIVATE_KEY ??
    process.env.BOTCHAIN_ATTESTOR_PRIVATE_KEY ??
    process.env.HSK_ATTESTOR_PRIVATE_KEY;
  if (!pk) {
    console.error(
      "Missing deployer key. Set BOTCHAIN_ATTESTOR_PRIVATE_KEY (or BOTCHAIN_DEPLOYER_PRIVATE_KEY).",
    );
    process.exit(1);
  }

  const provider = new JsonRpcProvider(RPC, CHAIN_ID);
  const wallet = new Wallet(pk, provider);
  const network = await provider.getNetwork();
  const balance = await provider.getBalance(wallet.address);

  console.log("Network chainId:", Number(network.chainId));
  console.log("Deployer:", wallet.address);
  console.log("Balance:", balance.toString(), "wei");

  if (balance === 0n) {
    console.error("Deployer has zero balance — fund the wallet on BOT testnet first.");
    process.exit(1);
  }

  const attestor = process.env.BOTCHAIN_ATTESTOR_ADDRESS ?? wallet.address;
  const { abi, bytecode } = compile();
  const factory = new ContractFactory(abi, bytecode, wallet);

  console.log("Deploying RiskRegistry with initial attestor:", attestor);
  const contract = await factory.deploy(attestor);
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  const deployment = {
    chainId: CHAIN_ID,
    rpcUrl: RPC,
    explorer: EXPLORER,
    registry: address,
    attestor,
    deployer: wallet.address,
    deployedAt: new Date().toISOString(),
  };

  writeFileSync(resolve(ROOT, "contracts/deployments.botchain-testnet.json"), JSON.stringify(deployment, null, 2));

  console.log("\n✓ RiskRegistry deployed");
  console.log("  Address:  ", address);
  console.log("  Explorer: ", `${EXPLORER}/address/${address}`);
  console.log("\nAdd to .env / Lovable secrets:");
  console.log(`  BOTCHAIN_RPC_URL=${RPC}`);
  console.log(`  BOTCHAIN_CHAIN_ID=${CHAIN_ID}`);
  console.log(`  BOTCHAIN_REGISTRY_ADDRESS=${address}`);
  console.log(`  BOTCHAIN_EXPLORER=${EXPLORER}`);
  console.log(`  BOTCHAIN_ATTESTOR_PRIVATE_KEY=<same key used to deploy>`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});