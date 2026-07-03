import { describe, it, expect, beforeEach } from 'vitest';
import {
  clampMascotY, loadMascotY, saveMascotY, panelOpensUpward,
  EDGE_MARGIN, MASCOT_SIZE,
} from '@/components/Mascot/mascotPosition';

describe('clampMascotY', () => {
  it('clamps into [margin, vh - size - margin]', () => {
    expect(clampMascotY(-100, 800)).toBe(EDGE_MARGIN);
    expect(clampMascotY(10000, 800)).toBe(800 - MASCOT_SIZE - EDGE_MARGIN);
    expect(clampMascotY(400, 800)).toBe(400);
  });

  it('degenerates safely on tiny viewports', () => {
    expect(clampMascotY(50, 60)).toBe(EDGE_MARGIN);
  });
});

describe('load/save mascot Y', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips through localStorage with clamping', () => {
    saveMascotY(3000);
    expect(loadMascotY(800)).toBe(800 - MASCOT_SIZE - EDGE_MARGIN);
  });

  it('returns null when nothing stored or value invalid', () => {
    expect(loadMascotY(800)).toBeNull();
    localStorage.setItem('mascot-y', 'not-a-number');
    expect(loadMascotY(800)).toBeNull();
  });
});

describe('panelOpensUpward', () => {
  it('opens upward when mascot center is in the bottom half', () => {
    expect(panelOpensUpward(700, 800)).toBe(true);
    expect(panelOpensUpward(100, 800)).toBe(false);
  });
});
