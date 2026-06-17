import { describe, it, expect } from 'vitest';
import { simulateMatch } from '../lib/matchSim';
import type { Player, GameConfig } from '../types';

const gk: Player = { n: 'GK', pos: 'GK', ovr: 88, val: 30, nat: 'Brazil', club: 'Test' };
const mid: Player = { n: 'MID', pos: 'MID', ovr: 88, val: 80, nat: 'England', club: 'Test', s: [72, 80, 86, 84, 78, 76] };
const fwd: Player = { n: 'FWD', pos: 'FWD', ovr: 90, val: 100, nat: 'France', club: 'Test', s: [90, 90, 80, 88, 40, 76] };

const cfg: GameConfig = {
  home: { name: 'Home', isCPU: false },
  away: { name: 'Away', isCPU: true, difficulty: 'Pro' },
  squadSize: 3,
  budget: 85,
  budgetTier: 'Balanced',
  draftMode: 'classic',
};

describe('simulateMatch', () => {
  it('goals are in range 0–7', () => {
    const r = simulateMatch([gk, mid, fwd], [gk, mid, fwd], cfg, 42);
    expect(r.homeGoals).toBeGreaterThanOrEqual(0);
    expect(r.homeGoals).toBeLessThanOrEqual(7);
    expect(r.awayGoals).toBeGreaterThanOrEqual(0);
    expect(r.awayGoals).toBeLessThanOrEqual(7);
  });

  it('same seed = same result', () => {
    const r1 = simulateMatch([gk, mid, fwd], [gk, mid, fwd], cfg, 123);
    const r2 = simulateMatch([gk, mid, fwd], [gk, mid, fwd], cfg, 123);
    expect(r1.homeGoals).toBe(r2.homeGoals);
    expect(r1.awayGoals).toBe(r2.awayGoals);
  });

  it('produces variety across seeds', () => {
    const scores = new Set(
      Array.from({ length: 20 }, (_, i) => {
        const r = simulateMatch([gk, mid, fwd], [gk, mid, fwd], cfg, i * 1000);
        return `${r.homeGoals}-${r.awayGoals}`;
      })
    );
    expect(scores.size).toBeGreaterThan(3);
  });

  it('first event is kickoff, last is fulltime', () => {
    const r = simulateMatch([gk, mid, fwd], [gk, mid, fwd], cfg, 77);
    expect(r.events[0].type).toBe('kickoff');
    expect(r.events[r.events.length - 1].type).toBe('fulltime');
  });

  it('MOTM is a valid player', () => {
    const r = simulateMatch([gk, mid, fwd], [gk, mid, fwd], cfg, 999);
    expect(r.motm).toBeDefined();
    expect(r.motm.n).toBeTruthy();
  });

  it('returns correct player arrays', () => {
    const r = simulateMatch([gk, mid, fwd], [gk, mid, fwd], cfg, 1);
    expect(r.homePlayers).toHaveLength(3);
    expect(r.awayPlayers).toHaveLength(3);
  });
});
