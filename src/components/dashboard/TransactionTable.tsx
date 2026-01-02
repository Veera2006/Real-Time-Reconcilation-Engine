import { useState } from 'react';
import { Transaction, TransactionStatus } from '@/data/mockTransactions';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChevronRight, ExternalLink, AlertCircle, CheckCircle2, Clock, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionTableProps {
  transactions: Transaction[];
  onRowClick: (transaction: Transaction) => void;
  filter: TransactionStatus | null;
  showGST: boolean;
  onGSTToggle: (show: boolean) => void;
}

export function TransactionTable({ transactions, onRowClick, filter, showGST, onGSTToggle }: TransactionTableProps) {
  const [sortField, setSortField] = useState<'timestamp' | 'matchConfidence'>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filteredTransactions = filter 
    ? transactions.filter(t => t.status === filter)
    : transactions;

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortField === 'timestamp') {
      return sortDir === 'desc' 
        ? b.timestamp.getTime() - a.timestamp.getTime()
        : a.timestamp.getTime() - b.timestamp.getTime();
    }
    return sortDir === 'desc'
      ? b.matchConfidence - a.matchConfidence
      : a.matchConfidence - b.matchConfidence;
  });

  const formatAmount = (amount: number | null) => {
    if (amount === null) return '—';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'matched': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'mismatch': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'missing': return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-success';
    if (confidence >= 70) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-secondary/30 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Three-Way Reconciliation Ledger</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch id="gst-toggle" checked={showGST} onCheckedChange={onGSTToggle} />
            <Label htmlFor="gst-toggle" className="text-xs text-muted-foreground cursor-pointer">
              Show GST
            </Label>
          </div>
          <Badge variant="outline" className="text-xs">
            {filteredTransactions.length} transactions
          </Badge>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/20">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">UPI Ref ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Merchant</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Method</th>
              {/* PG Column */}
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-primary bg-primary/5 border-x border-primary/20">
                <div className="flex flex-col items-center">
                  <span>Payment Gateway</span>
                  <span className="text-[10px] normal-case text-muted-foreground">(Amount / Status)</span>
                </div>
              </th>
              {/* OMS Column */}
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-amber bg-amber/5 border-r border-amber/20">
                <div className="flex flex-col items-center">
                  <span>OMS</span>
                  <span className="text-[10px] normal-case text-muted-foreground">(Amount / Status)</span>
                </div>
              </th>
              {/* CBS Column */}
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-foreground bg-secondary/30 border-r border-border/50">
                <div className="flex flex-col items-center">
                  <span>Core Banking</span>
                  <span className="text-[10px] normal-case text-muted-foreground">(Amount / Status)</span>
                </div>
              </th>
              {showGST && (
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">GST</th>
              )}
              <th 
                className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => {
                  if (sortField === 'matchConfidence') {
                    setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField('matchConfidence');
                    setSortDir('desc');
                  }
                }}
              >
                Match %
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {sortedTransactions.map((txn, index) => (
              <tr 
                key={txn.id}
                className={cn(
                  'group transition-colors cursor-pointer',
                  txn.status === 'mismatch' && 'bg-destructive/5 hover:bg-destructive/10',
                  txn.status === 'pending' && 'bg-warning/5 hover:bg-warning/10',
                  txn.status === 'matched' && 'hover:bg-secondary/50',
                  index < 3 && 'row-fade-in'
                )}
                onClick={() => onRowClick(txn)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(txn.status)}
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-[10px] uppercase',
                        txn.status === 'matched' && 'status-matched',
                        txn.status === 'mismatch' && 'status-mismatch',
                        txn.status === 'pending' && 'status-pending'
                      )}
                    >
                      {txn.status}
                    </Badge>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-foreground">{txn.upiRefId}</span>
                    <span className="text-[10px] text-muted-foreground">{format(txn.timestamp, 'dd MMM, HH:mm')}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">{txn.merchant}</span>
                    <span className="text-[10px] text-muted-foreground">{txn.bank}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="text-[10px]">
                    {txn.paymentMethod}
                  </Badge>
                </td>
                {/* PG Cell */}
                <td className="px-4 py-3 text-center bg-primary/5 border-x border-primary/10">
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      'font-medium text-sm',
                      txn.cbsAmount !== null && txn.pgAmount !== txn.cbsAmount && 'text-destructive'
                    )}>
                      {formatAmount(txn.pgAmount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{txn.pgStatus}</span>
                  </div>
                </td>
                {/* OMS Cell */}
                <td className="px-4 py-3 text-center bg-amber/5 border-r border-amber/10">
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      'font-medium text-sm',
                      txn.omsAmount !== txn.pgAmount && 'text-destructive'
                    )}>
                      {formatAmount(txn.omsAmount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{txn.omsStatus}</span>
                  </div>
                </td>
                {/* CBS Cell */}
                <td className="px-4 py-3 text-center bg-secondary/20 border-r border-border/30">
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      'font-medium text-sm',
                      txn.cbsAmount === null && 'text-destructive italic',
                      txn.cbsAmount !== null && txn.cbsAmount !== txn.pgAmount && 'text-destructive'
                    )}>
                      {txn.cbsAmount === null ? 'NOT FOUND' : formatAmount(txn.cbsAmount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{txn.cbsStatus || '—'}</span>
                  </div>
                </td>
                {showGST && (
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-muted-foreground">{formatAmount(txn.gstAmount || 0)}</span>
                  </td>
                )}
                <td className="px-4 py-3 text-center">
                  <div className={cn(
                    'inline-flex items-center justify-center w-12 h-6 rounded-full text-xs font-semibold',
                    getConfidenceColor(txn.matchConfidence),
                    txn.matchConfidence >= 90 && 'bg-success/10',
                    txn.matchConfidence >= 70 && txn.matchConfidence < 90 && 'bg-warning/10',
                    txn.matchConfidence < 70 && 'bg-destructive/10'
                  )}>
                    {txn.matchConfidence}%
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="p-1.5 rounded-md hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
