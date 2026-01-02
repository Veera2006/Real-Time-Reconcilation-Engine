import { IndianRupee, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SummaryCardsProps {
  totalSettled: number;
  activeMismatches: number;
  upiCount: number;
  cardCount: number;
  autoResolved: number;
}

export function SummaryCards({ totalSettled, activeMismatches }: Pick<SummaryCardsProps, 'totalSettled' | 'activeMismatches'>) {
  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Total Settled */}
      <Card className="relative overflow-hidden border-border/50 bg-card p-5 transition-all hover:shadow-glow-mint group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Settled</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(totalSettled)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Live reconciliation</p>
          </div>
          <div className="rounded-lg bg-success/10 p-2.5">
            <IndianRupee className="h-5 w-5 text-success" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-success/50 to-success opacity-0 transition-opacity group-hover:opacity-100" />
      </Card>

      {/* Active Mismatches */}
      <Card className="relative overflow-hidden border-border/50 bg-card p-5 transition-all hover:shadow-glow-rose group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Mismatches</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{activeMismatches}</p>
            <p className="mt-1 text-xs text-destructive">Requires attention</p>
          </div>
          <div className="rounded-lg bg-destructive/10 p-2.5">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-destructive/50 to-destructive opacity-0 transition-opacity group-hover:opacity-100" />
      </Card>
    </div>
  );
}
