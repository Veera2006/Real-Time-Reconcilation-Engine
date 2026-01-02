import { Transaction } from '@/data/mockTransactions';
import { X, Zap, AlertTriangle, ArrowRight, CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MismatchPanelProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function MismatchPanel({ transaction, onClose }: MismatchPanelProps) {
  if (!transaction) return null;

  const formatAmount = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getErrorTypeLabel = (type?: string | null) => {
    switch (type) {
      case 'amount_mismatch': return 'Amount Mismatch';
      case 'missing_entry': return 'Missing Entry';
      case 'status_inconsistency': return 'Status Inconsistency';
      default: return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border shadow-2xl panel-slide-in z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4 bg-secondary/30">
        <div className="flex items-center gap-3">
          <div className={cn(
            'rounded-lg p-2',
            transaction.status === 'mismatch' && 'bg-destructive/20',
            transaction.status === 'pending' && 'bg-warning/20',
            transaction.status === 'matched' && 'bg-success/20'
          )}>
            <AlertTriangle className={cn(
              'h-5 w-5',
              transaction.status === 'mismatch' && 'text-destructive',
              transaction.status === 'pending' && 'text-warning',
              transaction.status === 'matched' && 'text-success'
            )} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Transaction Details</h2>
            <p className="text-xs text-muted-foreground">{transaction.id}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Error Summary */}
        {transaction.errorType && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-destructive">{getErrorTypeLabel(transaction.errorType)}</h3>
                <p className="mt-1 text-xs text-foreground/80">{transaction.errorDescription}</p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Info */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction Info</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-secondary/50 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">UPI Ref ID</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs text-foreground">{transaction.upiRefId}</span>
                <button onClick={() => copyToClipboard(transaction.upiRefId)} className="text-muted-foreground hover:text-foreground">
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="rounded-md bg-secondary/50 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Order ID</p>
              <span className="font-mono text-xs text-foreground">{transaction.orderId}</span>
            </div>
            <div className="rounded-md bg-secondary/50 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Merchant</p>
              <span className="text-xs text-foreground">{transaction.merchant}</span>
            </div>
            <div className="rounded-md bg-secondary/50 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Bank</p>
              <span className="text-xs text-foreground">{transaction.bank}</span>
            </div>
            <div className="rounded-md bg-secondary/50 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Payment Method</p>
              <Badge variant="secondary" className="mt-1 text-[10px]">{transaction.paymentMethod}</Badge>
            </div>
            <div className="rounded-md bg-secondary/50 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Timestamp</p>
              <span className="text-xs text-foreground">{format(transaction.timestamp, 'dd MMM yyyy, HH:mm:ss')}</span>
            </div>
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Three-Way Comparison */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Three-Way Comparison</h4>
          <div className="space-y-2">
            {/* PG */}
            <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs font-medium text-foreground">{transaction.paymentGateway}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{formatAmount(transaction.pgAmount)}</p>
                <p className="text-[10px] text-muted-foreground">{transaction.pgStatus}</p>
              </div>
            </div>
            <ArrowRight className="mx-auto h-4 w-4 text-muted-foreground" />
            {/* OMS */}
            <div className="flex items-center justify-between rounded-md border border-amber/30 bg-amber/5 p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber" />
                <span className="text-xs font-medium text-foreground">{transaction.merchant} OMS</span>
              </div>
              <div className="text-right">
                <p className={cn(
                  'text-sm font-semibold',
                  transaction.omsAmount !== transaction.pgAmount ? 'text-destructive' : 'text-foreground'
                )}>
                  {formatAmount(transaction.omsAmount)}
                </p>
                <p className="text-[10px] text-muted-foreground">{transaction.omsStatus}</p>
              </div>
            </div>
            <ArrowRight className="mx-auto h-4 w-4 text-muted-foreground" />
            {/* CBS */}
            <div className={cn(
              'flex items-center justify-between rounded-md border p-3',
              transaction.cbsAmount === null 
                ? 'border-destructive/50 bg-destructive/10' 
                : 'border-border bg-secondary/30'
            )}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  'h-2 w-2 rounded-full',
                  transaction.cbsAmount === null ? 'bg-destructive' : 'bg-foreground'
                )} />
                <span className="text-xs font-medium text-foreground">{transaction.bank} CBS</span>
              </div>
              <div className="text-right">
                <p className={cn(
                  'text-sm font-semibold',
                  transaction.cbsAmount === null ? 'text-destructive' : 
                    transaction.cbsAmount !== transaction.pgAmount ? 'text-destructive' : 'text-foreground'
                )}>
                  {transaction.cbsAmount === null ? 'NOT FOUND' : formatAmount(transaction.cbsAmount)}
                </p>
                <p className="text-[10px] text-muted-foreground">{transaction.cbsStatus || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Match Confidence */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Match Confidence</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
              <div 
                className={cn(
                  'h-full rounded-full transition-all',
                  transaction.matchConfidence >= 90 && 'bg-success',
                  transaction.matchConfidence >= 70 && transaction.matchConfidence < 90 && 'bg-warning',
                  transaction.matchConfidence < 70 && 'bg-destructive'
                )}
                style={{ width: `${transaction.matchConfidence}%` }}
              />
            </div>
            <span className={cn(
              'text-lg font-bold',
              transaction.matchConfidence >= 90 && 'text-success',
              transaction.matchConfidence >= 70 && transaction.matchConfidence < 90 && 'text-warning',
              transaction.matchConfidence < 70 && 'text-destructive'
            )}>
              {transaction.matchConfidence}%
            </span>
          </div>
        </div>

        {/* Auto-Fix Recommendation */}
        {transaction.autoFixRecommendation && (
          <>
            <Separator className="bg-border/50" />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">AI Auto-Fix Recommendation</h4>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm text-foreground leading-relaxed">{transaction.autoFixRecommendation}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border p-4 bg-secondary/30 space-y-2">
        {transaction.status === 'mismatch' && (
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast.success('Auto-fix applied successfully!')}>
            <Zap className="mr-2 h-4 w-4" />
            Apply Auto-Fix
          </Button>
        )}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 border-border hover:bg-secondary">
            <ExternalLink className="mr-2 h-4 w-4" />
            View in PG
          </Button>
          <Button variant="outline" className="flex-1 border-border hover:bg-secondary">
            Escalate
          </Button>
        </div>
      </div>
    </div>
  );
}
