import { useEffect, useRef, useState } from "react";

export type LogKind = "ok" | "run" | "warn" | "err";

export interface LogLine {
	kind: LogKind;
	text: string;
}

export interface FeedEntry extends LogLine {
	id: number;
	stamp: string;
}

/** 這個站自己的基礎設施事件 —— 內容對齊真實架構(Pages Functions / D1 / SSE chat)。 */
const LOG_TEMPLATES: LogLine[] = [
	{ kind: "ok", text: "edge: cache HIT 97.3% (300s window)" },
	{ kind: "run", text: "d1: SELECT posts ORDER BY date — 3 rows, 11ms" },
	{ kind: "ok", text: "chat: SSE stream closed, 482 tokens delivered" },
	{ kind: "run", text: "gen-wiki: 9 docs inlined → _wiki-gen.ts" },
	{ kind: "ok", text: "auth: cp_session verified (exp t+6h12m)" },
	{ kind: "warn", text: "llm: upstream p95 latency 2.4s — degraded" },
	{ kind: "ok", text: "tls: *.19980803.xyz valid, 82d remaining" },
	{ kind: "run", text: "deploy: wrangler pages publish dist/ → main" },
	{ kind: "warn", text: "rate-limit: ip 8f3a·· at 28/30 daily quota" },
	{ kind: "err", text: "auth: 401 /api/posts — session expired" },
	{ kind: "ok", text: "edge-hkg-01: 0 5xx in last 300s window" },
	{ kind: "run", text: "sanitizer: history trimmed to last 6 turns" },
];

const pad = (n: number) => n.toString().padStart(2, "0");
const clock = (d: Date) =>
	`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

/**
 * 自走式 syslog feed:每 `interval` ms 推入一行隨機事件,保留最近 `max` 行。
 * 分頁隱藏時暫停(不浪費 cycles);掛載時先種入幾行,窗格永遠不會是空的。
 * 模式取自 terminal-cli-control-deck 參考資源的 useLogFeed。
 */
export function useLogFeed({
	interval = 2200,
	max = 8,
}: { interval?: number; max?: number } = {}) {
	const [lines, setLines] = useState<FeedEntry[]>([]);
	const idRef = useRef(0);
	const cursorRef = useRef(-1);

	useEffect(() => {
		// 隨機起點延後到 effect 內取,維持 render 純度
		if (cursorRef.current < 0)
			cursorRef.current = Math.floor(Math.random() * LOG_TEMPLATES.length);
		const push = () => {
			// 順序輪播 + 隨機起點:比純隨機少重複,又不需要 shuffle state
			cursorRef.current = (cursorRef.current + 1) % LOG_TEMPLATES.length;
			const tpl = LOG_TEMPLATES[cursorRef.current];
			// id 要在 setLines 外先取值:updater 是延後執行的,連續 push 時
			// 直接讀 idRef.current 會讓多個 updater 拿到同一個值(重複 key)
			idRef.current += 1;
			const id = idRef.current;
			setLines((prev) =>
				[...prev, { ...tpl, id, stamp: clock(new Date()) }].slice(-max),
			);
		};

		for (let i = 0; i < 4; i += 1) push();
		const timer = window.setInterval(() => {
			if (!document.hidden) push();
		}, interval);
		return () => window.clearInterval(timer);
	}, [interval, max]);

	return lines;
}
