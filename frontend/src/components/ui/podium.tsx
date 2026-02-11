import React from 'react';
import { Trophy, Medal, Award, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PodiumEntry {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  rank: number;
  badge?: string;
}

interface PodiumProps {
  entries?: PodiumEntry[];
  title?: string;
  showScores?: boolean;
  className?: string;
}

export function Podium({
  entries = [],
  title = 'Top Performers',
  showScores = true,
  className,
}: PodiumProps) {
  const sortedEntries = [...entries].sort((a, b) => a.rank - b.rank);
  const [first, second, third] = sortedEntries;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-7 h-7 text-slate-400" />;
      case 3:
        return <Award className="w-7 h-7 text-amber-700" />;
      default:
        return <Star className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50';
      case 2:
        return 'from-slate-400/20 to-slate-500/20 border-slate-400/50';
      case 3:
        return 'from-amber-700/20 to-amber-800/20 border-amber-700/50';
      default:
        return 'from-muted/20 to-muted/30 border-border';
    }
  };

  const getPodiumHeight = (rank: number) => {
    switch (rank) {
      case 1:
        return 'h-48';
      case 2:
        return 'h-36';
      case 3:
        return 'h-28';
      default:
        return 'h-20';
    }
  };

  const PodiumCard = ({ entry }: { entry: PodiumEntry }) => (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div
          className={cn(
            'absolute -top-2 -right-2 z-10 bg-gradient-to-br rounded-full p-2 border-2',
            getRankColor(entry.rank),
          )}
        >
          {getRankIcon(entry.rank)}
        </div>
        <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
          <AvatarImage src={entry.avatar} alt={entry.name} />
          <AvatarFallback className="text-lg font-bold">
            {entry.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="text-center space-y-1">
        <h3 className="font-bold text-lg text-foreground">{entry.name}</h3>
        {entry.badge && (
          <Badge variant="secondary" className="text-xs">
            {entry.badge}
          </Badge>
        )}
        {showScores && (
          <p className="text-sm font-semibold text-muted-foreground">
            {entry.score.toLocaleString()} pts
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn('w-full max-w-4xl mx-auto p-6 space-y-8', className)}>
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">{title}</h2>
        <p className="text-muted-foreground">Celebrating our top achievers</p>
      </div>

      <Card className="p-8 bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-end justify-center gap-4 md:gap-8">
          {second && (
            <div className="flex flex-col items-center gap-4 flex-1 max-w-[200px]">
              <PodiumCard entry={second} />
              <div
                className={cn(
                  'w-full rounded-t-xl border-2 flex items-center justify-center transition-all hover:scale-105 bg-gradient-to-br',
                  getPodiumHeight(2),
                  getRankColor(2),
                )}
              >
                <span className="text-6xl font-bold opacity-20">2</span>
              </div>
            </div>
          )}

          {first && (
            <div className="flex flex-col items-center gap-4 flex-1 max-w-[200px]">
              <PodiumCard entry={first} />
              <div
                className={cn(
                  'w-full rounded-t-xl border-2 flex items-center justify-center transition-all hover:scale-105 relative overflow-hidden bg-gradient-to-br',
                  getPodiumHeight(1),
                  getRankColor(1),
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent animate-pulse" />
                <span className="text-6xl font-bold opacity-20 relative z-10">
                  1
                </span>
              </div>
            </div>
          )}

          {third && (
            <div className="flex flex-col items-center gap-4 flex-1 max-w-[200px]">
              <PodiumCard entry={third} />
              <div
                className={cn(
                  'w-full rounded-t-xl border-2 flex items-center justify-center transition-all hover:scale-105 bg-gradient-to-br',
                  getPodiumHeight(3),
                  getRankColor(3),
                )}
              >
                <span className="text-6xl font-bold opacity-20">3</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {entries.length > 3 && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4 text-foreground">
            Other Rankings
          </h3>
          <div className="space-y-3">
            {entries
              .filter((entry) => entry.rank > 3)
              .sort((a, b) => a.rank - b.rank)
              .map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <span className="text-2xl font-bold text-muted-foreground w-8">
                    {entry.rank}
                  </span>
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={entry.avatar} alt={entry.name} />
                    <AvatarFallback>
                      {entry.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{entry.name}</p>
                    {entry.badge && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {entry.badge}
                      </Badge>
                    )}
                  </div>
                  {showScores && (
                    <span className="font-semibold text-muted-foreground">
                      {entry.score.toLocaleString()} pts
                    </span>
                  )}
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
