import { createFileRoute } from "@tanstack/react-router";

const DEFAULT_OG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#120f18"/>
      <stop offset="50%" stop-color="#241833"/>
      <stop offset="100%" stop-color="#6d4aff"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="80" y="280" font-family="system-ui,sans-serif" font-size="72" font-weight="700" fill="#ffffff">CollabLand</text>
  <text x="80" y="360" font-family="system-ui,sans-serif" font-size="36" fill="#d4c4ff">Fais tes morceaux à plusieurs</text>
</svg>`;

export const Route = createFileRoute("/og/default")({
  server: {
    handlers: {
      GET: async () =>
        new Response(DEFAULT_OG, {
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        }),
    },
  },
});
