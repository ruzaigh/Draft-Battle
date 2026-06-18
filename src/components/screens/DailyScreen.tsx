import { useGameStore } from '../../store/gameStore';
import { todayDateStr, updateDailyStreak } from '../../lib/profile';

export default function DailyScreen() {
  const { setScreen, profile, updateProfile, startGame } = useGameStore();
  const today = todayDateStr();
  const alreadyPlayed = profile.lastDailyDate === today;

  function handlePlay() {
    const updated = updateDailyStreak(profile);
    updateProfile(updated);
    startGame({
      home: { name: 'You', isCPU: false },
      away: { name: 'Daily CPU', isCPU: true, difficulty: 'Pro' },
      squadSize: 5,
      budget: 85,
      budgetTier: 'Balanced',
      draftMode: 'classic',
      totalBudgetBonus: 0,
    });
  }

  return (
    <div className="min-h-screen bg-base p-4 pb-10">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 pt-4 mb-6">
          <button onClick={() => setScreen('home')} className="text-muted hover:text-text text-xl focus-visible:outline-lime">←</button>
          <h2 className="font-display text-2xl font-bold text-gold">⚡ DAILY CHALLENGE</h2>
        </div>

        <div className="bg-surface2 border border-gold/40 rounded-2xl p-6 mb-6 text-center">
          <p className="font-display text-gold font-bold text-lg">{today}</p>
          <p className="text-muted text-sm mt-1 mb-4">
            Everyone drafts under the same constraints. Beat the CPU!
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="font-display text-2xl text-text">5v5</div>
              <div className="text-muted text-xs">SQUAD</div>
            </div>
            <div>
              <div className="font-display text-2xl text-text">$85M</div>
              <div className="text-muted text-xs">PER PLAYER</div>
            </div>
            <div>
              <div className="font-display text-2xl text-gold">🔥{profile.dailyStreak}</div>
              <div className="text-muted text-xs">DAY STREAK</div>
            </div>
          </div>
        </div>

        {alreadyPlayed ? (
          <div className="bg-surface2 border border-lime/40 rounded-xl p-5 text-center mb-4">
            <p className="font-display text-lime font-bold text-lg">Done for today!</p>
            <p className="text-muted text-sm mt-1">Come back tomorrow for a new challenge.</p>
            {profile.dailyStreak > 0 && (
              <p className="text-gold text-sm mt-2">🔥 {profile.dailyStreak} day streak — keep it going!</p>
            )}
          </div>
        ) : (
          <button
            onClick={handlePlay}
            className="w-full bg-gold text-base font-display font-bold text-xl py-4 rounded-xl hover:brightness-110 transition-all focus-visible:outline-2 focus-visible:outline-white active:scale-95 mb-3"
          >
            START DAILY CHALLENGE →
          </button>
        )}

        <button
          onClick={() => setScreen('home')}
          className="w-full bg-surface2 border border-line text-muted font-display font-bold py-3 rounded-xl hover:border-muted hover:text-text transition-all active:scale-95"
        >
          BACK
        </button>
      </div>
    </div>
  );
}
