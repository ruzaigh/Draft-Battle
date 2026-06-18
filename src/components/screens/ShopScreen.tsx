import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

interface ShopItem {
  id: 'reroll' | 'budget';
  icon: string;
  title: string;
  description: string;
  effect: string;
  cost: number;
}

const ITEMS: ShopItem[] = [
  {
    id: 'reroll',
    icon: '🔄',
    title: 'Extra Reroll',
    description: 'One additional reroll token added to your next draft.',
    effect: '+1 reroll in next draft',
    cost: 75,
  },
  {
    id: 'budget',
    icon: '💰',
    title: 'Budget Boost',
    description: 'Inject an extra $50M into your total transfer budget for the next match.',
    effect: '+$50M total budget next match',
    cost: 100,
  },
];

export default function ShopScreen() {
  const { setScreen, profile, buyItem } = useGameStore();
  const [flash, setFlash] = useState<'reroll' | 'budget' | null>(null);
  const [err, setErr] = useState<'reroll' | 'budget' | null>(null);

  function handleBuy(id: 'reroll' | 'budget') {
    const ok = buyItem(id);
    if (ok) {
      setFlash(id);
      setTimeout(() => setFlash(null), 700);
    } else {
      setErr(id);
      setTimeout(() => setErr(null), 700);
    }
  }

  const pending = {
    reroll: profile.pendingRerolls,
    budget: profile.pendingBudgetBoost,
  };

  return (
    <div className="min-h-screen bg-base p-4 pb-10">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 pt-4 mb-6">
          <button
            onClick={() => setScreen('home')}
            className="text-muted hover:text-text text-xl focus-visible:outline-lime"
          >←</button>
          <h2 className="font-display text-2xl font-bold text-text">SHOP</h2>
          <div className="ml-auto bg-surface2 border border-gold/40 rounded-full px-4 py-1 flex items-center gap-1.5">
            <span className="text-gold text-sm font-display font-bold">{profile.coins}</span>
            <span className="text-gold text-xs">coins</span>
          </div>
        </div>

        {/* Active boosts banner */}
        {(profile.pendingRerolls > 0 || profile.pendingBudgetBoost > 0) && (
          <div className="bg-lime/10 border border-lime/40 rounded-xl p-3 mb-5 flex flex-wrap gap-3">
            <p className="text-lime text-xs font-display font-bold w-full">QUEUED FOR NEXT MATCH</p>
            {profile.pendingRerolls > 0 && (
              <span className="bg-surface2 border border-lime/30 text-lime text-xs font-display px-3 py-1 rounded-full">
                🔄 ×{profile.pendingRerolls} reroll{profile.pendingRerolls > 1 ? 's' : ''}
              </span>
            )}
            {profile.pendingBudgetBoost > 0 && (
              <span className="bg-surface2 border border-lime/30 text-lime text-xs font-display px-3 py-1 rounded-full">
                💰 +${profile.pendingBudgetBoost * 50}M budget
              </span>
            )}
          </div>
        )}

        {/* Items */}
        <div className="space-y-3">
          {ITEMS.map(item => {
            const canAfford = profile.coins >= item.cost;
            const isFlash = flash === item.id;
            const isErr = err === item.id;

            return (
              <div
                key={item.id}
                className={`bg-surface2 border rounded-2xl p-4 transition-all duration-200
                  ${isFlash ? 'border-lime shadow-lg shadow-lime/20' : isErr ? 'border-away' : 'border-line'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl leading-none mt-0.5">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-display font-bold text-text text-base">{item.title}</h3>
                      {pending[item.id] > 0 && (
                        <span className="text-lime text-[10px] font-display bg-lime/10 border border-lime/30 px-2 py-0.5 rounded-full flex-shrink-0">
                          {pending[item.id]} pending
                        </span>
                      )}
                    </div>
                    <p className="text-muted text-xs mb-2 leading-relaxed">{item.description}</p>
                    <p className="text-lime/70 text-[10px] font-display">{item.effect}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
                  <div className="flex items-center gap-1">
                    <span className="text-gold font-display font-bold text-lg">{item.cost}</span>
                    <span className="text-muted text-xs">coins</span>
                  </div>
                  <button
                    onClick={() => handleBuy(item.id)}
                    disabled={!canAfford}
                    className={`font-display font-bold text-sm px-5 py-2 rounded-xl transition-all active:scale-95
                      ${isFlash
                        ? 'bg-lime text-base'
                        : isErr
                          ? 'bg-away/20 text-away border border-away'
                          : canAfford
                            ? 'bg-lime text-base hover:brightness-110'
                            : 'bg-surface border border-line text-muted opacity-50 cursor-not-allowed'
                      }`}
                  >
                    {isFlash ? 'BOUGHT!' : isErr ? 'NOT ENOUGH' : 'BUY'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-muted/40 text-[10px] text-center mt-6">
          Boosts apply to your next match only and reset after kick-off.
        </p>

        <button
          onClick={() => setScreen('home')}
          className="w-full mt-4 bg-surface2 border border-line text-muted font-display font-bold py-3 rounded-xl hover:border-muted hover:text-text transition-all active:scale-95"
        >
          BACK
        </button>
      </div>
    </div>
  );
}
