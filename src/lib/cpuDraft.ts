import type { Player, Pos, Difficulty, SquadSize } from '../types';

export function posForSlot(idx: number, size: SquadSize): Pos {
  if (size === 3) return (['GK', 'MID', 'FWD'] as Pos[])[idx % 3];
  if (size === 5) return (['GK', 'DEF', 'MID', 'MID', 'FWD'] as Pos[])[idx % 5];
  if (size === 7) return (['GK', 'DEF', 'DEF', 'MID', 'MID', 'FWD', 'FWD'] as Pos[])[idx % 7];
  return (['GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD'] as Pos[])[idx % 11];
}

export function cpuDraftPick(
  slotIndex: number,
  squadSize: SquadSize,
  pool: Player[],
  budget: number,
  difficulty: Difficulty,
  rng: () => number
): { player: Player; pos: Pos } | null {
  const pos = posForSlot(slotIndex, squadSize);
  const candidates = pool.filter(p => p.pos === pos && p.val <= budget);
  if (!candidates.length) return null;

  const sorted = [...candidates].sort((a, b) => b.ovr - a.ovr);
  let player: Player;

  switch (difficulty) {
    case 'Legend':
      player = sorted[0];
      break;
    case 'Pro':
      player = sorted[Math.floor(rng() * Math.min(3, sorted.length))];
      break;
    default: // Easy
      player = sorted[Math.floor(rng() * Math.ceil(sorted.length / 2))];
  }

  return { player, pos };
}
