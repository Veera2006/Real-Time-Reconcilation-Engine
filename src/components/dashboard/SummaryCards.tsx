import { IndianRupee, AlertTriangle, CreditCard, CheckCircle2, Smartphone } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SummaryCardsProps {
  totalSettled: number;
  activeMismatches: number;
  upiCount: number;
  cardCount: number;
  autoResolved: number;
}

export function SummaryCards({ totalSettled, activeMismatches, upiCount, cardCount, autoResolved }: SummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Settled */}
      <Card className="relative overflow-hidden border-border/50 bg-card p-5 transition-all hover:shadow-glow-mint group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Settled</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(totalSettled)}</p>
            <p className="mt-1 text-xs text-success">+12.5% from yesterday</p>
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

      {/* UPI vs Card Split */}
      <Card className="relative overflow-hidden border-border/50 bg-card p-5 transition-all hover:border-primary/30 group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">UPI vs Card Split</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{upiCount}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-lg font-semibold text-muted-foreground">{cardCount}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Smartphone className="h-3 w-3 text-primary" />
                <span className="text-xs text-muted-foreground">UPI</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Card</span>
              </div>
            </div>
          </div>
          <div className="flex -space-x-1">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div 
            className="h-full rounded-full bg-primary transition-all" 
            style={{ width: `${(upiCount / (upiCount + cardCount)) * 100}%` }}
          />
        </div>
      </Card>

      {/* Auto-Resolved Today */}
      <Card className="relative overflow-hidden border-border/50 bg-card p-5 transition-all hover:border-success/30 group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Auto-Resolved Today</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{autoResolved}</p>
            <p className="mt-1 text-xs text-success">By AI Reconciler</p>
          </div>
          <div className="rounded-lg bg-success/10 p-2.5">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-success/30 to-success/60 opacity-0 transition-opacity group-hover:opacity-100" />
      </Card>
    </div>
  );
}
