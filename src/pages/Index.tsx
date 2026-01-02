import { useState, useCallback, useMemo, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { HeatmapGrid } from '@/components/dashboard/HeatmapGrid';
import { TransactionTable } from '@/components/dashboard/TransactionTable';
import { MismatchPanel } from '@/components/dashboard/MismatchPanel';
import { generateMockTransactions, generateHeatmapData, Transaction, TransactionStatus } from '@/data/mockTransactions';
import { toast } from 'sonner';

const Index = () => {
  // Start with empty transaction list
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [heatmapData] = useState(() => generateHeatmapData());
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | null>(null);
  const [isLiveSimulating, setIsLiveSimulating] = useState(false);

  // WebSocket Connection
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/recon');

    ws.onopen = () => {
      console.log('✅ Connected to Reconciliation Engine');
      toast.success('Connected to Reconciliation Engine');
      setIsLiveSimulating(true); // Indicate live status
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📥 Received:', data);

        // Map Backend JSON to Frontend Transaction Interface
        const newTxn: Transaction = {
          id: data.txn_id,
          upiRefId: data.txn_id,
          orderId: `ORD_${data.txn_id.split('_')[1] || Date.now()}`, // Generate ORD from TXN if possible
          merchant: 'Nykaa',
          bank: 'HDFC Bank',
          paymentGateway: 'Razorpay',
          pgAmount: data.pg_amount,
          omsAmount: data.oms_amount,
          cbsAmount: null, // Not provided by backend yet
          pgStatus: 'Success',
          omsStatus: 'Completed',
          cbsStatus: null,
          status: data.status === 'MATCHED' ? 'matched' : 'mismatch',
          matchConfidence: data.status === 'MATCHED' ? 100 : 0,
          timestamp: new Date(),
          paymentMethod: 'UPI',
          // Add error details if mismatch
          errorType: data.status !== 'MATCHED' ? 'amount_mismatch' : undefined,
          errorDescription: data.status !== 'MATCHED' ? data.details : undefined,
        };

        setTransactions(prev => [newTxn, ...prev].slice(0, 100)); // Keep last 100
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.onclose = () => {
      console.log('❌ Disconnected from Reconciliation Engine');
      toast.error('Disconnected from Reconciliation Engine');
      setIsLiveSimulating(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalSettled = transactions
      .filter(t => t.status === 'matched')
      .reduce((sum, t) => sum + t.pgAmount, 0);
    
    const activeMismatches = transactions.filter(t => t.status === 'mismatch').length;
    
    const upiCount = transactions.filter(t => t.paymentMethod === 'UPI').length;
    const cardCount = transactions.filter(t => t.paymentMethod === 'Card').length;
    
    const autoResolved = 0; 
    
    return { totalSettled, activeMismatches, upiCount, cardCount, autoResolved };
  }, [transactions]);

  const handleSimulateLive = useCallback(() => {
    // No-op for now, as rely on real WS
    toast.info('Live connection is managed automatically via WebSocket');
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
