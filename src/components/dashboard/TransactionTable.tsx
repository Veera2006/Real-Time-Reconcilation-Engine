import { useState } from 'react';
import { Transaction, TransactionStatus } from '@/data/mockTransactions';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface TransactionTableProps {
  transactions: Transaction[];
  filter: TransactionStatus | null;
}

export function TransactionTable({ transactions, filter }: TransactionTableProps) {
  // Sort by timestamp desc by default
  const [sortField, setSortField] = useState<'timestamp'>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filteredTransactions = filter 
    ? transactions.filter(t => t.status === filter)
    : transactions;

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    // Currently only sorting by timestamp is exposed/persisted, but structure allows for more
    return sortDir === 'desc' 
      ? b.timestamp.getTime() - a.timestamp.getTime()
      : a.timestamp.getTime() - b.timestamp.getTime();
  });

  const formatAmount = (amount: number | null) => {
    if (amount === null) return '—';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-secondary/30 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Two-Way Reconciliation Ledger</h3>
        <div className="flex items-center gap-4">
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
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground w-[150px]">
                Date & Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Transaction ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Method
              </th>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {sortedTransactions.map((txn, index) => (
              <tr 
                key={txn.id}
                className={cn(
                  'group transition-colors',
                  txn.status === 'mismatch' && 'bg-destructive/5 hover:bg-destructive/10',
                  txn.status === 'pending' && 'bg-warning/5 hover:bg-warning/10',
                  txn.status === 'matched' && 'hover:bg-secondary/50',
                  index < 3 && 'row-fade-in'
                )}
              >
                {/* Date & Time */}
                <td className="px-4 py-3 text-sm text-muted-foreground">
                   {format(txn.timestamp, 'MMM dd, HH:mm:ss')}
                </td>
                
                {/* Transaction ID */}
                <td className="px-4 py-3 font-mono text-xs">
                    {txn.id}
                </td>

                {/* Method */}
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="text-[10px]">
                    {txn.paymentMethod}
                  </Badge>
                </td>

                {/* PG Cell */}
                <td className="px-4 py-3 text-center bg-primary/5 border-x border-primary/10">
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      'font-medium text-sm'
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
