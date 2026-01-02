import { useState } from 'react';
import { TransactionStatus } from '@/data/mockTransactions';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HeatmapGridProps {
  data: { status: TransactionStatus; index: number }[];
  onCellClick: (status: TransactionStatus | null) => void;
  activeFilter: TransactionStatus | null;
}

export function HeatmapGrid({ data, onCellClick, activeFilter }: HeatmapGridProps) {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);

  const getStatusLabel = (status: TransactionStatus) => {
    switch (status) {
      case 'matched': return 'Matched';
      case 'mismatch': return 'Mismatch';
      case 'pending': return 'Pending';
      case 'missing': return 'Missing';
    }
  };

  const getStatusCount = (status: TransactionStatus) => {
    return data.filter(d => d.status === status).length;
  };

  return (
    <div className="rounded-lg border border-border/50 bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Real-Time Reconciliation Heatmap</h3>
          <p className="text-xs text-muted-foreground">Last 100 transactions • Click to filter</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-success" />
            <span className="text-muted-foreground">Matched ({getStatusCount('matched')})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-destructive animate-pulse" />
            <span className="text-muted-foreground">Mismatch ({getStatusCount('mismatch')})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-warning" />
            <span className="text-muted-foreground">Pending ({getStatusCount('pending')})</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-1.5">
        {data.map((cell) => (
          <Tooltip key={cell.index}>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  'heatmap-cell',
                  cell.status === 'matched' && 'heatmap-matched',
                  cell.status === 'mismatch' && 'heatmap-mismatch',
                  cell.status === 'pending' && 'heatmap-pending',
                  activeFilter && activeFilter !== cell.status && 'opacity-30',
                  activeFilter === cell.status && 'ring-2 ring-foreground ring-offset-1 ring-offset-background'
                )}
                onClick={() => onCellClick(activeFilter === cell.status ? null : cell.status)}
                onMouseEnter={() => setHoveredCell(cell.index)}
                onMouseLeave={() => setHoveredCell(null)}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-popover border-border">
              <p className="text-xs">
                Transaction #{cell.index + 1}: <span className={cn(
                  cell.status === 'matched' && 'text-success',
                  cell.status === 'mismatch' && 'text-destructive',
                  cell.status === 'pending' && 'text-warning'
                )}>{getStatusLabel(cell.status)}</span>
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {activeFilter && (
        <div className="mt-3 flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">
            Filtering by: <span className="font-medium text-foreground">{getStatusLabel(activeFilter)}</span>
          </span>
          <button
            onClick={() => onCellClick(null)}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
}
