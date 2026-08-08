import { cn } from "@/lib/utils";

/**
 * AsciiMeter — 等寬字元儀表 `[|||||||.....]`,取代 SVG/漸層進度條。
 * 純字形就是重點:raw data 視覺,取自 terminal-cli-control-deck 的 AsciiBar 模式。
 * `value` 為 0–1。
 */
export function AsciiMeter({
	value,
	label,
	cells = 18,
	className,
}: {
	value: number;
	/** 無障礙名稱。role="meter" 一定要有名字(WCAG 1.1.1),所以刻意設成必填
	 *  —— 給預設值等於讓下一個沒填的呼叫端無聲通過。 */
	label: string;
	cells?: number;
	className?: string;
}) {
	const v = Math.max(0, Math.min(1, value));
	const filled = Math.round(v * cells);
	const pct = Math.round(v * 100);

	return (
		<div
			role="meter"
			aria-label={label}
			aria-valuenow={pct}
			aria-valuemin={0}
			aria-valuemax={100}
			/* 條狀字元對讀屏是噪音,給一個唸得出來的值 */
			aria-valuetext={`${pct}%`}
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
