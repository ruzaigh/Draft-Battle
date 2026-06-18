export type Pos = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  n: string;
  pos: Pos;
  ovr: number;
  val: number;
  nat: string;
  club: string;
  s?: [number, number, number, number, number, number]; // PAC SHO PAS DRI DEF PHY
  img?: string;
  isIcon?: boolean;
}

export type SquadSize = 3 | 5 | 7 | 11;
export type BudgetTier = 'Tight' | 'Balanced' | 'Loaded' | 'Galáctico';
export type DraftMode = 'classic' | 'snake';
export type Difficulty = 'Easy' | 'Pro' | 'Legend';

export interface ManagerConfig {
  name: string;
  isCPU: boolean;
  difficulty?: Difficulty;
}

export interface DraftSlot {
  pos: Pos | null;
  player: Player | null;
}

export interface GameConfig {
  home: ManagerConfig;
  away: ManagerConfig;
  squadSize: SquadSize;
  budget: number; // per player
  budgetTier: BudgetTier;
  draftMode: DraftMode;
  totalBudgetBonus: number; // flat extra $M from shop boost
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'save' | 'miss' | 'kickoff' | 'halftime' | 'fulltime';
  team?: 'home' | 'away';
  player?: string;
  text: string;
}

export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
  events: MatchEvent[];
  motm: Player;
  homePlayers: Player[];
  awayPlayers: Player[];
  config: GameConfig;
}

export type Screen = 'home' | 'setup' | 'draft' | 'match' | 'result' | 'profile' | 'daily' | 'shop';

export interface Profile {
  wins: number;
  losses: number;
  draws: number;
  goals: number;
  goalsAgainst: number;
  matchesPlayed: number;
  coins: number;
  streak: number;
  bestStreak: number;
  dailyStreak: number;
  lastDailyDate: string | null;
  unlockedIcons: boolean;
  favPlayer: string | null;
  achievements: string[];
  pendingRerolls: number;    // extra reroll tokens queued for next draft
  pendingBudgetBoost: number; // number of $50M boosts queued for next match
}
