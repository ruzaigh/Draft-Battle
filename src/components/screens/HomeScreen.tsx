import { useGameStore } from '../../store/gameStore';

export default function HomeScreen() {
  const { setScreen, profile } = useGameStore();

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="font-display text-6xl font-bold text-text tracking-wide leading-none">
          DRAFT<span className="text-lime">BATTLE</span>
        </h1>
        <p className="text-muted text-sm mt-2">Build your XI. Battle for glory.</p>
      </div>

      {profile.matchesPlayed > 0 && (
        <div className="flex items-center gap-5 mb-8 bg-surface2 border border-line rounded-2xl px-6 py-3">
          <div className="text-center">
            <div className="font-display text-2xl text-lime">{profile.wins}</div>
            <div className="text-muted text-xs">W</div>
          </div>
          <div className="text-line">|</div>
          <div className="text-center">
            <div className="font-display text-2xl text-silver">{profile.draws}</div>
            <div className="text-muted text-xs">D</div>
          </div>
          <div className="text-line">|</div>
          <div className="text-center">
            <div className="font-display text-2xl text-away">{profile.losses}</div>
            <div className="text-muted text-xs">L</div>
          </div>
          <div className="text-line">|</div>
          <div className="text-center">
            <div className="font-display text-2xl text-gold">{profile.coins}</div>
            <div className="text-muted text-xs">COINS</div>
          </div>
          {profile.streak > 1 && (
            <>
              <div className="text-line">|</div>
              <div className="text-center">
                <div className="font-display text-2xl text-gold">🔥{profile.streak}</div>
                <div className="text-muted text-xs">STREAK</div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => setScreen('setup')}
          className="w-full bg-lime text-base font-display font-bold text-xl py-4 rounded-xl hover:brightness-110 transition-all focus-visible:outline-2 focus-visible:outline-white active:scale-95"
        >
          ENTER THE MARKET
        </button>
        <button
          onClick={() => setScreen('daily')}
          className="w-full bg-surface2 border-2 border-gold text-gold font-display font-bold text-lg py-3.5 rounded-xl hover:bg-gold/10 transition-all focus-visible:outline-2 focus-visible:outline-gold active:scale-95"
        >
          ⚡ DAILY CHALLENGE
          {profile.dailyStreak > 0 && (
            <span className="ml-2 text-sm opacity-75">🔥{profile.dailyStreak}</span>
          )}
        </button>
        <button
          onClick={() => setScreen('profile')}
          className="w-full bg-surface2 border border-line text-muted font-display font-bold py-3 rounded-xl hover:border-muted hover:text-text transition-all focus-visible:outline-2 focus-visible:outline-muted active:scale-95"
        >
          MY PROFILE
        </button>
      </div>

      {profile.unlockedIcons && (
        <p className="text-lime text-xs mt-6">⭐ Icons &amp; Legends unlocked!</p>
      )}

      <p className="text-muted/50 text-xs mt-10 text-center max-w-xs">
        Ratings approximate, for fun only. Not affiliated with EA or FIFA.
      </p>
    </div>
  );
}
