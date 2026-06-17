import type { Profile } from '../types';

const KEY = 'draft-battle-profile';

const DEFAULT: Profile = {
  wins: 0, losses: 0, draws: 0,
  goals: 0, goalsAgainst: 0,
  matchesPlayed: 0, coins: 0,
  streak: 0, bestStreak: 0,
  dailyStreak: 0, lastDailyDate: null,
  unlockedIcons: false, favPlayer: null,
  achievements: [],
};

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveProfile(p: Profile): void {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function recordResult(
  profile: Profile,
  homeGoals: number,
  awayGoals: number,
  playerIsHome: boolean
): Profile {
  const won = playerIsHome ? homeGoals > awayGoals : awayGoals > homeGoals;
  const drew = homeGoals === awayGoals;
  const lost = !won && !drew;
  const streak = won ? profile.streak + 1 : 0;

  return {
    ...profile,
    wins: profile.wins + (won ? 1 : 0),
    losses: profile.losses + (lost ? 1 : 0),
    draws: profile.draws + (drew ? 1 : 0),
    goals: profile.goals + (playerIsHome ? homeGoals : awayGoals),
    goalsAgainst: profile.goalsAgainst + (playerIsHome ? awayGoals : homeGoals),
    matchesPlayed: profile.matchesPlayed + 1,
    coins: profile.coins + 50 + (won ? 100 : drew ? 30 : 10),
    streak,
    bestStreak: Math.max(profile.bestStreak, streak),
  };
}

export function checkIconUnlock(profile: Profile): Profile {
  if (!profile.unlockedIcons && profile.coins >= 500) {
    return { ...profile, unlockedIcons: true };
  }
  return profile;
}

export function updateDailyStreak(profile: Profile): Profile {
  const today = todayDateStr();
  if (profile.lastDailyDate === today) return profile;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const newStreak = profile.lastDailyDate === yStr ? profile.dailyStreak + 1 : 1;
  return { ...profile, dailyStreak: newStreak, lastDailyDate: today };
}
