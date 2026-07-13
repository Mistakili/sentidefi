import { createFileRoute } from "@tanstack/react-router";

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string),
  );
}

function badge(grade: string | null): string {
  const hasGrade = grade && /^[A-F]$/.test(grade);
  const width = hasGrade ? 220 : 180;
  const gradeColor =
    grade === "A" || grade === "B" ? "#10b981" : grade === "C" ? "#eab308" : "#ef4444";
  const gradeBlock = hasGrade
    ? `<line x1="150" y1="8" x2="150" y2="32" stroke="#1e293b"/>
  <text x="162" y="18" fill="#94a3b8" font-family="ui-sans-serif,system-ui,sans-serif" font-size="8" font-weight="700" letter-spacing="1.2">GRADE</text>
  <text x="162" y="32" fill="${gradeColor}" font-family="ui-sans-serif,system-ui,sans-serif" font-size="16" font-weight="800">${esc(grade!)}</text>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="40" viewBox="0 0 ${width} 40" role="img" aria-label="SentinelFi Verified">
  <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#0f172a"/><stop offset="1" stop-color="#020617"/></linearGradient></defs>
  <rect width="${width}" height="40" rx="8" fill="url(#g)" stroke="#1e293b"/>
  <g transform="translate(12,10)">
    <path d="M10 0 L20 4 V10 C20 16 15 20 10 20 C5 20 0 16 0 10 V4 Z" fill="#10b981"/>
    <path d="M6 10 L9 13 L14 7" stroke="#02120a" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="42" y="18" fill="#94a3b8" font-family="ui-sans-serif,system-ui,sans-serif" font-size="9" font-weight="700" letter-spacing="1.2">SENTINELFI</text>
  <text x="42" y="31" fill="#f8fafc" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" font-weight="700">Verified</text>
  ${gradeBlock}
</svg>`;
}

export const Route = createFileRoute("/api/v1/verified/badge.svg")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const grade = url.searchParams.get("grade");
        return new Response(badge(grade), {
          status: 200,
          headers: {
            "content-type": "image/svg+xml; charset=utf-8",
            "cache-control": "public, max-age=300",
            "access-control-allow-origin": "*",
          },
        });
      },
    },
  },
});