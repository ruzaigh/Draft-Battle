import type { Player, MatchEvent, MatchResult, GameConfig } from '../types';
import { mulberry32, poissonRandom, weightedRandom } from './rng';

function playerAtk(p: Player): number {
  if (!p.s) return p.ovr * (p.pos === 'GK' ? 0.05 : 0.4);
  const [PAC, SHO, PAS, DRI] = p.s;
  const atkRaw = SHO * 0.42 + DRI * 0.30 + PAC * 0.28;
  switch (p.pos) {
    case 'GK':  return p.ovr * 0.05;
    case 'DEF': return atkRaw * 0.30 + PAS * 0.06;
    case 'MID': return atkRaw * 0.70 + PAS * 0.12;
    case 'FWD': return atkRaw * 1.00 + PAS * 0.06;
  }
}

function playerDef(p: Player): number {
  if (!p.s) return p.ovr * (p.pos === 'GK' ? 1.05 : 0.5);
  const [, , , , DEF, PHY] = p.s;
  const defRaw = DEF * 0.62 + PHY * 0.38;
  switch (p.pos) {
    case 'GK':  return p.ovr * 1.05;
    case 'DEF': return defRaw * 1.00;
    case 'MID': return defRaw * 0.62;
    case 'FWD': return defRaw * 0.22;
  }
}

const GOAL_LINES = [
  '{p} finds the net! GOAL!',
  '{p} makes no mistake — it\'s in!',
  'WHAT A STRIKE from {p}!',
  '{p} slots it home!',
  '{p} with a clinical finish!',
  'GET IN! {p} puts it away!',
  '{p} — that is WORLD CLASS!',
  'Beautiful from {p}! Goal!',
  '{p} fires past the keeper!',
];

const CHANCE_LINES = [
  '{p} fires wide — so close!',
  'Brilliant save! {p} denied!',
  '{p} hits the post!',
  'The keeper tips it over from {p}!',
  'Goal-line clearance stops {p}!',
];

function pick(lines: string[], rng: () => number): string {
  return lines[Math.floor(rng() * lines.length)];
}

export function simulateMatch(
  homePlayers: Player[],
  awayPlayers: Player[],
  config: GameConfig,
  seed?: number
): MatchResult {
  const rng = mulberry32(seed ?? Math.floor(Math.random() * 1e9));

  const homeAtk = homePlayers.reduce((s, p) => s + playerAtk(p), 0);
  const homeDef = homePlayers.reduce((s, p) => s + playerDef(p), 0);
  const awayAtk = awayPlayers.reduce((s, p) => s + playerAtk(p), 0);
  const awayDef = awayPlayers.reduce((s, p) => s + playerDef(p), 0);

  const xGA = 2.7 * (homeAtk / (homeAtk + awayDef)) * (0.85 + rng() * 0.30);
  const xGB = 2.7 * (awayAtk / (awayAtk + homeDef)) * (0.85 + rng() * 0.30);

  const homeGoals = poissonRandom(xGA, rng);
  const awayGoals = poissonRandom(xGB, rng);

  const homeAtkW = homePlayers.map(p => playerAtk(p));
  const awayAtkW = awayPlayers.map(p => playerAtk(p));

  const homeScorers: Player[] = Array.from({ length: homeGoals }, () =>
    weightedRandom(homePlayers, homeAtkW, rng)
  );
  const awayScorers: Player[] = Array.from({ length: awayGoals }, () =>
    weightedRandom(awayPlayers, awayAtkW, rng)
  );

  // Build timeline
  const usedMins = new Set<number>();
  const timeline: { min: number; isGoal: boolean; team?: 'home' | 'away'; player?: Player }[] = [];

  for (const p of homeScorers) {
    let m: number; do { m = Math.floor(rng() * 90) + 1; } while (usedMins.has(m));
    usedMins.add(m);
    timeline.push({ min: m, isGoal: true, team: 'home', player: p });
  }
  for (const p of awayScorers) {
    let m: number; do { m = Math.floor(rng() * 90) + 1; } while (usedMins.has(m));
    usedMins.add(m);
    timeline.push({ min: m, isGoal: true, team: 'away', player: p });
  }

  // 2–4 near-miss events
  const numChances = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < numChances; i++) {
    let m: number; let tries = 0;
    do { m = Math.floor(rng() * 88) + 1; tries++; } while (usedMins.has(m) && tries < 20);
    if (tries < 20) { usedMins.add(m); timeline.push({ min: m, isGoal: false }); }
  }

  timeline.sort((a, b) => a.min - b.min);

  const events: MatchEvent[] = [
    { minute: 0, type: 'kickoff', text: '⚽ KICK OFF — The match is underway!' },
  ];

  let hs = 0, as_ = 0;
  let halfAdded = false;
  const allPlayers = [...homePlayers, ...awayPlayers];

  for (const t of timeline) {
    if (!halfAdded && t.min >= 45) {
      events.push({
        minute: 45, type: 'halftime',
        text: `HALF TIME — ${config.home.name} ${hs} : ${as_} ${config.away.name}`,
      });
      halfAdded = true;
    }
    if (t.isGoal && t.team && t.player) {
      if (t.team === 'home') hs++; else as_++;
      const line = pick(GOAL_LINES, rng).replace('{p}', t.player.n);
      events.push({ minute: t.min, type: 'goal', team: t.team, player: t.player.n, text: line });
    } else {
      const rp = allPlayers[Math.floor(rng() * allPlayers.length)];
      events.push({ minute: t.min, type: 'miss', text: pick(CHANCE_LINES, rng).replace('{p}', rp.n) });
    }
  }

  if (!halfAdded) {
    events.push({
      minute: 45, type: 'halftime',
      text: `HALF TIME — ${config.home.name} ${hs} : ${as_} ${config.away.name}`,
    });
  }
  events.push({
    minute: 90, type: 'fulltime',
    text: `FULL TIME — ${config.home.name} ${homeGoals} : ${awayGoals} ${config.away.name}`,
  });

  // MOTM — top scorer, tiebreak OVR
  const goalCounts = new Map<string, number>();
  [...homeScorers, ...awayScorers].forEach(p => goalCounts.set(p.n, (goalCounts.get(p.n) ?? 0) + 1));

  const motm = allPlayers.reduce((best, p) => {
    const bg = goalCounts.get(best.n) ?? 0;
    const pg = goalCounts.get(p.n) ?? 0;
    if (pg > bg) return p;
    if (pg === bg && p.ovr > best.ovr) return p;
    return best;
  });

  return { homeGoals, awayGoals, events, motm, homePlayers, awayPlayers, config };
}
