import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import PlayerCard from '../PlayerCard';
import { posForSlot } from '../../lib/cpuDraft';
import { PLAYERS, ICONS } from '../../data/players';
import type { Player, DraftSlot, Pos, Difficulty } from '../../types';

type Role = 'start' | 'sub' | 'sell';
type Phase = 'picking' | 'summary' | 'complete';

const ROLE_COLORS: Record<Role, string> = {
  start: '#C6FF3D',
  sub:   '#F5C842',
  sell:  '#FF3D6E',
};

const ROLE_ACTIVE: Record<Role, string> = {
  start: 'bg-lime text-base border-lime',
  sub:   'bg-gold text-base border-gold',
  sell:  'bg-away text-text border-away',
};

const POS_LABEL: Record<Pos, string> = {
  GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward',
};

const POS_CHIP: Record<Pos, string> = {
  GK:  'bg-gold/20 text-gold border-gold',
  DEF: 'bg-home/20 text-home border-home',
  MID: 'bg-lime/20 text-lime border-lime',
  FWD: 'bg-away/20 text-away border-away',
};

function drawTrio(pos: Pos, excluding: Set<string>, pool: Player[]): Player[] {
  let candidates = pool
    .filter(p => p.pos === pos && !excluding.has(p.n))
    .sort((a, b) => a.ovr - b.ovr);

  // Fallback when pool exhausted (e.g. 3rd DEF round in 11v11)
  if (candidates.length < 3) {
    candidates = pool.filter(p => p.pos === pos).sort((a, b) => a.ovr - b.ovr);
  }
  if (candidates.length === 0) return [];

  const maxStart = Math.max(0, candidates.length - 3);
  // Middle-bias: pick from middle 70% of range so we don't always get weakest cluster
  const lo = Math.floor(maxStart * 0.15);
  const hi = Math.ceil(maxStart * 0.85);
  const range = Math.max(0, hi - lo);
  const start = lo + Math.floor(Math.random() * (range + 1));
  return candidates.slice(start, start + 3);
}

function cpuAutoAssign(trio: Player[], difficulty: Difficulty): Partial<Record<number, Role>> {
  if (trio.length === 0) return {};
  const sorted = trio.map((p, i) => ({ p, i })).sort((a, b) => b.p.ovr - a.p.ovr);
  const assign: Partial<Record<number, Role>> = {};

  if (trio.length === 1) {
    assign[sorted[0].i] = 'start';
    return assign;
  }
  if (trio.length === 2) {
    assign[sorted[0].i] = 'start';
    assign[sorted[1].i] = 'sub';
    return assign;
  }

  if (difficulty === 'Legend') {
    assign[sorted[0].i] = 'start';
    assign[sorted[1].i] = 'sub';
    assign[sorted[2].i] = 'sell';
  } else if (difficulty === 'Pro') {
    const startIdx = Math.random() < 0.8 ? 0 : Math.floor(Math.random() * 2);
    assign[sorted[startIdx].i] = 'start';
    const rest = sorted.filter((_, i) => i !== startIdx);
    assign[rest[0].i] = 'sub';
    assign[rest[1].i] = 'sell';
  } else {
    const shuffled = [...sorted].sort(() => Math.random() - 0.5);
    assign[shuffled[0].i] = 'start';
    assign[shuffled[1].i] = 'sub';
    assign[shuffled[2].i] = 'sell';
  }
  return assign;
}

