import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";

export const Route = createFileRoute("/copilot")({
  head: () => ({
    meta: [
      { title: "SentinelFi Copilot — AI Risk Analysis" },
      { name: "description", content: "Analyze any HSK Chain token with AI-powered risk scoring." },
    ],
  }),
  component: CopilotPage,
});

/* ---------- deterministic mock engine ---------- */
type RiskProfile = {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  lpLocked: string;
  topHolder: string;
  verified: string;
  mintFn: string;
  honeypot: string;
  blacklist: string;
  tax: string;
  explanation: string;
  recommendation: string;
};

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getRiskProfile(addr: string): RiskProfile {
  const h = hashString(addr.toLowerCase());
  const profiles: RiskProfile[] = [
    {
      score: 12,
      level: "LOW",
      lpLocked: "Yes · 365 days",
      topHolder: "8%",
      verified: "Yes",
      mintFn: "None",
      honeypot: "No",
      blacklist: "No",
      tax: "0%",
      explanation:
        "This token shows strong safety fundamentals. The LP is locked for a full year, supply is well distributed with no whale dominance, and the contract has no hidden mint or blacklist functions. It's been verified on-chain and shows no honeypot behavior in simulation.",
      recommendation:
        "This looks like a legitimate project with healthy tokenomics. The 365-day LP lock is a strong commitment signal. Safe to proceed, but still verify the team and roadmap independently.",
    },
    {
      score: 82,
      level: "HIGH",
      lpLocked: "No",
      topHolder: "64%",
      verified: "Yes",
      mintFn: "Found",
      honeypot: "Possible",
      blacklist: "Found",
      tax: "12% sell",
      explanation:
        "One wallet holds 64% of supply and the LP is completely unlocked — a classic rug setup. We also found a hidden mint function and blacklist capability. Sell tax spikes to 12% which traps exit liquidity.",
      recommendation:
        "Avoid this token entirely. The combination of unlocked LP, hidden mint, blacklist, and concentrated supply is a textbook exploit pattern. Do not swap into this contract.",
    },
    {
      score: 45,
      level: "MEDIUM",
      lpLocked: "Yes · 90 days",
      topHolder: "22%",
      verified: "Yes",
      mintFn: "None",
      honeypot: "No",
      blacklist: "No",
      tax: "3% buy / 3% sell",
      explanation:
        "Moderate risk profile. LP is locked but only for 90 days — short for a new project. The top holder at 22% is elevated but not catastrophic. Tax is reasonable at 3% each way. No honeypot or hidden functions detected.",
      recommendation:
        "Caution advised. The token itself isn't malicious, but the short LP lock and elevated whale concentration mean price could be volatile. Consider a small position size and set a stop-loss.",
    },
    {
      score: 96,
      level: "CRITICAL",
      lpLocked: "No",
      topHolder: "91%",
      verified: "No",
      mintFn: "Found",
      honeypot: "Yes",
      blacklist: "Found",
      tax: "25% sell",
      explanation:
        "Critical threat detected. The deployer holds 91% of supply, the contract is unverified, and our simulation confirms honeypot behavior — buys work but sells revert. A 25% sell tax plus blacklist function completes the trap.",
      recommendation:
        "This is an active scam. Do not interact with this contract under any circumstances. If you already hold tokens, do not attempt to sell — the transaction will fail and you'll lose gas.",
    },
    {
      score: 28,
      level: "LOW",
      lpLocked: "Yes · 180 days",
      topHolder: "12%",
      verified: "Yes",
      mintFn: "None",
      honeypot: "No",
      blacklist: "No",
      tax: "0%",
      explanation:
        "Clean contract with good distribution and a 180-day LP lock. No hidden functions, no taxes, and verified source code. This is the kind of baseline safety we like to see on HSK Chain.",
      recommendation:
        "Low risk profile. Good candidate for a position if the fundamentals and team check out. Always do your own research on the project roadmap and community activity.",
    },
  ];
  return profiles[h % profiles.length];
}

/* ---------- UI components ---------- */

type Message =
  | { role: "user"; content: string }
  | { role: "copilot"; content: string; profile?: RiskProfile }
  | { role: "system"; content: "scanning"; address: string };

