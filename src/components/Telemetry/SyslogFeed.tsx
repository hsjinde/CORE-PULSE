import { Terminal } from "lucide-react";
import { useLogFeed, type LogKind } from "@/hooks/useLogFeed";
import { cn } from "@/lib/utils";

/** Telemetry 隔離色盤:ok/run 走 beacon/灰階,warn 沿用本頁既有的 amber,err 用紅(真實狀態語意)。 */
const kindTone: Record<LogKind, string> = {
	ok: "text-beacon-300",
	run: "text-chalk/80",
	warn: "text-amber-400",
	err: "text-red-400",
};

const kindTag: Record<LogKind, string> = {
	ok: "ok ",
	run: "run",
	warn: "wrn",
	err: "err",
};

/**
 * SyslogFeed — 即時事件流窗格,內容是本站真實基礎設施的模擬事件。
 * 版式對齊 Readout / ChannelLegend 的窗格 chrome(髮絲線 + carbon 底)。
 */
export function SyslogFeed({ className }: { className?: string }) {
	const lines = useLogFeed();

	return (
		<div
			className={cn(
				"w-[340px] rounded-md border border-hairline/80 bg-carbon-900/80 p-3 backdrop-blur-md",
				className,
			)}
		>
			<div className="mb-2 flex items-center justify-between">
				<div className="flex items-center gap-1.5">
					<Terminal className="h-3.5 w-3.5 text-beacon-400" strokeWidth={1.6} />
					<span className="text-[10px] uppercase tracking-wider text-chalk/80">
						syslog · core-pulse
					</span>
				</div>
				<span className="text-[9px] uppercase tracking-wider text-dim">
					tail -f
				</span>
			</div>

			<div
				role="log"
				aria-live="off"
				className="space-y-1 font-mono text-[10.5px] leading-relaxed"
			>
				{lines.map((line) => (
					<div key={line.id} className="flex gap-2 whitespace-nowrap">
						<span className="tabular-nums text-dim">{line.stamp}</span>
						<span className={cn("uppercase", kindTone[line.kind])}>
							{kindTag[line.kind]}
						</span>
						<span className="overflow-hidden text-ellipsis text-chalk/70">
							{line.text}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
