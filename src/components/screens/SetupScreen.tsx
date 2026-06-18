import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { SquadSize, BudgetTier, DraftMode, Difficulty, GameConfig } from '../../types';

const SQUAD_SIZES: SquadSize[] = [3, 5, 7, 11];

const BUDGET_TIERS: { label: BudgetTier; pp: number; desc: string }[] = [
  { label: 'Tight',     pp: 50,  desc: '$50M / player' },
  { label: 'Balanced',  pp: 85,  desc: '$85M / player' },
  { label: 'Loaded',    pp: 165, desc: '$165M / player' },
  { label: 'Galáctico', pp: 330, desc: '$330M / player' },
];

export default function SetupScreen() {
  const { startGame, setScreen } = useGameStore();
  const [homeName, setHomeName] = useState('Home');
  const [awayName, setAwayName] = useState('Away');
  const [squadSize, setSquadSize] = useState<SquadSize>(5);
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('Balanced');
  const [draftMode, setDraftMode] = useState<DraftMode>('classic');
  const [vsMode, setVsMode] = useState<'cpu' | 'local'>('cpu');
  const [difficulty, setDifficulty] = useState<Difficulty>('Pro');

  const bt = BUDGET_TIERS.find(t => t.label === budgetTier)!;
  const total = bt.pp * squadSize;

  function handleStart() {
    const config: GameConfig = {
      home: { name: homeName.trim() || 'Home', isCPU: false },
      away: {
        name: vsMode === 'cpu' ? (difficulty + ' CPU') : (awayName.trim() || 'Away'),
        isCPU: vsMode === 'cpu',
        difficulty: vsMode === 'cpu' ? difficulty : undefined,
      },
      squadSize,
      budget: bt.pp,
      budgetTier,
      draftMode,
      totalBudgetBonus: 0,
    };
    startGame(config);
  }

  return (
    <div className="min-h-screen bg-base p-4 pb-10">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 pt-4 mb-6">
          <button onClick={() => setScreen('home')} className="text-muted hover:text-text text-xl focus-visible:outline-lime">←</button>
          <h2 className="font-display text-2xl font-bold text-text">MATCH SETUP</h2>
        </div>

        {/* Mode */}
        <Section label="Mode">
          <Chips
            options={[{ value: 'cpu', label: 'vs CPU' }, { value: 'local', label: 'Pass & Play' }]}
            value={vsMode}
            onChange={v => setVsMode(v as 'cpu' | 'local')}
            cols={2}
          />
        </Section>

        {/* Manager names */}
        <Section label="Managers">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-home text-xs font-display font-bold mb-1">HOME</p>
              <input
                value={homeName}
                onChange={e => setHomeName(e.target.value)}
                maxLength={20}
                placeholder="Your name"
                className="w-full bg-surface2 border border-home/40 rounded-lg px-3 py-2 text-text font-display text-sm focus:outline-none focus:border-home"
              />
            </div>
            <div>
              <p className="text-away text-xs font-display font-bold mb-1">AWAY</p>
              <input
                value={awayName}
                onChange={e => setAwayName(e.target.value)}
                maxLength={20}
                placeholder={vsMode === 'cpu' ? 'CPU' : 'Opponent'}
                disabled={vsMode === 'cpu'}
                className="w-full bg-surface2 border border-away/40 rounded-lg px-3 py-2 text-text font-display text-sm focus:outline-none focus:border-away disabled:opacity-40"
              />
            </div>
          </div>
        </Section>

        {/* CPU difficulty */}
        {vsMode === 'cpu' && (
          <Section label="CPU Difficulty">
            <Chips
              options={[
                { value: 'Easy', label: 'Easy' },
                { value: 'Pro', label: 'Pro' },
                { value: 'Legend', label: 'Legend' },
              ]}
              value={difficulty}
              onChange={v => setDifficulty(v as Difficulty)}
              cols={3}
            />
          </Section>
        )}

        {/* Squad size */}
        <Section label="Squad Size">
          <div className="grid grid-cols-4 gap-2">
            {SQUAD_SIZES.map(s => (
              <button
                key={s}
                onClick={() => setSquadSize(s)}
                className={`py-3 rounded-lg font-display font-bold text-lg transition-all focus-visible:outline-2 focus-visible:outline-lime active:scale-95
                  ${squadSize === s ? 'bg-lime text-base' : 'bg-surface2 border border-line text-muted hover:border-muted'}`}
              >
                {s}v{s}
              </button>
            ))}
          </div>
        </Section>

        {/* Budget */}
        <Section label={`Budget — Total: $${total}M`}>
          <div className="grid grid-cols-2 gap-2">
            {BUDGET_TIERS.map(t => (
              <button
                key={t.label}
                onClick={() => setBudgetTier(t.label)}
                className={`py-3 px-3 rounded-lg font-display font-bold text-sm transition-all text-left focus-visible:outline-2 focus-visible:outline-lime active:scale-95
                  ${budgetTier === t.label
                    ? 'bg-gold/20 border-2 border-gold text-gold'
                    : 'bg-surface2 border border-line text-muted hover:border-muted'}`}
              >
                <div>{t.label}</div>
                <div className="text-xs font-normal opacity-75">{t.desc}</div>
              </button>
            ))}
          </div>
        </Section>

        {/* Draft mode */}
        <Section label="Draft Mode">
          <Chips
            options={[
              { value: 'classic', label: 'Classic' },
              { value: 'snake', label: 'Snake Draft' },
            ]}
            value={draftMode}
            onChange={v => setDraftMode(v as DraftMode)}
            cols={2}
          />
          <p className="text-muted text-xs mt-2">
            {draftMode === 'snake'
              ? 'Turns alternate each round: Home → Away → Away → Home. Pick before your opponent does!'
              : 'Home builds their squad fully, then Away.'}
          </p>
        </Section>

        <button
          onClick={handleStart}
          className="w-full bg-lime text-base font-display font-bold text-xl py-4 rounded-xl hover:brightness-110 transition-all focus-visible:outline-2 focus-visible:outline-white active:scale-95 mt-2"
        >
          ENTER THE MARKET →
        </button>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-muted text-xs uppercase tracking-widest mb-2">{label}</p>
      {children}
    </div>
  );
}

function Chips({
  options, value, onChange, cols,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  cols: number;
}) {
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`py-3 rounded-lg font-display font-bold text-sm transition-all focus-visible:outline-2 focus-visible:outline-lime active:scale-95
            ${value === o.value ? 'bg-lime text-base' : 'bg-surface2 border border-line text-muted hover:border-muted'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
