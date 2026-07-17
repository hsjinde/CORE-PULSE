import { cn } from "@/lib/utils";

/**
 * AsciiMeter — 等寬字元儀表 `[|||||||.....]`,取代 SVG/漸層進度條。
 * 純字形就是重點:raw data 視覺,取自 terminal-cli-control-deck 的 AsciiBar 模式。
 * `value` 為 0–1。
 */
export function AsciiMeter({
	value,
	cells = 18,
	className,
}: {
	value: number;
	cells?: number;
	className?: string;
}) {
	const v = Math.max(0, Math.min(1, value));
	const filled = Math.round(v * cells);

	return (
		<div
			role="meter"
			aria-valuenow={Math.round(v * 100)}
			aria-valuemin={0}
			aria-valuemax={100}
			className={cn(
				"font-mono text-[11px] leading-none tracking-tight",
				className,
			)}
		>
			<span aria-hidden className="text-dim">
				[
			</span>
			<span aria-hidden className="text-beacon-300">
				{"|".repeat(filled)}
			</span>
			<span aria-hidden className="text-carbon-500">
				{".".repeat(cells - filled)}
			</span>
			<span aria-hidden className="text-dim">
				]
			</span>
		</div>
	);
}
