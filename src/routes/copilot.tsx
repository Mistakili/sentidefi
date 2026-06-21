import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const Route = createFileRoute("/copilot")({
  head: () => ({
    meta: [
      { title: "SentinelFi Copilot — Live AI Risk Analysis on HSK Chain" },
      {
        name: "description",
        content:
          "Paste any HSK Chain token address. The AI Copilot fetches live on-chain data, reasons about risk, and publishes the verdict on a public registry.",
      },
    ],
  }),
  component: CopilotPage,
});

const SAMPLE_TOKENS = [
  { label: "HSK (native wrapped)", address: "0xB210D2120d57b758EE163cFfb43e73728c471Cf1" },
  { label: "USDT on HSK", address: "0xb9C5fcca50C2A8ed5Aa9Cc6Fa030f0acdc7DEd66" },
  { label: "Random EOA", address: "0x0000000000000000000000000000000000000001" },
];

function CopilotPage() {
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" })).current;
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    id: "sentinel-copilot",
    transport,
    messages: [
      {
        id: "welcome",
        role: "assistant",
        parts: [
          {
            type: "text",
            text:
              "**SentinelFi Copilot — live on HSK Chain mainnet (177).**\n\nPaste any token address and I'll fetch on-chain data, reason about it, and publish a verdict to the public scan registry. Try one of the sample tokens below.",
          },
        ],
      } as UIMessage,
    ],
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  const submit = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput("");
    await sendMessage({ text: text.trim() });
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border/50 bg-card/50 px-6 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-primary">
            <ShieldIcon className="size-5" />
            SentinelFi
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">Copilot</span>
          <span className="ml-2 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            Live
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-muted-foreground">HSK Mainnet · chainId 177</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg) => (
            <MessageView key={msg.id} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <ThinkingBubble />
          )}
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error.message || "Something went wrong. Try again."}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border/50 bg-card/50 px-4 py-4 md:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 flex flex-wrap gap-2">
            {SAMPLE_TOKENS.map((t) => (
              <button
                key={t.address}
                onClick={() => submit(t.address)}
                disabled={isLoading}
                className="rounded-full border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-40"
              >
                {t.label}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste HSK token address (0x…) or ask a question"
              autoFocus
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
            >
              {isLoading ? "Analyzing…" : "Analyze"}
            </button>
          </form>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Live mode: real eth_call to HSK mainnet RPC · verdicts published to public registry
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageView({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-2xl px-5 py-4 text-sm leading-relaxed md:max-w-[85%] ${
          isUser
            ? "bg-primary/10 text-foreground"
            : "border border-border bg-card text-foreground/90"
        }`}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <div key={i} className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
              </div>
            );
          }
          if (part.type?.startsWith("tool-")) {
            return <ToolView key={i} part={part as ToolPart} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}

type ToolPart = {
  type: string;
  toolCallId?: string;
  state?: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

function ToolView({ part }: { part: ToolPart }) {
  const toolName = part.type.replace(/^tool-/, "");
  const running = part.state !== "output-available" && part.state !== "output-error";
  const isVerdict = toolName === "saveRiskVerdict";
  const isFetch = toolName === "getTokenOnChainData";

  if (isVerdict && part.state === "output-available") {
    const v = part.input as {
      score: number;
      level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      summary: string;
      reasonCodes: string[];
      tokenName?: string | null;
      tokenSymbol?: string | null;
      address: string;
      txHash?: string | null;
    };
    return <VerdictCard verdict={v} />;
  }

  if (toolName === "publishOnChain" && part.state === "output-available") {
    const out = part.output as
      | { ok: true; txHash: string; explorerUrl: string; attestor: string; registry: string }
      | { ok: false; error: string; configRequired?: boolean };
    return <OnChainCard result={out} />;
  }

  return (
    <div className="my-3 rounded-lg border border-border bg-background/60 px-3 py-2 text-xs">
      <div className="flex items-center gap-2 font-mono text-muted-foreground">
        {running ? (
          <ActivityIcon className="size-3 animate-spin text-primary" />
        ) : (
          <CheckIcon className="size-3 text-emerald-400" />
        )}
        <span className="text-foreground">
          {isFetch ? "Fetching on-chain data" : `Calling ${toolName}`}
          {running ? "…" : " ✓"}
        </span>
      </div>
      {part.state === "output-available" && isFetch && (
        <pre className="mt-2 overflow-x-auto rounded bg-card/60 p-2 text-[10px] text-foreground/70">
          {JSON.stringify(part.output, null, 2)}
        </pre>
      )}
      {part.state === "output-error" && (
        <div className="mt-1 text-destructive">{part.errorText || "Tool error"}</div>
      )}
    </div>
  );
}

function VerdictCard({
  verdict,
}: {
  verdict: {
    score: number;
    level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    summary: string;
    reasonCodes: string[];
    tokenName?: string | null;
    tokenSymbol?: string | null;
    address: string;
    txHash?: string | null;
  };
}) {
  const color =
    verdict.level === "LOW"
      ? "text-emerald-400"
      : verdict.level === "MEDIUM"
      ? "text-amber-400"
      : "text-destructive";
  const bg =
    verdict.level === "LOW"
      ? "bg-emerald-400/15"
      : verdict.level === "MEDIUM"
      ? "bg-amber-400/15"
      : "bg-destructive/15";
  return (
    <div className="my-3 rounded-xl border border-border bg-background/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Verdict published to registry
          </div>
          <div className="mt-1 text-sm font-semibold">
            {verdict.tokenName || "Unknown"}{" "}
            {verdict.tokenSymbol && (
              <span className="text-muted-foreground">({verdict.tokenSymbol})</span>
            )}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">
            {verdict.address.slice(0, 10)}…{verdict.address.slice(-6)}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${color}`}>{verdict.score}</div>
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${color} ${bg}`}>
            {verdict.level}
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {verdict.reasonCodes.map((r) => (
          <span key={r} className="rounded border border-border bg-card/50 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}

function OnChainCard({
  result,
}: {
  result:
    | { ok: true; txHash: string; explorerUrl: string; attestor: string; registry: string }
    | { ok: false; error: string; configRequired?: boolean };
}) {
  if (!result.ok) {
    if (result.configRequired) {
      return (
        <div className="my-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          <div className="font-semibold">On-chain attestation skipped</div>
          <div className="mt-1 text-amber-100/70">
            RiskRegistry contract not yet deployed. Off-chain verdict still published to public feed.
          </div>
        </div>
      );
    }
    return (
      <div className="my-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
        On-chain publish failed: {result.error}
      </div>
    );
  }
  return (
    <div className="my-3 rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3 text-xs">
      <div className="flex items-center gap-2 font-semibold text-emerald-300">
        <CheckIcon className="size-3" />
        Attested on HSK testnet
      </div>
      <div className="mt-2 space-y-1 font-mono text-[10px] text-emerald-100/70">
        <div>
          tx: <a className="text-emerald-300 underline-offset-4 hover:underline" href={result.explorerUrl} target="_blank" rel="noreferrer">{result.txHash.slice(0, 14)}…{result.txHash.slice(-8)}</a>
        </div>
        <div>registry: {result.registry.slice(0, 10)}…{result.registry.slice(-6)}</div>
        <div>attestor: {result.attestor.slice(0, 10)}…{result.attestor.slice(-6)}</div>
      </div>
    </div>
  );
}
function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl border border-border bg-card px-5 py-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <ActivityIcon className="size-4 animate-spin text-primary" />
          Thinking…
        </div>
      </div>
    </div>
  );
}

/* icons */
type IconProps = { className?: string };
function ShieldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function ActivityIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" opacity="0.3" />
      <path d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  );
}
function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}