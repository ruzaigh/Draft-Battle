import type { Player } from '../types';

const NAT_COLORS: Record<string, [string, string]> = {
  'Brazil': ['#009C3B', '#FFDF00'],
  'France': ['#002395', '#ED2939'],
  'England': ['#CF1020', '#FFFFFF'],
  'Spain': ['#AA151B', '#F1BF00'],
  'Germany': ['#000000', '#DD0000'],
  'Argentina': ['#74ACDF', '#FFFFFF'],
  'Portugal': ['#006600', '#FF0000'],
  'Netherlands': ['#FF6600', '#FFFFFF'],
  'Italy': ['#009246', '#CE2B37'],
  'Belgium': ['#000000', '#FAE042'],
  'Norway': ['#EF2B2D', '#003680'],
  'Poland': ['#DC143C', '#FFFFFF'],
  'Sweden': ['#006AA7', '#FECC02'],
  'Egypt': ['#CE1126', '#FFFFFF'],
  'Morocco': ['#C1272D', '#006233'],
  'Nigeria': ['#008751', '#FFFFFF'],
  'Turkey': ['#E30A17', '#FFFFFF'],
  'Georgia': ['#FFFFFF', '#FF0000'],
  'Ecuador': ['#FFD100', '#003893'],
  'Uruguay': ['#5FFFFF', '#003087'],
  'Slovenia': ['#003DA5', '#FFFFFF'],
  'Switzerland': ['#FF0000', '#FFFFFF'],
  'Guinea': ['#CE1126', '#009A44'],
  'Czech Republic': ['#D7141A', '#11457E'],
  'Ghana': ['#006B3F', '#FCD116'],
  'Wales': ['#C8102E', '#00AB39'],
  'Icons': ['#F5C842', '#0A1410'],
};

function initials(name: string): string {
  const parts = name.replace(' (R9)', '').replace(' (CR7)', '').split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface AvatarProps {
  player: Player;
  size?: number;
  className?: string;
}

export default function Avatar({ player, size = 48, className = '' }: AvatarProps) {
  const [c1, c2] = NAT_COLORS[player.nat] ?? ['#27463A', '#EAF2EC'];
  const gradId = `av-${player.n.replace(/[^a-z0-9]/gi, '')}`;

  if (player.img) {
    return (
      <img
        src={player.img}
        alt={player.n}
        width={size}
        height={size}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  const fs = size * 0.31;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={`rounded-full flex-shrink-0 ${className}`}
      aria-label={player.n}
      role="img"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill={`url(#${gradId})`} />
      <ellipse cx="24" cy="19" rx="7" ry="8" fill="rgba(0,0,0,0.18)" />
      <ellipse cx="24" cy="37" rx="12" ry="9" fill="rgba(0,0,0,0.18)" />
      <text
        x="24" y="27"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fs}
        fontWeight="700"
        fontFamily="Oswald, sans-serif"
        fill="rgba(255,255,255,0.95)"
      >
        {initials(player.n)}
      </text>
    </svg>
  );
}
