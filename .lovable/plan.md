
# HSK Hackathon Build Plan: "SentinelFi" — AI Risk Copilot for HSK DeFi

## Why this wins
- **Hits both tracks** (DeFi + AI) — judges reward convergence projects, doubling prize eligibility.
- **Solves a real, fresh problem on HSK**: HSK Chain is new, users don't know which pools/tokens are safe. A risk layer is infrastructure every future HSK dApp needs.
- **Demoable in 3 weeks** with a small team — no need to bootstrap liquidity or users.
- **Incubation-friendly narrative**: "Chainalysis + Nansen + an AI agent, native to HSK."

## What we build

### 1. On-chain risk engine (DeFi track)
A smart contract registry on HSK Chain that scores tokens, LP pools, and wallets:
- Liquidity depth, LP lock status, holder concentration, contract verification, honeypot/mint/blacklist function detection
- Stored on-chain as a tamper-proof `RiskScore(address) → uint8 + reasonCodes`
- Other HSK dApps can call `getScore(token)` as a public good primitive

### 2. AI Copilot (AI track)
A chat agent that:
- Explains risk scores in plain language ("This pool's top wallet holds 64% of supply — rug risk")
- Simulates user trades before signing ("If you swap 1 HSK → TOKEN_X, expected slippage 12%, price impact moves you into red zone")
- Auto-suggests safer alternatives on HSK
- Uses Lovable AI Gateway (Gemini / GPT) with function-calling into the on-chain risk contract + HSK RPC

### 3. One-click "Safe Swap" widget
Embeddable React widget any HSK dApp can drop in:
- Wraps a swap with a pre-trade AI risk check
- Blocks/warns on high-risk tokens
- This is the "infrastructure" story for judges

## User flow for the demo
1. User connects wallet on our dApp
2. Pastes a HSK token address → instant risk score + AI breakdown
3. Opens "Safe Swap" → tries to swap into a risky token → Copilot intervenes with explanation + safer suggestion
4. Shows the on-chain `RiskScore` being read by a sample 3rd-party contract — proves the infra angle

## Tech stack
- **Frontend**: this Lovable project (TanStack Start + Tailwind)
- **Backend**: Lovable Cloud (auth, caching scores, chat history)
- **AI**: Lovable AI Gateway with tool/function calling
- **Smart contracts**: Solidity on HSK Chain testnet (Risk Registry + Safe Swap router wrapping HSK's main DEX)
- **Indexer**: lightweight server function polling HSK RPC for liquidity / holder data

## 3-week timeline
- **Week 1 (now → Jun 28)**: Smart contracts on HSK testnet, basic risk-scoring heuristics, wallet connect UI
- **Week 2 (Jun 29 → Jul 5)**: AI Copilot with tool calls, risk explanation UI, Safe Swap widget
- **Week 3 (Jul 6 → Jul 11)**: Polish, demo video, deploy, submit before Jul 11 deadline
- **Jul 13–14**: Live pitch in Japan (or online)

## Submission deliverables checklist
- GitHub repo (public)
- Deployed demo URL (Lovable publish)
- 3-min demo video
- Pitch deck (problem → solution → HSK-native infra angle → traction plan)
- HSK testnet contract addresses

## Open questions before we start coding
1. Team size & skills — do we have a Solidity dev, or do I scaffold contracts too?
2. Live demo in Japan or online only?
3. Want me to start with the **smart contract + risk engine** first, or the **AI Copilot UI** first?

Approve this plan and I'll start building immediately — recommend kicking off with the frontend shell + AI Copilot since that's our highest-leverage piece in Lovable.
