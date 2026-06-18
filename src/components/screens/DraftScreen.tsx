import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import PlayerCard from '../PlayerCard';
import type { Player, Pos } from '../../types';
import { PLAYERS, ICONS } from '../../data/players';
import { cpuDraftPick, posForSlot } from '../../lib/cpuDraft';
import { mulberry32 } from '../../lib/rng';

const POS_COLORS: Record<Pos, string> = {
  GK:  'bg-gold/20 text-gold border-gold hover:bg-gold/30',
  DEF: 'bg-home/20 text-home border-home hover:bg-home/30',
  MID: 'bg-lime/20 text-lime border-lime hover:bg-lime/30',
  FWD: 'bg-away/20 text-away border-away hover:bg-away/30',
};

const POS_LABEL: Record<Pos, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  FWD: 'Forward',
};

interface CpuState {
  slotIdx: number;
  pos: Pos;
  thinkMs: number;
  startedAt: number;
  justPicked: Player | null; // set briefly after pick lands
}

export default function DraftScreen() {
  const store = useGameStore();
  const { config, homeSlots, awaySlots, homeRerolls, awayRerolls, profile } = store;

  const [activeSlot, setActiveSlot] = useState<{ team: 'home' | 'away'; idx: number } | null>(null);
  const [cpuState, setCpuState] = useState<CpuState | null>(null);
  const [timerPct, setTimerPct] = useState(0);
  const rng = useRef(mulberry32(Date.now())).current;
  const rafRef = useRef<number | null>(null);
  const cpuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel any pending CPU timers on unmount
  useEffect(() => () => { if (cpuTimerRef.current) clearTimeout(cpuTimerRef.current); }, []);

  const size = config!.squadSize;
  const isSnake = config!.draftMode === 'snake';

  const homeComplete = homeSlots.every(s => s.player !== null);
  const awayComplete = awaySlots.every(s => s.player !== null);
  const allComplete = homeComplete && awayComplete;

  function snakeTurn(): 'home' | 'away' {
    const homePicked = homeSlots.filter(s => s.player).length;
    const awayPicked = awaySlots.filter(s => s.player).length;
    const total = homePicked + awayPicked;
    const round = Math.floor(total / 2);
    const isEvenRound = round % 2 === 0;
    return isEvenRound ? (total % 2 === 0 ? 'home' : 'away') : (total % 2 === 0 ? 'away' : 'home');
  }

  const currentTeam: 'home' | 'away' = isSnake
    ? snakeTurn()
    : homeComplete ? 'away' : 'home';

  const isCPUTurn = config!.away.isCPU && currentTeam === 'away' && !awayComplete;

  // Animate the timer bar via rAF
  useEffect(() => {
    if (!cpuState || cpuState.justPicked) {
      setTimerPct(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - cpuState.startedAt;
      const pct = Math.min(100, (elapsed / cpuState.thinkMs) * 100);
      setTimerPct(pct);
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [cpuState]);

  // CPU auto-draft
  // Timer stored in cpuTimerRef so effect-cleanup (triggered by setCpuState) can't cancel it.
  useEffect(() => {
    if (!isCPUTurn || cpuState !== null || allComplete) return;
    const emptyIdx = awaySlots.findIndex(s => !s.player);
    if (emptyIdx === -1) return;

    const pos = posForSlot(emptyIdx, config!.squadSize);
    const thinkMs = 800 + Math.random() * 600; // 0.8 – 1.4 s

    setCpuState({ slotIdx: emptyIdx, pos, thinkMs, startedAt: Date.now(), justPicked: null });

    cpuTimerRef.current = setTimeout(() => {
      const totalBudget = config!.budget * size + config!.totalBudgetBonus;
      const state = useGameStore.getState();
      const spent = state.awaySlots.reduce((s, sl) => s + (sl.player?.val ?? 0), 0);
      const remaining = totalBudget - spent;

      const pool = profile.unlockedIcons ? [...PLAYERS, ...ICONS] : PLAYERS;
      const available = pool.filter(p => !state.usedPlayerNames.has(p.n) && p.val <= remaining);

      const result = cpuDraftPick(emptyIdx, config!.squadSize, available, remaining,
        config!.away.difficulty ?? 'Pro', rng);

      if (result) {
        const newSlots = [...state.awaySlots];
        const newUsed = new Set(state.usedPlayerNames);
        newSlots[emptyIdx] = { pos: result.pos, player: result.player };
        newUsed.add(result.player.n);
        useGameStore.setState({ awaySlots: newSlots, usedPlayerNames: newUsed });

        setCpuState(prev => prev ? { ...prev, justPicked: result.player } : null);
        cpuTimerRef.current = setTimeout(() => setCpuState(null), 1200);
      } else {
        setCpuState(null);
      }
    }, thinkMs);
  }, [isCPUTurn, awaySlots, cpuState, allComplete]);

  function handlePick(team: 'home' | 'away', slotIdx: number, pos: Pos) {
    store.pickPlayer(team, slotIdx, pos);
    setActiveSlot(null);
  }

  const homeSpent = homeSlots.reduce((s, sl) => s + (sl.player?.val ?? 0), 0);
  const awaySpent = awaySlots.reduce((s, sl) => s + (sl.player?.val ?? 0), 0);
  const totalBudget = config!.budget * size + config!.totalBudgetBonus;

  return (
    <div className="min-h-screen bg-base p-3 pb-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between pt-4 mb-4">
          <h2 className="font-display text-xl font-bold text-text">DRAFT ROOM</h2>
          <span className="text-muted text-xs font-display uppercase">
            {isSnake ? 'Snake Draft' : 'Classic'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(['home', 'away'] as const).map(team => {
            const slots = team === 'home' ? homeSlots : awaySlots;
            const rerolls = team === 'home' ? homeRerolls : awayRerolls;
            const name = team === 'home' ? config!.home.name : config!.away.name;
            const color = team === 'home' ? '#28C7F0' : '#FF3D6E';
            const spent = team === 'home' ? homeSpent : awaySpent;
            const remaining = totalBudget - spent;
            const complete = slots.every(s => s.player);
            const isActive = currentTeam === team && !allComplete && !complete;
            const isCPU = team === 'away' && config!.away.isCPU;

            return (
              <div key={team} className={`min-w-0 transition-opacity ${!isActive && !complete ? 'opacity-55' : ''}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-bold text-sm truncate min-w-0" style={{ color }}>
                    {name.toUpperCase()}
                    {isActive && !isCPU && (
                      <span className="ml-1 text-[10px] text-lime animate-pulse"> ON CLOCK</span>
                    )}
                  </h3>
                  <span className="text-muted text-xs flex-shrink-0">🔄{rerolls}</span>
                </div>

                {/* Budget bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-muted">${spent}M spent</span>
                    <span style={{ color }}>${remaining}M left</span>
                  </div>
                  <div className="h-1 bg-surface2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (spent / totalBudget) * 100)}%`,
                        backgroundColor: spent / totalBudget > 0.9 ? '#FF3D6E' : color,
                      }}
                    />
                  </div>
                </div>

                {/* Slots */}
                <div className="space-y-1.5">
                  {slots.map((slot, i) => {
                    const isThisActive = isActive && activeSlot?.team === team && activeSlot.idx === i;
                    const isCpuThinkingHere = isCPU && cpuState !== null && cpuState.slotIdx === i && !cpuState.justPicked;
                    const isCpuJustPickedHere = isCPU && cpuState !== null && cpuState.slotIdx === i && cpuState.justPicked !== null;

                    // Slot has been filled — show player card
                    if (slot.player) {
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-1 min-w-0 transition-all duration-300
                            ${isCpuJustPickedHere ? 'scale-[1.03]' : ''}`}
                        >
                          <div
                            className={`flex-1 min-w-0 rounded-lg transition-all duration-300
                              ${isCpuJustPickedHere ? 'ring-2 ring-away shadow-lg shadow-away/30' : ''}`}
                          >
                            <PlayerCard player={slot.player} compact teamColor={isCpuJustPickedHere ? '#FF3D6E' : color} />
                          </div>
                          {isActive && !isCPU && (
                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                              <button
                                onClick={() => store.rerollSlot(team, i)}
                                disabled={rerolls <= 0}
                                title="Reroll"
                                className="text-[11px] bg-surface2 border border-line text-muted px-1.5 py-0.5 rounded hover:border-muted disabled:opacity-30 focus-visible:outline-lime leading-none"
                              >🔄</button>
                              <button
                                onClick={() => store.dropSlot(team, i)}
                                title="Drop"
                                className="text-[11px] bg-surface2 border border-line text-muted px-1.5 py-0.5 rounded hover:border-away focus-visible:outline-lime leading-none"
                              >✕</button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // CPU is actively thinking for this slot
                    if (isCpuThinkingHere && cpuState) {
                      return (
                        <div
                          key={i}
                          className="bg-surface2 border-2 border-away/60 rounded-lg p-2.5 animate-pulse"
                        >
                          {/* Position being scouted */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-display font-bold px-2 py-0.5 rounded border
                              ${cpuState.pos === 'GK'  ? 'bg-gold/20 text-gold border-gold' :
                                cpuState.pos === 'DEF' ? 'bg-home/20 text-home border-home' :
                                cpuState.pos === 'MID' ? 'bg-lime/20 text-lime border-lime' :
                                                         'bg-away/20 text-away border-away'}`}>
                              {cpuState.pos}
                            </span>
                            <span className="text-muted text-xs truncate">
                              Scouting {POS_LABEL[cpuState.pos]}…
                            </span>
                          </div>
                          {/* Think-time progress bar + countdown */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                              <div
                                className="h-full bg-away rounded-full"
                                style={{ width: `${timerPct}%`, transition: 'width 0.1s linear' }}
                              />
                            </div>
                            <span className="text-away text-[10px] font-display font-bold tabular-nums flex-shrink-0">
                              {(((cpuState.thinkMs - (cpuState.thinkMs * timerPct / 100)) / 1000)).toFixed(1)}s
                            </span>
                          </div>
                          <p className="text-muted/60 text-[10px] mt-1 text-right font-display">
                            {config!.away.name} is deciding…
                          </p>
                        </div>
                      );
                    }

                    // Human pick: position selector open
                    if (isThisActive) {
                      return (
                        <div key={i} className="bg-surface2 border border-lime rounded-lg p-2">
                          <p className="text-muted text-[10px] mb-1.5 font-display">Pick position:</p>
                          <div className="grid grid-cols-4 gap-1">
                            {(['GK', 'DEF', 'MID', 'FWD'] as Pos[]).map(pos => (
                              <button
                                key={pos}
                                onClick={() => handlePick(team, i, pos)}
                                className={`py-1.5 rounded text-xs font-display font-bold border ${POS_COLORS[pos]} focus-visible:outline-lime transition-colors`}
                              >
                                {pos}
                              </button>
                            ))}
                          </div>
                          <button onClick={() => setActiveSlot(null)} className="text-muted text-[10px] mt-1.5 hover:text-text">
                            cancel
                          </button>
                        </div>
                      );
                    }

                    // Empty slot (human, not active)
                    return (
                      <button
                        key={i}
                        onClick={() => isActive && !isCPU && setActiveSlot({ team, idx: i })}
                        disabled={!isActive || isCPU}
                        className={`w-full py-3 border-2 border-dashed rounded-lg text-xs font-display transition-all
                          ${isActive && !isCPU ? 'cursor-pointer hover:opacity-80' : 'cursor-default opacity-30'}`}
                        style={{ borderColor: isActive ? color + '50' : '#27463A', color: isActive ? color : '#8AA396' }}
                      >
                        Slot {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {allComplete && (
          <button
            onClick={() => store.setScreen('match')}
            className="w-full mt-6 bg-lime text-base font-display font-bold text-xl py-4 rounded-xl hover:brightness-110 transition-all focus-visible:outline-2 focus-visible:outline-white active:scale-95"
          >
            KICK OFF ⚽
          </button>
        )}

        <p className="text-muted/40 text-[10px] text-center mt-4">
          Ratings approximate · For fun only
        </p>
      </div>
    </div>
  );
}
