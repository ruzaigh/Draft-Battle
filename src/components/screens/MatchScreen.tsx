import { useState, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import PlayerCard from '../PlayerCard';
import { simulateMatch } from '../../lib/matchSim';
import type { MatchEvent } from '../../types';

const EVENT_ICONS: Record<string, string> = {
  kickoff: '⚽',
  goal: '⚽',
  save: '🧤',
  miss: '💨',
  halftime: '🔔',
  fulltime: '🏁',
};

export default function MatchScreen() {
  const { config, homeSlots, awaySlots, setMatchResult } = useGameStore();
  const [phase, setPhase] = useState<'preview' | 'live' | 'done'>('preview');
  const [feed, setFeed] = useState<MatchEvent[]>([]);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [minute, setMinute] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);

  const homePlayers = homeSlots.map(s => s.player!);
  const awayPlayers = awaySlots.map(s => s.player!);

  function handleKickOff() {
    const result = simulateMatch(homePlayers, awayPlayers, config!);
    setPhase('live');

    let i = 0;
    let hs = 0, as_ = 0;

    const tick = setInterval(() => {
      if (i >= result.events.length) {
        clearInterval(tick);
        setPhase('done');
        setTimeout(() => setMatchResult(result), 1200);
        return;
      }
      const evt = result.events[i];
      setMinute(evt.minute);
      if (evt.type === 'goal') {
        if (evt.team === 'home') { hs++; setHomeScore(hs); }
        else { as_++; setAwayScore(as_); }
      }
      setFeed(prev => [evt, ...prev]);
      i++;
      feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 650);

    return () => clearInterval(tick);
  }

  return (
    <div className="min-h-screen bg-base p-4 pb-10">
      <div className="max-w-2xl mx-auto">
        {/* Scoreboard */}
        <div className="bg-surface2 border border-line rounded-2xl p-4 mt-4 mb-4">
          <div className="flex items-center">
            <div className="flex-1 text-center min-w-0">
              <p className="font-display font-bold text-home text-sm truncate">{config!.home.name}</p>
            </div>
            <div className="px-4 text-center flex-shrink-0">
              <div className="font-display font-bold text-5xl text-text tracking-tight">
                {homeScore}
                <span className="text-muted text-3xl mx-2">:</span>
                {awayScore}
              </div>
              {phase === 'live' && (
                <div className="text-lime text-xs font-display animate-pulse mt-1">
                  {minute < 90 ? `${minute}'` : `90'+`} LIVE
                </div>
              )}
              {phase === 'preview' && <div className="text-muted text-xs font-display mt-1">PRE-MATCH</div>}
              {phase === 'done' && <div className="text-gold text-xs font-display mt-1">FULL TIME</div>}
            </div>
            <div className="flex-1 text-center min-w-0">
              <p className="font-display font-bold text-away text-sm truncate">{config!.away.name}</p>
            </div>
          </div>
        </div>

        {/* Pre-match squad preview */}
        {phase === 'preview' && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-5">
              <div>
                <p className="font-display text-home text-xs font-bold mb-2">{config!.home.name.toUpperCase()}</p>
                <div className="space-y-1.5">
                  {homePlayers.map((p, i) => <PlayerCard key={i} player={p} compact teamColor="#28C7F0" />)}
                </div>
              </div>
              <div>
                <p className="font-display text-away text-xs font-bold mb-2">{config!.away.name.toUpperCase()}</p>
                <div className="space-y-1.5">
                  {awayPlayers.map((p, i) => <PlayerCard key={i} player={p} compact teamColor="#FF3D6E" />)}
                </div>
              </div>
            </div>
            <button
              onClick={handleKickOff}
              className="w-full bg-lime text-base font-display font-bold text-xl py-4 rounded-xl hover:brightness-110 transition-all focus-visible:outline-2 focus-visible:outline-white active:scale-95"
            >
              KICK OFF ⚽
            </button>
          </>
        )}

        {/* Live match feed */}
        {(phase === 'live' || phase === 'done') && (
          <div ref={feedRef} className="space-y-2 overflow-y-auto max-h-[60vh]">
            {feed.map((evt, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all
                  ${evt.type === 'goal'
                    ? 'bg-surface2 border border-line'
                    : evt.type === 'halftime' || evt.type === 'fulltime'
                    ? 'bg-base2 border border-line text-center'
                    : 'bg-surface/40'}`}
              >
                <span className="text-muted text-xs font-display w-7 text-right flex-shrink-0 mt-0.5">
                  {evt.minute > 0 ? `${evt.minute}'` : ''}
                </span>
                <span className="text-base flex-shrink-0">{EVENT_ICONS[evt.type] ?? '•'}</span>
                <span
                  className={`text-sm leading-snug ${evt.type === 'goal' ? 'font-bold' : 'text-muted'}`}
                  style={{ color: evt.type === 'goal' ? (evt.team === 'home' ? '#28C7F0' : '#FF3D6E') : undefined }}
                >
                  {evt.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
