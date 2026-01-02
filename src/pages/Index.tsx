import { useState, useCallback, useMemo } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { HeatmapGrid } from '@/components/dashboard/HeatmapGrid';
import { TransactionTable } from '@/components/dashboard/TransactionTable';
import { MismatchPanel } from '@/components/dashboard/MismatchPanel';
import { generateMockTransactions, generateHeatmapData, Transaction, TransactionStatus } from '@/data/mockTransactions';
import { toast } from 'sonner';

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => generateMockTransactions());
  const [heatmapData] = useState(() => generateHeatmapData());
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | null>(null);
  const [isLiveSimulating, setIsLiveSimulating] = useState(false);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalSettled = transactions
      .filter(t => t.status === 'matched')
      .reduce((sum, t) => sum + t.pgAmount, 0);
    
    const activeMismatches = transactions.filter(t => t.status === 'mismatch').length;
    
    const upiCount = transactions.filter(t => t.paymentMethod === 'UPI').length;
    const cardCount = transactions.filter(t => t.paymentMethod === 'Card').length;
    
    const autoResolved = 12; // Mock number
    
    return { totalSettled, activeMismatches, upiCount, cardCount, autoResolved };
  }, [transactions]);

  const handleSimulateLive = useCallback(() => {
    setIsLiveSimulating(true);
    toast.info('Simulating live transaction ingestion...');

    // Simulate 3 new transactions coming in
    const newTransactions: Transaction[] = [
      {
        id: `TXN${Date.now()}001`,
        upiRefId: `pay_LIVE${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        orderId: `ORD${Date.now()}`,
        merchant: 'Nykaa',
        bank: 'ICICI Bank',
        paymentGateway: 'Razorpay',
        pgAmount: 450,
        omsAmount: 450,
        cbsAmount: 450,
        pgStatus: 'Success',
        omsStatus: 'Completed',
        cbsStatus: 'Settled',
        status: 'matched' as TransactionStatus,
        matchConfidence: 100,
        timestamp: new Date(),
        paymentMethod: 'UPI',
        gstAmount: 81,
      },
      {
        id: `TXN${Date.now()}002`,
        upiRefId: `pay_LIVE${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        orderId: `ORD${Date.now() + 1}`,
        merchant: 'Nykaa',
        bank: 'HDFC Bank',
        paymentGateway: 'PayU',
        pgAmount: 890,
        omsAmount: 890,
        cbsAmount: null,
        pgStatus: 'Success',
        omsStatus: 'Completed',
        cbsStatus: null,
        status: 'pending' as TransactionStatus,
        matchConfidence: 50,
        timestamp: new Date(),
        paymentMethod: 'Card',
        gstAmount: 160,
      },
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < newTransactions.length) {
        setTransactions(prev => [newTransactions[index], ...prev]);
        toast.success(`New transaction ingested: ${newTransactions[index].upiRefId}`);
        index++;
      } else {
        clearInterval(interval);
        setIsLiveSimulating(false);
        toast.success('Live simulation completed');
      }
    }, 1500);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header onSimulateLive={handleSimulateLive} isLiveSimulating={isLiveSimulating} />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Cards */}
          <SummaryCards {...summaryStats} />

          {/* Heatmap and Quick Stats Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <HeatmapGrid 
                data={heatmapData} 
                onCellClick={setStatusFilter} 
                activeFilter={statusFilter}
              />
            </div>
            <div className="rounded-lg border border-border/50 bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Avg. Settlement Time</span>
                  <span className="text-sm font-medium text-foreground">2.3 hrs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Match Rate (24h)</span>
                  <span className="text-sm font-medium text-success">98.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">GST Discrepancies</span>
                  <span className="text-sm font-medium text-warning">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Pending Escalations</span>
                  <span className="text-sm font-medium text-destructive">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Top PG Today</span>
                  <span className="text-sm font-medium text-foreground">Razorpay</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Top Bank Today</span>
                  <span className="text-sm font-medium text-foreground">HDFC Bank</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Table */}
          <TransactionTable 
            transactions={transactions}
            filter={statusFilter}
          />
        </main>
      </div>


    </div>
  );
};

export default Index;
