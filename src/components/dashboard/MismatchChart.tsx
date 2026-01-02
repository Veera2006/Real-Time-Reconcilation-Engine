import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Transaction } from '@/data/mockTransactions';
import { Card } from '@/components/ui/card';

interface MismatchChartProps {
  transactions: Transaction[];
}

export function MismatchChart({ transactions }: MismatchChartProps) {
  // Filter for mismatches and take the most recent ones
  const mismatchData = transactions
    .filter(t => t.status === 'mismatch' || t.errorType === 'status_inconsistency')
    .map(t => ({
      id: t.id,
      amount: t.pgAmount,
      omsAmount: t.omsAmount,
      // If status mismatch but amounts match, show a fake 'diff' for visual visibility or keep 0
      diff: Math.abs(t.pgAmount - t.omsAmount), 
      isStatusMismatch: t.errorType === 'status_inconsistency',
      gateway: t.paymentGateway
    }))
    .slice(0, 15); // Show last 15 mismatches

  if (mismatchData.length === 0) {
    return (
       <Card className="border-border/50 bg-card p-8 flex flex-col items-center justify-center text-muted-foreground h-[400px] w-full animate-in fade-in-50">
         <div className="h-12 w-12 rounded-full bg-secondary/30 flex items-center justify-center mb-4">
            <span className="text-2xl">✅</span>
         </div>
         <p className="font-medium">No mismatches detected</p>
         <p className="text-xs opacity-70 mt-1">System is fully reconciled</p>
       </Card>
    )
  }

  return (
    <Card className="p-6 border-border/50 bg-card h-[400px] flex flex-col w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
           <h3 className="text-sm font-semibold text-foreground">Mismatch Severity Analyzer</h3>
           <p className="text-xs text-muted-foreground">Recent discrepancies (Transaction ID vs Amount)</p>
        </div>
        <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-medium text-destructive">{mismatchData.length} Active Issues</span>
        </div>
      </div>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mismatchData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
            <XAxis 
                dataKey="id" 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                interval={0} 
                angle={-45} 
                textAnchor="end" 
                height={60}
                tickMargin={10}
            />
            <YAxis 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip 
                cursor={{ fill: 'rgba(239, 68, 68, 0.05)' }}
                content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                        <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
                            <p className="text-xs font-semibold mb-2">{label}</p>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">PG Amount:</span>
                                    <span className="font-mono">₹{data.amount}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">OMS Amount:</span>
                                    <span className="font-mono">₹{data.omsAmount}</span>
                                </div>
                                <div className="border-t border-border/50 my-1 pt-1 flex justify-between gap-4 text-destructive font-medium">
                                    <span>Delta:</span>
                                    <span>₹{data.diff.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    );
                    }
                    return null;
                }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} animationDuration={500}>
                {mismatchData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isStatusMismatch ? '#f59e0b' : '#ef4444'} // Orange for status, Red for amount
                    />
                ))}
            </Bar>
            </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
