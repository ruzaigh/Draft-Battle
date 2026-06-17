import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import PlayerCard from '../PlayerCard';
import type { Pos } from '../../types';
import { PLAYERS, ICONS } from '../../data/players';
import { cpuDraftPick } from '../../lib/cpuDraft';
import { mulberry32 } from '../../lib/rng';

const POS_COLORS: Record<Pos, string> = {
  GK:  'bg-gold/20 text-gold border-gold hover:bg-gold/30',
  DEF: 'bg-home/20 text-home border-home hover:bg-home/30',
  MID: 'bg-lime/20 text-lime border-lime hover:bg-lime/30',
  FWD: 'bg-away/20 text-away border-away hover:bg-away/30',
};

export default function DraftScreen() {
  const store = useGameStore();
  const { config, homeSlots, awaySlots, usedPlayerNames, homeRerolls, awayRerolls, profile } = store;

  const [activeSlot, setActiveSlot] = useState<{ team: 'home' | 'away'; idx: number } | null>(null);
  const [cpuWorking, setCpuWorking] = useState(false);
  const rng = useRef(mulberry32(Date.now())).current;

  const size = config!.squadSize;
  const isSnake = config!.draftMode === 'snake';

  const homeComplete = homeSlots.every(s => s.player !== null);
  const awayComplete = awaySlots.every(s => s.player !== null);
  const allComplete = homeComplete && awayComplete;

  // In classic mode: home first, then away. In snake we toggle per pick.
  function snakeTurn(): 'home' | 'away' {
    const homePicked = homeSlots.filter(s => s.player).length;
    const awayPicked = awaySlots.filter(s => s.player).length;
    // Home picks 1st, then alternate pairs
    const total = homePicked + awayPicked;
    const round = Math.floor(total / 2);
    const isEvenRound = round % 2 === 0;
    return isEvenRound ? (total % 2 === 0 ? 'home' : 'away') : (total % 2 === 0 ? 'away' : 'home');
  }

  const currentTeam: 'home' | 'away' = isSnake
    ? snakeTurn()
    : homeComplete ? 'away' : 'home';

  const isCPUTurn = config!.away.isCPU && currentTeam === 'away' && !awayComplete;

  // CPU auto-draft
  useEffect(() => {
    if (!isCPUTurn || cpuWorking || allComplete) return;
    const emptyIdx = awaySlots.findIndex(s => !s.player);
    if (emptyIdx === -1) return;

    setCpuWorking(true);
    const timer = setTimeout(() => {
      const totalBudget = config!.budget * size;
      const spent = awaySlots.reduce((s, sl) => s + (sl.player?.val ?? 0), 0);
      const remaining = totalBudget - spent;

      const pool = profile.unlockedIcons ? [...PLAYERS, ...ICONS] : PLAYERS;
      const available = pool.filter(p => !usedPlayerNames.has(p.n) && p.val <= remaining);

      const result = cpuDraftPick(
        emptyIdx, config!.squadSize, available, remaining,
        config!.away.difficulty ?? 'Pro', rng
      );

      if (result) {
        const state = useGameStore.getState();
        const newSlots = [...state.awaySlots];
        const newUsed = new Set(state.usedPlayerNames);
        newSlots[emptyIdx] = { pos: result.pos, player: result.player };
        newUsed.add(result.player.n);
        useGameStore.setState({ awaySlots: newSlots, usedPlayerNames: newUsed });
      }
      setCpuWorking(false);
    }, 600 + Math.random() * 700);

    return () => clearTimeout(timer);
  }, [isCPUTurn, awaySlots, cpuWorking, allComplete]);

  function handlePick(team: 'home' | 'away', slotIdx: number, pos: Pos) {
    store.pickPlayer(team, slotIdx, pos);
    setActiveSlot(null);
  }

  function handleConfirm() {
    store.setScreen('match');
  }

  const homeSpent = homeSlots.reduce((s, sl) => s + (sl.player?.val ?? 0), 0);
  const awaySpent = awaySlots.reduce((s, sl) => s + (sl.player?.val ?? 0), 0);
  const totalBudget = config!.budget * size;

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
                {/* Team header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-bold text-sm truncate" style={{ color }}>
                    {name.toUpperCase()}
                    {isActive && !isCPU && (
                      <span className="ml-1 text-[10px] text-lime animate-pulse"> ON CLOCK</span>
                    )}
                    {isCPU && cpuWorking && (
                      <span className="ml-1 text-[10px] text-muted animate-pulse"> THINKING…</span>
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

                    if (slot.player) {
                      return (
                        <div key={i} className="flex items-center gap-1 min-w-0">
                          <div className="flex-1 min-w-0">
                            <PlayerCard player={slot.player} compact teamColor={color} />
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
                          <button
                            onClick={() => setActiveSlot(null)}
                            className="text-muted text-[10px] mt-1.5 hover:text-text"
                          >
                            cancel
                          </button>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => isActive && !isCPU && setActiveSlot({ team, idx: i })}
                        disabled={!isActive || isCPU}
                        className={`w-full py-3 border-2 border-dashed rounded-lg text-xs font-display transition-all
                          ${isActive && !isCPU
                            ? 'cursor-pointer hover:opacity-80'
                            : 'cursor-default opacity-30'}`}
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
            onClick={handleConfirm}
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