function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "copilot",
      content:
        "Welcome to SentinelFi Copilot. Paste any HSK Chain token address and I'll run a full risk analysis — contract audit, liquidity check, whale scan, and honeypot simulation.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const addr = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: addr }]);
    setLoading(true);

    // simulate scanning delay
    setMessages((m) => [...m, { role: "system", content: "scanning", address: addr }]);
    await new Promise((r) => setTimeout(r, 2200));

    const profile = getRiskProfile(addr);
    setMessages((m) => m.filter((x) => x.role !== "system"));
    setMessages((m) => [
      ...m,
      { role: "copilot", content: profile.explanation, profile },
      { role: "copilot", content: `**Recommendation:** ${profile.recommendation}` },
    ]);
    setLoading(false);
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/50 bg-card/50 px-6 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Shield className="size-5" />
            SentinelFi
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">Copilot</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-muted-foreground">HSK Testnet</span>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-card/50 px-4 py-4 md:px-8">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste HSK token address (0x…)"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-40"
          >
            Analyze
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">
          Demo mode: any address returns a simulated risk profile. No real blockchain calls.
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === "system" && message.content === "scanning") {
    return <ScanningBubble address={message.address} />;
  }

  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-2xl px-5 py-4 text-sm leading-relaxed md:max-w-[80%] ${
          isUser
            ? "bg-primary/10 text-foreground"
            : "border border-border bg-card text-foreground/90"
        }`}
      >
        {message.role === "copilot" && message.profile && (
          <RiskReport profile={message.profile} />
        )}
        <div className={message.profile ? "mt-3" : ""}>
          <FormattedText text={isUser ? message.content : message.content} />
        </div>
      </div>
    </div>
  );
}

function RiskReport({ profile }: { profile: RiskProfile }) {
  const levelColor =
    profile.level === "LOW"
      ? "text-emerald-400"
      : profile.level === "MEDIUM"
      ? "text-amber-400"
      : profile.level === "HIGH"
      ? "text-destructive"
      : "text-destructive";

  const levelBg =
    profile.level === "LOW"
      ? "bg-emerald-400/15"
      : profile.level === "MEDIUM"
      ? "bg-amber-400/15"
      : "bg-destructive/15";

  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk Score</div>
          <div className={`text-3xl font-bold ${levelColor}`}>{profile.score}</div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelColor} ${levelBg}`}>
          {profile.level} RISK
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <ReportStat label="LP Locked" value={profile.lpLocked} />
        <ReportStat label="Top Holder" value={profile.topHolder} />
        <ReportStat label="Verified" value={profile.verified} />
        <ReportStat label="Mint Fn" value={profile.mintFn} />
        <ReportStat label="Honeypot" value={profile.honeypot} />
        <ReportStat label="Blacklist" value={profile.blacklist} />
        <ReportStat label="Tax" value={profile.tax} />
      </div>
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  const isBad =
    value.toLowerCase().includes("no") ||
    value.toLowerCase().includes("found") ||
    value.toLowerCase().includes("possible") ||
    value.toLowerCase().includes("yes") && label.toLowerCase().includes("honeypot");
  const isGood =
    value.toLowerCase().includes("yes") && !label.toLowerCase().includes("honeypot") ||
    value.toLowerCase().includes("none") ||
    value === "0%";

  const color = isGood ? "text-emerald-400" : isBad ? "text-destructive" : "text-foreground/80";
  return (
    <div className="rounded-lg border border-border bg-card/40 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-xs font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function ScanningBubble({ address }: { address: string }) {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const iv = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-2xl border border-border bg-card px-5 py-4 text-sm text-foreground/80">
        <div className="flex items-center gap-2 font-medium text-primary">
          <Activity className="size-4 animate-spin" />
          Scanning {address.slice(0, 10)}…{address.slice(-4)}
          {dots}
        </div>
        <div className="mt-3 space-y-1.5">
          <ScanStep label="Fetching contract bytecode" delay={0} />
          <ScanStep label="Detecting honeypot patterns" delay={300} />
          <ScanStep label="Analyzing LP &amp; liquidity" delay={600} />
          <ScanStep label="Checking holder distribution" delay={900} />
          <ScanStep label="Running AI risk model" delay={1200} />
        </div>
      </div>
    </div>
  );
}

function ScanStep({ label, delay }: { label: string; delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={`flex items-center gap-2 text-xs text-muted-foreground transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <CheckMini className="size-3 text-primary" />
      {label}
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-semibold text-primary">
              {line.slice(2, -2)}
            </p>
          );
        }
        return <p key={i}>{line}</p>;
      })}
    </>
  );
}

/* ---------- icons ---------- */
type IconProps = { className?: string };
function Shield({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function Activity({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 12h-2.5" />
      <path d="M12 2v2.5" />
      <path d="M12 19.5V22" />
      <path d="M4.5 12H2" />
      <path d="M19.07 4.93l-1.77 1.77" />
      <path d="M6.7 17.3l-1.77 1.77" />
      <path d="M17.3 17.3l1.77 1.77" />
      <path d="M4.93 4.93l1.77 1.77" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function CheckMini({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
