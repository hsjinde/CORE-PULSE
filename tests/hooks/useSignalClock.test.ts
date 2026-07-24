import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSignalClock } from "../../src/hooks/useSignalClock";

describe("useSignalClock hook", () => {
	beforeEach(() => {
		vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
			return setTimeout(() => cb(Date.now()), 16);
		});
		/* 上面的 rAF stub 回傳的是 setTimeout 的 handle,不是真的 rAF id,
		   所以型別跟著 setTimeout 走(Node 下是 Timeout,瀏覽器下是 number)。 */
		vi.stubGlobal("cancelAnimationFrame", (id: ReturnType<typeof setTimeout>) => {
			clearTimeout(id);
		});
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("should initialize with default sample values", () => {
		const { result } = renderHook(() => useSignalClock());

		expect(result.current.t).toBe(0);
		expect(result.current.fps).toBe(60);
		expect(result.current.phase).toBe(0);
		expect(result.current.freq).toBe(0.5);
		expect(result.current.frames).toBe(0);
	});

	it("should update state on timer tick", async () => {
		const { result } = renderHook(() => useSignalClock());

		// Advance time by 200ms to trigger multiple frames and exceed the 80ms commit limit
		await act(async () => {
			vi.advanceTimersByTime(200);
		});

		// The timer advances, frames count should increase and time t should change
		expect(result.current.frames).toBeGreaterThan(0);
		expect(result.current.t).toBeGreaterThan(0);
		expect(result.current.phase).toBeGreaterThanOrEqual(0);
		expect(result.current.freq).toBeGreaterThanOrEqual(0);
	});
});
