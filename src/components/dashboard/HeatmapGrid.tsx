import { useState, useMemo } from 'react';
import { Transaction, TransactionStatus } from '@/data/mockTransactions';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HeatmapGridProps {
  transactions: Transaction[];
  onCellClick: (status: TransactionStatus | null) => void;
  activeFilter: TransactionStatus | null;
}

const GATEWAYS = ['Razorpay', 'PayU', 'Paytm', 'Cashfree', 'Instamojo'];
const TIME_WINDOW_SEC = 60; // Show last 60 seconds
const SLOTS = 20; // 20 slots of 3 seconds each

export function HeatmapGrid({ transactions, onCellClick, activeFilter }: HeatmapGridProps) {
  const [hoveredCell, setHoveredCell] = useState<{ pg: string, slot: number } | null>(null);

  // Calculate grid data
  const gridData = useMemo(() => {
    const now = new Date().getTime();
    const slotDuration = (TIME_WINDOW_SEC * 1000) / SLOTS;
    
    // Initialize empty grid
    const grid: Record<string, Array<{ status: TransactionStatus | 'empty', count: number }>> = {};
    
    GATEWAYS.forEach(pg => {
      grid[pg] = Array(SLOTS).fill(null).map(() => ({ status: 'empty', count: 0 }));
    });

    // Populate grid
    transactions.forEach(txn => {
      const timeDiff = now - txn.timestamp.getTime();
      if (timeDiff > TIME_WINDOW_SEC * 1000 || timeDiff < 0) return; // Out of window

      const slotIndex = Math.floor(timeDiff / slotDuration);
      if (slotIndex >= SLOTS) return;

      const pg = GATEWAYS.includes(txn.paymentGateway) ? txn.paymentGateway : 'Razorpay'; // Default fallback or Add 'Other'
      
      const currentCell = grid[pg][slotIndex];
      currentCell.count++;
      
      // Upgrade status priority: Mismatch > Pending > Matched
      if (txn.status === 'mismatch') currentCell.status = 'mismatch';
      else if (txn.status === 'pending' && currentCell.status !== 'mismatch') currentCell.status = 'pending';
      else if (txn.status === 'matched' && currentCell.status === 'empty') currentCell.status = 'matched';
    });

    return grid;
  }, [transactions]);

  const getStatusColor = (status: string, isHovered: boolean, isActive: boolean) => {
    if (status === 'empty') return 'bg-secondary/30';
    
    const baseColor = {
      matched: 'bg-success',
      mismatch: 'bg-destructive animate-pulse',
      pending: 'bg-warning',
    }[status] || 'bg-secondary/30';

    if (isActive) return `ring-2 ring-foreground ${baseColor}`;
    if (isHovered) return `${baseColor} opacity-80`;
    return baseColor;
  };

  return (
    <div className="rounded-lg border border-border/50 bg-card p-4 transition-all">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Live Transaction Matrix</h3>
          <p className="text-xs text-muted-foreground">Real-time status (Time vs Gateway)</p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1"><div className="h-2 w-2 bg-success rounded-sm"/> Matched</span>
          <span className="flex items-center gap-1"><div className="h-2 w-2 bg-destructive rounded-sm"/> Mismatch</span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {GATEWAYS.map(pg => (
          <div key={pg} className="flex items-center gap-2">
            <span className="w-16 text-[10px] font-medium text-muted-foreground text-right truncate">
              {pg}
            </span>
            <div className="flex-1 grid grid-cols-20 gap-0.5">
              {gridData[pg].map((cell, idx) => (
                <Tooltip key={`${pg}-${idx}`}>
                  <TooltipTrigger asChild>
                    <button
                      className={cn(
                        "h-6 rounded-xs transition-colors",
                        getStatusColor(cell.status, 
                          hoveredCell?.pg === pg && hoveredCell?.slot === idx,
                          activeFilter === cell.status
                        )
                      )}
                      onClick={() => cell.status !== 'empty' && onCellClick(activeFilter === cell.status ? null : cell.status)}
                      onMouseEnter={() => setHoveredCell({ pg, slot: idx })}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  </TooltipTrigger>
                  {cell.status !== 'empty' && (
                    <TooltipContent className="text-xs">
                      {pg} • {cell.count} Txn • {cell.status}
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </div>
          </div>
        ))}
      </div>
       
       <div className="mt-2 flex justify-between px-16 text-[10px] text-muted-foreground">
          <span>Now</span>
          <span>-30s</span>
          <span>-60s</span>
       </div>
    </div>
  );
}
