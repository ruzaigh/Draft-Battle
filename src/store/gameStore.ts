import { create } from 'zustand';
import type { GameConfig, Player, DraftSlot, MatchResult, Screen, Profile, Pos } from '../types';
import { PLAYERS, ICONS } from '../data/players';
import { loadProfile, saveProfile } from '../lib/profile';

interface GameState {
  screen: Screen;
  config: GameConfig | null;
  homeSlots: DraftSlot[];
  awaySlots: DraftSlot[];
  usedPlayerNames: Set<string>;
  homeRerolls: number;
  awayRerolls: number;
  matchResult: MatchResult | null;
  profile: Profile;

  setScreen: (s: Screen) => void;
  startGame: (config: GameConfig) => void;
  pickPlayer: (team: 'home' | 'away', slotIdx: number, pos: Pos) => Player | null;
  rerollSlot: (team: 'home' | 'away', slotIdx: number) => void;
  dropSlot: (team: 'home' | 'away', slotIdx: number) => void;
  setMatchResult: (r: MatchResult) => void;
  updateProfile: (p: Profile) => void;
  reset: () => void;
}

function emptySlots(n: number): DraftSlot[] {
  return Array.from({ length: n }, () => ({ pos: null, player: null }));
}

function playerPool(unlockedIcons: boolean): Player[] {
  return unlockedIcons ? [...PLAYERS, ...ICONS] : PLAYERS;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'home',
  config: null,
  homeSlots: [],
  awaySlots: [],
  usedPlayerNames: new Set(),
  homeRerolls: 0,
  awayRerolls: 0,
  matchResult: null,
  profile: loadProfile(),

  setScreen: (s) => set({ screen: s }),

  startGame: (config) => {
    set({
      config,
      homeSlots: emptySlots(config.squadSize),
      awaySlots: emptySlots(config.squadSize),
      usedPlayerNames: new Set(),
      homeRerolls: config.squadSize,
      awayRerolls: config.squadSize,
      matchResult: null,
      screen: 'draft',
    });
  },

  pickPlayer: (team, slotIdx, pos) => {
    const { config, homeSlots, awaySlots, usedPlayerNames, profile } = get();
    if (!config) return null;

    const slots = team === 'home' ? [...homeSlots] : [...awaySlots];
    const totalBudget = config.budget * config.squadSize;
    const spent = slots
      .filter((_, i) => i !== slotIdx)
      .reduce((s, slot) => s + (slot.player?.val ?? 0), 0);
    const remaining = totalBudget - spent;

    const pool = playerPool(profile.unlockedIcons);
    const available = pool.filter(
      p => p.pos === pos && p.val <= remaining && !usedPlayerNames.has(p.n)
    );
    if (!available.length) return null;

    const picked = available[Math.floor(Math.random() * available.length)];

    const newUsed = new Set(usedPlayerNames);
    const prev = slots[slotIdx].player;
    if (prev) newUsed.delete(prev.n);
    newUsed.add(picked.n);

    slots[slotIdx] = { pos, player: picked };
    set({
      ...(team === 'home' ? { homeSlots: slots } : { awaySlots: slots }),
      usedPlayerNames: newUsed,
    });
    return picked;
  },

  rerollSlot: (team, slotIdx) => {
    const { config, homeSlots, awaySlots, usedPlayerNames, homeRerolls, awayRerolls, profile } = get();
    if (!config) return;
    const rerolls = team === 'home' ? homeRerolls : awayRerolls;
    if (rerolls <= 0) return;

    const slots = team === 'home' ? [...homeSlots] : [...awaySlots];
    const slot = slots[slotIdx];
    if (!slot.pos || !slot.player) return;

    const totalBudget = config.budget * config.squadSize;
    const spent = slots
      .filter((_, i) => i !== slotIdx)
      .reduce((s, sl) => s + (sl.player?.val ?? 0), 0);
    const remaining = totalBudget - spent;

    const newUsed = new Set(usedPlayerNames);
    newUsed.delete(slot.player.n);

    const pool = playerPool(profile.unlockedIcons);
    const available = pool.filter(
      p => p.pos === slot.pos && p.val <= remaining && !newUsed.has(p.n)
    );
    if (!available.length) return;

    const picked = available[Math.floor(Math.random() * available.length)];
    newUsed.add(picked.n);
    slots[slotIdx] = { pos: slot.pos, player: picked };

    set({
      ...(team === 'home'
        ? { homeSlots: slots, homeRerolls: rerolls - 1 }
        : { awaySlots: slots, awayRerolls: rerolls - 1 }),
      usedPlayerNames: newUsed,
    });
  },

  dropSlot: (team, slotIdx) => {
    const { homeSlots, awaySlots, usedPlayerNames } = get();
    const slots = team === 'home' ? [...homeSlots] : [...awaySlots];
    const prev = slots[slotIdx].player;
    const newUsed = new Set(usedPlayerNames);
    if (prev) newUsed.delete(prev.n);
    slots[slotIdx] = { pos: null, player: null };
    set({
      ...(team === 'home' ? { homeSlots: slots } : { awaySlots: slots }),
      usedPlayerNames: newUsed,
    });
  },

  setMatchResult: (r) => set({ matchResult: r, screen: 'result' }),

  updateProfile: (p) => {
    saveProfile(p);
    set({ profile: p });
  },

  reset: () => set({
    screen: 'home',
    config: null,
    homeSlots: [],
    awaySlots: [],
    usedPlayerNames: new Set(),
    homeRerolls: 0,
    awayRerolls: 0,
    matchResult: null,
  }),
}));
