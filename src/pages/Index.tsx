import { useState, useCallback, useMemo, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { MismatchChart } from '@/components/dashboard/MismatchChart';
import { TransactionTable } from '@/components/dashboard/TransactionTable';
import { MismatchPanel } from '@/components/dashboard/MismatchPanel';
import { generateMockTransactions, Transaction, TransactionStatus } from '@/data/mockTransactions';
import { toast } from 'sonner';

const Index = () => {
  // Start with empty transaction list
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentView, setCurrentView] = useState('dashboard');
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
          orderId: `ORD_${data.txn_id.split('_')[1] || Date.now()}`, 
          merchant: 'Nykaa',
          bank: 'HDFC Bank',
          paymentGateway: 'Razorpay',
          pgAmount: data.pg_amount,
          omsAmount: data.oms_amount,
          cbsAmount: null,
          pgStatus: data.pg_status || 'Success',
          omsStatus: data.oms_status || 'Completed',
          cbsStatus: null,
          status: data.status === 'MATCHED' ? 'matched' : 'mismatch',
          matchConfidence: data.status === 'MATCHED' ? 100 : 0,
          timestamp: new Date(),
          paymentMethod: 'UPI',
          // Add error details
          errorType: data.status === 'AMOUNT_MISMATCH' ? 'amount_mismatch' : 
                     data.status === 'STATUS_MISMATCH' ? 'status_inconsistency' : undefined,
          errorDescription: data.details,
        };

        setTransactions(prev => [newTxn, ...prev].slice(0, 5000)); // Keep last 5000 for live feel
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
    
    // This variable acts as the single source of truth for "Anomalies Count"
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
      {/* Sidebar - Passing live anomalies count */}
      <Sidebar 
        activeView={currentView} 
        onNavigate={setCurrentView} 
        anomaliesCount={summaryStats.activeMismatches}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header onSimulateLive={handleSimulateLive} isLiveSimulating={isLiveSimulating} />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentView === 'dashboard' && (
            <>
              {/* Summary Cards */}
              <SummaryCards {...summaryStats} />

              {/* Heatmap and Quick Stats Row */}
              <div className="grid grid-cols-1 gap-6">
                <div className="w-full">
                  <MismatchChart transactions={transactions} />
                </div>
              </div>

              {/* Transaction Table */}
              <TransactionTable 
                transactions={transactions}
                filter={statusFilter}
              />
            </>
          )}

          {currentView === 'anomalies' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Anomalies Detected</h2>
                  <p className="text-muted-foreground">List of all transactions flagged for review.</p>
                </div>
              </div>
              <TransactionTable 
                transactions={transactions}
                filter="mismatch"
              />
            </div>
          )}
          
          {currentView !== 'dashboard' && currentView !== 'anomalies' && (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
               <p>Page not implemented: {currentView}</p>
             </div>
          )}
        </main>
      </div>


    </div>
  );
};

export default Index;
