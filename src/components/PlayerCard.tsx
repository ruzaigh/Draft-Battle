import type { Player } from '../types';
import Avatar from './Avatar';

interface Tier {
  bg: string;
  border: string;
  badge: string;
}

function tier(ovr: number, isIcon?: boolean): Tier {
  if (isIcon || ovr >= 90) return { bg: 'from-lime/20 to-lime/5', border: 'border-lime', badge: 'bg-lime text-base' };
  if (ovr >= 87) return { bg: 'from-gold/20 to-gold/5', border: 'border-gold', badge: 'bg-gold text-base' };
  if (ovr >= 84) return { bg: 'from-silver/20 to-silver/5', border: 'border-silver', badge: 'bg-silver text-base' };
  return { bg: 'from-bronze/20 to-bronze/5', border: 'border-bronze', badge: 'bg-bronze text-base' };
}

const STAT_LABELS = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];

interface PlayerCardProps {
  player: Player;
  compact?: boolean;
  teamColor?: string;
  onClick?: () => void;
}

export default function PlayerCard({ player, compact = false, teamColor, onClick }: PlayerCardProps) {
  const t = tier(player.ovr, player.isIcon);

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 bg-surface2 rounded-lg px-2 py-1.5 min-w-0 border`}
        style={{ borderColor: teamColor ?? '#27463A' }}
      >
        <Avatar player={player} size={26} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 min-w-0">
            <span className={`text-[11px] font-bold font-display ${t.badge} px-1 rounded flex-shrink-0`}>
              {player.ovr}
            </span>
            <span className="text-xs font-display text-text truncate min-w-0 leading-none">{player.n}</span>
          </div>
          <div className="flex items-center gap-1 min-w-0 mt-0.5">
            <span className="text-[10px] text-muted flex-shrink-0">{player.pos}</span>
            <span className="text-[10px] text-muted truncate min-w-0">{player.club}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full bg-gradient-to-b ${t.bg} border-2 ${t.border} rounded-xl p-3 text-left transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-lime`}
    >
      <div className="flex items-center gap-3 mb-2">
        <Avatar player={player} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-sm font-bold font-display ${t.badge} px-1.5 py-0.5 rounded`}>{player.ovr}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-surface2 text-muted font-display">{player.pos}</span>
            {player.isIcon && <span className="text-xs px-1.5 py-0.5 rounded bg-lime/20 text-lime font-display">ICON</span>}
          </div>
          <p className="font-display font-semibold text-text text-base mt-0.5 truncate leading-tight">{player.n}</p>
          <p className="text-muted text-xs truncate">{player.club} · ${player.val}M</p>
        </div>
      </div>
      {player.s && (
        <div className="grid grid-cols-6 gap-1 pt-2 border-t border-line">
          {STAT_LABELS.map((label, i) => (
            <div key={label} className="text-center">
              <div className="text-xs font-bold text-text">{player.s![i]}</div>
              <div className="text-[9px] text-muted leading-none">{label}</div>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}
