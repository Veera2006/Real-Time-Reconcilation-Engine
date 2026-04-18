import { useState, useCallback, useMemo, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { MismatchChart } from '@/components/dashboard/MismatchChart';
import { TransactionTable } from '@/components/dashboard/TransactionTable';
import { Transaction, TransactionStatus } from '@/data/mockTransactions';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

const Index = () => {
  // Start with empty transaction list
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | null>(null);
  const [isLiveSimulating, setIsLiveSimulating] = useState(false);

  // Filter States
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [amountFilter, setAmountFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // WebSocket Connection
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/recon';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ Connected to Reconciliation Engine');
      toast.success('Connected to Reconciliation Engine');
      setIsLiveSimulating(true); // Indicate live status
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // console.log('📥 Received:', data); // Commented out to reduce noise

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

  // Derived state for Reconciled View filtering
  const reconciledTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. Must be matched
      if (t.status !== 'matched') return false;

      // 2. Date Range Filter
      if (dateRange?.from) {
        const txnDate = new Date(t.timestamp);
        // Normalize time to 00:00:00 for accurate day comparison
        const checkDate = new Date(txnDate.getFullYear(), txnDate.getMonth(), txnDate.getDate());
        const fromDate = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
        
        if (checkDate < fromDate) return false;
        
        if (dateRange.to) {
          const toDate = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());
          if (checkDate > toDate) return false;
        }
      }

      // 3. Time Range Filter
      if (timeStart || timeEnd) {
         const txnTime = t.timestamp.toLocaleTimeString('en-US', { hour12: false }); // "14:30:00"
         // Simple lexicographical comparison works for HH:mm:ss if format is constant
         // But localTimeString might vary. Let's use HH:MM format manually.
         const h = t.timestamp.getHours().toString().padStart(2, '0');
         const m = t.timestamp.getMinutes().toString().padStart(2, '0');
         const txnHM = `${h}:${m}`;

         if (timeStart && txnHM < timeStart) return false;
         if (timeEnd && txnHM > timeEnd) return false;
      }

      // 4. Amount Filter
      if (amountFilter) {
        const amountStr = t.pgAmount?.toString() || '';
        if (!amountStr.includes(amountFilter)) return false;
      }

      return true;
    });
  }, [transactions, dateRange, timeStart, timeEnd, amountFilter]);

  const handleSimulateLive = useCallback(() => {
    // No-op for now, as rely on real WS
    toast.info('Live connection is managed automatically via WebSocket');
  }, []);

  const clearFilters = () => {
    setDateRange(undefined);
    setTimeStart('');
    setTimeEnd('');
    setAmountFilter('');
  };

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

          {currentView === 'reconciled' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Reconciled Transactions</h2>
                  <p className="text-muted-foreground">Successfully matched entries.</p>
                </div>
                <Button 
                  variant={showFilters ? "secondary" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>

              {/* Filter Bar */}
              {showFilters && (
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border animate-in fade-in slide-in-from-top-2">
                  
                  {/* Date Range Picker */}
                   <div className="grid gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date"
                          variant={"outline"}
                          className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Range */}
                  <div className="flex items-center gap-2">
                    <Input 
                      type="time"
                      placeholder="Start Time" 
                      value={timeStart}
                      onChange={(e) => setTimeStart(e.target.value)}
                      className="w-[130px]"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input 
                      type="time"
                      placeholder="End Time" 
                      value={timeEnd}
                      onChange={(e) => setTimeEnd(e.target.value)}
                      className="w-[130px]"
                    />
                  </div>
                  
                   <Input 
                    placeholder="Filter by Amount" 
                    value={amountFilter}
                    onChange={(e) => setAmountFilter(e.target.value)}
                    className="max-w-[150px]"
                  />

                  {/* Clear Button */}
                  {(dateRange?.from || timeStart || timeEnd || amountFilter) && (
                    <Button variant="ghost" size="icon" onClick={clearFilters}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              <TransactionTable 
                transactions={reconciledTransactions}
                filter={null} // Already filtered logic
              />
            </div>
          )}
          
          {currentView !== 'dashboard' && currentView !== 'anomalies' && currentView !== 'reconciled' && (
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