export default function SssScreen() {
  const { config, profile, updateProfile, setScreen } = useGameStore();
  const squadSize = config!.squadSize;
  const difficulty = config!.away.difficulty ?? 'Pro';
  const pool = profile.unlockedIcons ? [...PLAYERS, ...ICONS] : PLAYERS;

  const [round, setRound] = useState(0);
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [homeTrio, setHomeTrio] = useState<Player[]>([]);
  const [cpuTrio, setCpuTrio] = useState<Player[]>([]);
  const [homeAssign, setHomeAssign] = useState<Partial<Record<number, Role>>>({});
  const [cpuAssign, setCpuAssign] = useState<Partial<Record<number, Role>>>({});
  const [homeStarters, setHomeStarters] = useState<DraftSlot[]>([]);
  const [cpuStarters, setCpuStarters] = useState<DraftSlot[]>([]);
  const [phase, setPhase] = useState<Phase>('picking');
  const [cpuReady, setCpuReady] = useState(false);
  const [totalSoldCoins, setTotalSoldCoins] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const summaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateRound = useCallback((roundIdx: number, usedNames: Set<string>) => {
    const pos = posForSlot(roundIdx, squadSize);
    const home = drawTrio(pos, usedNames, pool);
    const cpuExclude = new Set([...usedNames, ...home.map(p => p.n)]);
    const cpu = drawTrio(pos, cpuExclude, pool);

    setHomeTrio(home);
    setCpuTrio(cpu);
    setHomeAssign({});
    setCpuAssign({});
    setCpuReady(false);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCpuAssign(cpuAutoAssign(cpu, difficulty));
      setCpuReady(true);
    }, 600);
  }, [squadSize, difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    generateRound(0, new Set());
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (summaryTimerRef.current) clearTimeout(summaryTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleAssign(playerIdx: number, role: Role) {
    setHomeAssign(prev => {
      const next = { ...prev };
      // Clear the role from whoever currently holds it (other than this player)
      const prevHolder = Object.entries(next).find(
        ([k, r]) => r === role && Number(k) !== playerIdx
      );
      if (prevHolder) delete next[Number(prevHolder[0])];
      // Toggle: clicking the same role again removes it
      if (next[playerIdx] === role) {
        delete next[playerIdx];
      } else {
        next[playerIdx] = role;
      }
      return next;
    });
  }

  function confirmRound() {
    const pos = posForSlot(round, squadSize);

    const startEntry = Object.entries(homeAssign).find(([, r]) => r === 'start');
    const sellEntry  = Object.entries(homeAssign).find(([, r]) => r === 'sell');
    const cpuStartEntry = Object.entries(cpuAssign).find(([, r]) => r === 'start');

    const homeStartPlayer = startEntry ? homeTrio[Number(startEntry[0])] : null;
    const homeSellPlayer  = sellEntry  ? homeTrio[Number(sellEntry[0])]  : null;
    const cpuStartPlayer  = cpuStartEntry ? cpuTrio[Number(cpuStartEntry[0])] : null;

    const newHomeStarters = homeStartPlayer
      ? [...homeStarters, { pos, player: homeStartPlayer }]
      : homeStarters;
    const newCpuStarters = cpuStartPlayer
      ? [...cpuStarters, { pos, player: cpuStartPlayer }]
      : cpuStarters;

    setHomeStarters(newHomeStarters);
    setCpuStarters(newCpuStarters);

    // Award sell coins immediately using live profile to avoid stale closure
    if (homeSellPlayer) {
      const coinGain = Math.round(homeSellPlayer.val);
      setTotalSoldCoins(prev => prev + coinGain);
      const liveProfile = useGameStore.getState().profile;
      updateProfile({ ...liveProfile, coins: liveProfile.coins + coinGain });
    }

    // Mark all players from both trios as used
    const newUsed = new Set(used);
    [...homeTrio, ...cpuTrio].forEach(p => newUsed.add(p.n));
    setUsed(newUsed);

    const nextRound = round + 1;
    if (nextRound >= squadSize) {
      setPhase('complete');
    } else {
      setPhase('summary');
      summaryTimerRef.current = setTimeout(() => {
        setRound(nextRound);
        generateRound(nextRound, newUsed);
        setPhase('picking');
      }, 1000);
    }
  }

  function handleKickOff() {
    useGameStore.setState({
      homeSlots: homeStarters,
      awaySlots: cpuStarters,
    });
    setScreen('match');
  }

  const pos = posForSlot(round, squadSize);
  const homeAllAssigned = homeTrio.length > 0 && homeTrio.every((_, i) => homeAssign[i] !== undefined);
  const canConfirm = homeAllAssigned && cpuReady && phase === 'picking';

  // ─── SUMMARY phase ───────────────────────────────────────────────────────────
  if (phase === 'summary') {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted text-xs font-display uppercase tracking-widest mb-1">Round {round} complete</p>
          <p className="text-lime font-display font-bold text-lg animate-pulse mt-4">Loading next round…</p>
        </div>
      </div>
    );
  }

  // ─── COMPLETE phase ───────────────────────────────────────────────────────────
  if (phase === 'complete') {
    return (
      <div className="min-h-screen bg-base p-4 pb-10">
        <div className="max-w-2xl mx-auto">
          <div className="pt-6 mb-4 text-center">
            <h2 className="font-display text-2xl font-bold text-lime">SQUAD COMPLETE!</h2>
            {totalSoldCoins > 0 && (
              <p className="text-gold font-display font-bold mt-1">+{totalSoldCoins} coins earned from sales</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Home starters */}
            <div>
              <h3 className="font-display font-bold text-sm mb-2" style={{ color: '#28C7F0' }}>
                {config!.home.name.toUpperCase()}
              </h3>
              <div className="space-y-1.5">
                {homeStarters.map((slot, i) => slot.player && (
                  <PlayerCard key={i} player={slot.player} compact teamColor="#28C7F0" />
                ))}
              </div>
            </div>
            {/* CPU starters */}
            <div>
              <h3 className="font-display font-bold text-sm mb-2" style={{ color: '#FF3D6E' }}>
                {config!.away.name.toUpperCase()}
              </h3>
              <div className="space-y-1.5">
                {cpuStarters.map((slot, i) => slot.player && (
                  <PlayerCard key={i} player={slot.player} compact teamColor="#FF3D6E" />
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleKickOff}
            className="w-full bg-lime text-base font-display font-bold text-xl py-4 rounded-xl hover:brightness-110 transition-all focus-visible:outline-2 focus-visible:outline-white active:scale-95"
          >
            KICK OFF ⚽
          </button>
        </div>
      </div>
    );
  }

  // ─── PICKING phase ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-base p-3 pb-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between pt-4 mb-3">
          <h2 className="font-display text-xl font-bold text-text">START · SUB · SELL</h2>
          <span className="text-muted text-xs font-display">Round {round + 1} of {squadSize}</span>
        </div>

        {/* Position badge + coin tally */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-display font-bold px-2 py-0.5 rounded border ${POS_CHIP[pos]}`}>
            {pos}
          </span>
          <span className="text-muted text-sm">{POS_LABEL[pos]} Round</span>
          {totalSoldCoins > 0 && (
            <span className="ml-auto text-gold text-xs font-display font-bold">+{totalSoldCoins} coins sold</span>
          )}
        </div>

        {/* Round progress bar */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: squadSize }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < round ? 'bg-lime' : i === round ? 'bg-lime/40' : 'bg-surface2'
              }`}
            />
          ))}
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-2 gap-2">

          {/* ── HOME column ── */}
          <div>
            <h3 className="font-display font-bold text-sm mb-2 text-home">
              {config!.home.name.toUpperCase()}
              <span className="ml-1 text-lime text-[10px] animate-pulse">YOUR PICK</span>
            </h3>
            <div className="space-y-2">
              {homeTrio.map((player, idx) => {
                const assigned = homeAssign[idx];
                return (
                  <div key={player.n}>
                    <div className={`rounded-lg transition-all ${assigned ? 'ring-1' : ''}`}
                         style={{ '--tw-ring-color': assigned ? ROLE_COLORS[assigned] : 'transparent' } as React.CSSProperties}>
                      <PlayerCard
                        player={player}
                        compact
                        teamColor={assigned ? ROLE_COLORS[assigned] : '#28C7F0'}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-0.5 mt-1">
                      {(['start', 'sub', 'sell'] as Role[]).map(role => {
                        const isAssigned = assigned === role;
                        const isTaken = !isAssigned && Object.values(homeAssign).includes(role);
                        return (
                          <button
                            key={role}
                            onClick={() => toggleAssign(idx, role)}
                            disabled={isTaken}
                            className={`py-1 rounded text-[9px] font-display font-bold uppercase border transition-all
                              ${isAssigned
                                ? ROLE_ACTIVE[role]
                                : isTaken
                                  ? 'bg-surface2 border-line text-muted/30 cursor-not-allowed'
                                  : 'bg-surface2 border-line text-muted hover:border-muted active:scale-95'
                              }`}
                          >
                            {role === 'sell' ? `SELL` : role.toUpperCase()}
                            {role === 'sell' && <span className="text-[8px] block leading-none">+{player.val}M</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── CPU column ── */}
          <div>
            <h3 className="font-display font-bold text-sm mb-2 text-away">
              {config!.away.name.toUpperCase()}
            </h3>
            <div className="space-y-2">
              {cpuTrio.map((player, idx) => {
                const assigned = cpuAssign[idx];
                return (
                  <div key={player.n}>
                    <PlayerCard
                      player={player}
                      compact
                      teamColor={assigned ? ROLE_COLORS[assigned] : '#FF3D6E'}
                    />
                    <div className="mt-1">
                      {cpuReady && assigned ? (
                        <div
                          className={`py-1 rounded text-[10px] font-display font-bold uppercase text-center border ${ROLE_ACTIVE[assigned]}`}
                        >
                          {assigned.toUpperCase()}
                        </div>
                      ) : (
                        <div className="py-1 rounded text-[10px] text-muted/60 text-center animate-pulse bg-surface2 border border-line font-display">
                          deciding…
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Confirm button */}
        {canConfirm && (
          <button
            onClick={confirmRound}
            className="w-full mt-5 bg-lime text-base font-display font-bold text-xl py-4 rounded-xl hover:brightness-110 transition-all focus-visible:outline-2 focus-visible:outline-white active:scale-95"
          >
            {round + 1 < squadSize ? 'NEXT ROUND →' : 'FINISH DRAFT →'}
          </button>
        )}

        {!canConfirm && phase === 'picking' && (
          <p className="text-muted/50 text-[10px] text-center mt-5 font-display">
            {!cpuReady ? 'Waiting for CPU…' : 'Assign Start, Sub and Sell to all 3 players'}
          </p>
        )}

        <p className="text-muted/40 text-[10px] text-center mt-3">
          Ratings approximate · For fun only
        </p>
      </div>
    </div>
  );
}
