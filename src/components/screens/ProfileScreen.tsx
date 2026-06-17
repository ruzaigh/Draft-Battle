import { useGameStore } from '../../store/gameStore';

export default function ProfileScreen() {
  const { profile, setScreen } = useGameStore();
  const gd = profile.goals - profile.goalsAgainst;
  const wpct = profile.matchesPlayed > 0
    ? Math.round((profile.wins / profile.matchesPlayed) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-base p-4 pb-10">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 pt-4 mb-6">
          <button onClick={() => setScreen('home')} className="text-muted hover:text-text text-xl focus-visible:outline-lime">←</button>
          <h2 className="font-display text-2xl font-bold text-text">MY PROFILE</h2>
        </div>

        {/* Record */}
        <div className="bg-surface2 border border-line rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <div className="font-display text-3xl text-lime">{profile.wins}</div>
              <div className="text-muted text-xs">WINS</div>
            </div>
            <div>
              <div className="font-display text-3xl text-silver">{profile.draws}</div>
              <div className="text-muted text-xs">DRAWS</div>
            </div>
            <div>
              <div className="font-display text-3xl text-away">{profile.losses}</div>
              <div className="text-muted text-xs">LOSSES</div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center border-t border-line pt-4">
            <div>
              <div className="font-display text-xl text-text">{profile.goals}</div>
              <div className="text-muted text-xs">GF</div>
            </div>
            <div>
              <div className="font-display text-xl text-text">{profile.goalsAgainst}</div>
              <div className="text-muted text-xs">GA</div>
            </div>
            <div>
              <div className={`font-display text-xl ${gd >= 0 ? 'text-lime' : 'text-away'}`}>
                {gd > 0 ? '+' : ''}{gd}
              </div>
              <div className="text-muted text-xs">GD</div>
            </div>
            <div>
              <div className="font-display text-xl text-text">{wpct}%</div>
              <div className="text-muted text-xs">WIN %</div>
            </div>
          </div>
        </div>

        {/* Streaks & coins */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-surface2 border border-line rounded-xl p-3 text-center">
            <div className="font-display text-2xl text-gold">🔥{profile.streak}</div>
            <div className="text-muted text-xs mt-1">STREAK</div>
          </div>
          <div className="bg-surface2 border border-line rounded-xl p-3 text-center">
            <div className="font-display text-2xl text-gold">{profile.bestStreak}</div>
            <div className="text-muted text-xs mt-1">BEST</div>
          </div>
          <div className="bg-surface2 border border-line rounded-xl p-3 text-center">
            <div className="font-display text-2xl text-gold">{profile.coins}</div>
            <div className="text-muted text-xs mt-1">COINS</div>
          </div>
        </div>

        {/* Unlock progress */}
        <div className="bg-surface2 border border-line rounded-xl p-4 mb-6">
          <h3 className="font-display font-bold text-sm text-text mb-3">UNLOCKS</h3>
          <div className={`flex items-center gap-3 p-3 rounded-lg
            ${profile.unlockedIcons ? 'bg-lime/10 border border-lime' : 'bg-surface border border-line'}`}>
            <span className="text-2xl">⭐</span>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm text-text">Icons &amp; Legends</p>
              <p className="text-muted text-xs">R9, Zidane, Pelé, Maradona, Ronaldinho…</p>
              {!profile.unlockedIcons && (
                <div className="mt-1.5">
                  <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold rounded-full transition-all"
                      style={{ width: `${Math.min(100, (profile.coins / 500) * 100)}%` }}
                    />
                  </div>
                  <p className="text-muted text-xs mt-0.5">{profile.coins} / 500 coins</p>
                </div>
              )}
            </div>
            {profile.unlockedIcons && (
              <span className="text-lime font-display font-bold text-xs flex-shrink-0">UNLOCKED!</span>
            )}
          </div>
        </div>

        <button
          onClick={() => setScreen('home')}
          className="w-full bg-lime text-base font-display font-bold py-3 rounded-xl hover:brightness-110 transition-all focus-visible:outline-2 focus-visible:outline-white active:scale-95"
        >
          PLAY
        </button>
      </div>
    </div>
  );
}
