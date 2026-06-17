import { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import PlayerCard from '../PlayerCard';
import { recordResult, checkIconUnlock } from '../../lib/profile';
import { toPng } from 'html-to-image';

export default function ResultScreen() {
  const { matchResult, config, reset, setScreen, profile, updateProfile } = useGameStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [iconUnlocked, setIconUnlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const recorded = useRef(false);

  if (!matchResult) return null;
  const { homeGoals, awayGoals, motm, homePlayers, awayPlayers } = matchResult;

  const homeWon = homeGoals > awayGoals;
  const drew = homeGoals === awayGoals;

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    const updated = recordResult(profile, homeGoals, awayGoals, true);
    const withIcons = checkIconUnlock(updated);
    if (withIcons.unlockedIcons && !profile.unlockedIcons) setIconUnlocked(true);
    updateProfile(withIcons);
  }, []);

  async function handleSave() {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const url = await toPng(cardRef.current, { cacheBust: true, backgroundColor: '#0A1410' });
      const a = document.createElement('a');
      a.download = 'draft-battle.png';
      a.href = url;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const resultLabel = homeWon
    ? `${config!.home.name} WIN!`
    : !drew
    ? `${config!.away.name} WIN!`
    : 'DRAW!';

  return (
    <div className="min-h-screen bg-base p-4 pb-10">
      <div className="max-w-lg mx-auto">

        {iconUnlocked && (
          <div className="bg-lime/20 border border-lime rounded-xl p-3 mb-4 text-center mt-4">
            <p className="font-display font-bold text-lime text-lg">⭐ ICONS UNLOCKED!</p>
            <p className="text-muted text-xs">You've earned 500 coins — Icons &amp; Legends are now available!</p>
          </div>
        )}

        {/* Shareable result card */}
        <div ref={cardRef} className="bg-surface2 border border-line rounded-2xl p-4 mt-4 mb-4">
          <div className="text-center mb-4">
            <p className={`font-display text-3xl font-bold ${homeWon ? 'text-lime' : drew ? 'text-silver' : 'text-away'}`}>
              {resultLabel}
            </p>
            <div className="font-display font-bold text-5xl text-text mt-2 tracking-tight">
              <span className="text-home">{homeGoals}</span>
              <span className="text-muted mx-3 text-3xl">:</span>
              <span className="text-away">{awayGoals}</span>
            </div>
            <div className="flex justify-between text-xs font-display text-muted mt-1 px-2">
              <span className="text-home">{config!.home.name}</span>
              <span className="text-away">{config!.away.name}</span>
            </div>
          </div>

          {/* MOTM */}
          <div className="bg-gold/10 border border-gold/50 rounded-xl p-3 mb-4 flex items-center gap-3">
            <span className="text-xl flex-shrink-0">⭐</span>
            <div className="min-w-0">
              <p className="text-gold text-xs font-display font-bold">MAN OF THE MATCH</p>
              <p className="text-text font-display font-bold text-lg leading-tight truncate">{motm.n}</p>
              <p className="text-muted text-xs truncate">{motm.ovr} OVR · {motm.pos} · {motm.club}</p>
            </div>
          </div>

          {/* Both XIs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="font-display text-home text-[10px] font-bold mb-1">{config!.home.name.toUpperCase()}</p>
              <div className="space-y-1">
                {homePlayers.map((p, i) => <PlayerCard key={i} player={p} compact teamColor="#28C7F0" />)}
              </div>
            </div>
            <div>
              <p className="font-display text-away text-[10px] font-bold mb-1">{config!.away.name.toUpperCase()}</p>
              <div className="space-y-1">
                {awayPlayers.map((p, i) => <PlayerCard key={i} player={p} compact teamColor="#FF3D6E" />)}
              </div>
            </div>
          </div>

          <p className="text-muted/40 text-[9px] text-center mt-3">
            Draft Battle · Ratings approximate · For fun only
          </p>
        </div>

        {/* Coins earned */}
        <div className="bg-surface border border-line rounded-xl p-3 mb-4 flex items-center justify-between">
          <div>
            <p className="text-muted text-xs">Coins earned</p>
            <p className="font-display text-gold text-xl font-bold">
              +{50 + (homeWon ? 100 : drew ? 30 : 10)} coins
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted text-xs">Total</p>
            <p className="font-display text-gold text-xl font-bold">{profile.coins}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-surface2 border border-silver text-silver font-display font-bold py-3 rounded-xl hover:bg-silver/10 transition-all focus-visible:outline-2 focus-visible:outline-silver disabled:opacity-50 active:scale-95"
          >
            {saving ? 'Saving…' : '📸 SAVE RESULT CARD'}
          </button>
          <button
            onClick={() => { reset(); setScreen('setup'); }}
            className="w-full bg-lime text-base font-display font-bold text-lg py-4 rounded-xl hover:brightness-110 transition-all focus-visible:outline-2 focus-visible:outline-white active:scale-95"
          >
            REMATCH →
          </button>
          <button
            onClick={() => { reset(); setScreen('home'); }}
            className="w-full bg-surface2 border border-line text-muted font-display font-bold py-3 rounded-xl hover:border-muted hover:text-text transition-all active:scale-95"
          >
            HOME
          </button>
        </div>
      </div>
    </div>
  );
}
