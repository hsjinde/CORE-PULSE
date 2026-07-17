import { useEffect, useState } from "react";

/**
 * Typewriter — 逐字打字機顯示。完整字串一開始就在 DOM(sr-only),
 * 螢幕閱讀器的 accessible name 不會在動畫中途變動;
 * `prefers-reduced-motion` 時直接整串顯示。
 * 模式取自 terminal-cli-control-deck 的 Typewriter。
 */
export function Typewriter({
	text,
	speed = 55,
	className = "",
}: {
	text: string;
	speed?: number;
	className?: string;
}) {
	// reduced-motion 直接整串顯示(lazy init,不在 effect 內同步 setState)
	const [count, setCount] = useState(() =>
		window.matchMedia("(prefers-reduced-motion: reduce)").matches
			? text.length
			: 0,
	);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		let i = 0;
		const timer = window.setInterval(() => {
			i += 1;
			setCount(i);
			if (i >= text.length) window.clearInterval(timer);
		}, speed);
		return () => window.clearInterval(timer);
	}, [text, speed]);

	const done = count >= text.length;

	return (
		<span className={className}>
			<span aria-hidden="true">{text.slice(0, count)}</span>
			<span
				aria-hidden="true"
				className={done ? "animate-blink" : "opacity-100"}
			>
				_
			</span>
			<span className="sr-only">{text}</span>
		</span>
	);
}
