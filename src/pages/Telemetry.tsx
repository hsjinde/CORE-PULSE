import { CircleDot, Crosshair, SignalHigh, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ChannelLegend } from "@/components/Telemetry/ChannelLegend";
import { Readout } from "@/components/Telemetry/Readout";
import { ReticleFrame } from "@/components/Telemetry/Reticle";
import { ScopeDeck } from "@/components/Telemetry/ScopeDeck";
import { ShaderComponent } from "@/components/ui/waves-shader";
import { useSignalClock } from "@/hooks/useSignalClock";

/**
 * Telemetry — a SRE waveform observation deck.
 *
 * This page acts as the live telemetry signal analyzer for the personal brand site.
 * It integrates a WebGL coswarp interference field quad in the background,
 * overlayed with dynamic HUD data, signal channels, and a scope deck,
 * all running on a unified requestAnimationFrame clock.
 */
export default function Telemetry() {
	const sample = useSignalClock();

	return (
		<main className="relative h-screen w-screen overflow-hidden bg-black text-white">
			{/* ── Layer 0: the live WebGL field ─────────────────────────────────── */}
			<div className="absolute inset-0 z-0">
				<ShaderComponent />
			</div>

			{/* ── Layer 1: tube treatment (CRT Scanlines + Vignette + Scrims) ── */}
			<div className="scanlines pointer-events-none absolute inset-0 z-10 opacity-30" />
			<div
				className="pointer-events-none absolute inset-0 z-10"
				style={{
					background:
						"radial-gradient(120% 90% at 50% 50%, transparent 48%, rgba(5,6,8,0.65) 85%, rgba(5,6,8,0.95) 100%)",
				}}
			/>
			<div className="grain pointer-events-none absolute inset-0 z-10 opacity-[0.03]" />
			
			{/* Top & Bottom dark scrims for legibility */}
			<div
				className="pointer-events-none absolute inset-x-0 top-0 z-10 h-56"
				style={{
					background:
						"linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
				}}
			/>
			<div
				className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-64"
				style={{
					background:
						"linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 60%, transparent 100%)",
				}}
			/>

			{/* ── Layer 2: instrument framing (Reticle brackets) ──────────────── */}
			<div className="pointer-events-none absolute inset-4 z-20 rounded-lg ring-1 ring-inset ring-beacon-400/10 sm:inset-6">
				<ReticleFrame />
			</div>

			{/* ── Layer 3: the console chrome ────────────────────────────────── */}
			<div className="pointer-events-none absolute inset-0 z-30 flex flex-col p-4 sm:p-7 justify-between">
				{/* Masthead */}
				<header className="flex items-start justify-between gap-4">
					<div className="animate-rise">
						<div className="mb-2 flex items-center gap-2 text-beacon-400">
							<CircleDot className="h-4 w-4 animate-blink" strokeWidth={1.8} />
							<span className="text-[10px] uppercase tracking-wider opacity-70">
								SRE Telemetry Center
							</span>
						</div>
						<h1 className="font-mono text-3xl font-medium tracking-tight glow-beacon sm:text-5xl">
							CORE.OSCILLON
						</h1>
						<p className="mt-2 max-w-xs text-balance text-[10px] uppercase tracking-wider text-dim sm:text-xs">
							Live Signal Analyser · GPU Coswarp Domain Trace
						</p>
					</div>

					{/* Navigation & Mode Plate */}
					<div className="flex flex-col sm:flex-row gap-3 items-end sm:items-start animate-rise">
						{/* Mode Plate */}
						<div className="rounded-md border border-hairline/80 bg-carbon-900/80 px-3 py-2 backdrop-blur-md">
							<div className="flex items-center gap-2">
								<SignalHigh className="h-3.5 w-3.5 text-beacon-400" strokeWidth={1.8} />
								<span className="text-[10px] uppercase tracking-wider text-chalk/80">
									XY · free-run
								</span>
							</div>
							<div className="mt-1 flex items-center gap-2 text-[9px] uppercase tracking-wider text-dim">
								<Crosshair className="h-3 w-3" strokeWidth={1.6} />
								grid 10× / 20×
							</div>
						</div>

						{/* Return to Base Button */}
						<Link
							to="/"
							className="pointer-events-auto flex items-center gap-1.5 rounded-md border border-hairline/80 bg-carbon-900/80 px-3 py-2 text-[10px] uppercase tracking-wider text-chalk/80 backdrop-blur-md transition-all hover:bg-carbon-800/80 hover:border-beacon-400/40 hover:text-beacon-300"
						>
							<ArrowLeft className="h-3.5 w-3.5" />
							Return Base
						</Link>
					</div>
				</header>

				{/* Mid band: live readout (left) + channel legend (right). */}
				<div className="flex flex-1 items-center justify-between gap-4 my-4">
					<div className="pointer-events-auto animate-fade-in">
						<Readout sample={sample} />
					</div>
					<div className="pointer-events-auto hidden animate-fade-in sm:block">
						<ChannelLegend sample={sample} />
					</div>
				</div>

				{/* Base: the telemetry deck. */}
				<footer className="pointer-events-auto animate-rise">
					<ScopeDeck sample={sample} />
				</footer>
			</div>
		</main>
	);
}
