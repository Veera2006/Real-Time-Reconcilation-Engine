export type TransactionStatus = 'matched' | 'mismatch' | 'pending' | 'missing';

export interface Transaction {
  id: string;
  upiRefId: string;
  orderId: string;
  merchant: string;
  bank: string;
  paymentGateway: string;
  pgAmount: number;
  omsAmount: number;
  cbsAmount: number | null;
  pgStatus: string;
  omsStatus: string;
  cbsStatus: string | null;
  status: TransactionStatus;
  matchConfidence: number;
  timestamp: Date;
  paymentMethod: 'UPI' | 'Card' | 'NetBanking' | 'Wallet';
  errorType?: 'amount_mismatch' | 'missing_entry' | 'status_inconsistency' | null;
  errorDescription?: string;
  autoFixRecommendation?: string;
  gstAmount?: number;
}

const merchants = ['Nykaa'];
const banks = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank', 'Yes Bank', 'Punjab National Bank', 'Bank of Baroda'];
const paymentGateways = ['Razorpay', 'PayU', 'Paytm', 'CCAvenue', 'Cashfree', 'Instamojo'];

function generateUPIRefId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'pay_';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateOrderId(): string {
  return `ORD${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)}`;
}

function randomAmount(): number {
  return Math.floor(Math.random() * 50000) + 100;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPaymentMethod(): 'UPI' | 'Card' | 'NetBanking' | 'Wallet' {
  const methods: ('UPI' | 'Card' | 'NetBanking' | 'Wallet')[] = ['UPI', 'UPI', 'UPI', 'Card', 'Card', 'NetBanking', 'Wallet'];
  return randomElement(methods);
}

function generateMatchedTransaction(index: number): Transaction {
  const amount = randomAmount();
  const gst = Math.round(amount * 0.18);
  return {
    id: `TXN${String(index).padStart(6, '0')}`,
    upiRefId: generateUPIRefId(),
    orderId: generateOrderId(),
    merchant: randomElement(merchants),
    bank: randomElement(banks),
    paymentGateway: randomElement(paymentGateways),
    pgAmount: amount,
    omsAmount: amount,
    cbsAmount: amount,
    pgStatus: 'Success',
    omsStatus: 'Completed',
    cbsStatus: 'Settled',
    status: 'matched',
    matchConfidence: 100,
    timestamp: new Date(Date.now() - Math.random() * 86400000 * 7),
    paymentMethod: randomPaymentMethod(),
    gstAmount: gst,
  };
}

// Specific Error Scenarios
const errorScenarios: Partial<Transaction>[] = [
  // Error 1: Amount Mismatch - GST fee mismatch
  {
    id: 'TXN000005',
    upiRefId: 'pay_AMTMIS001XYZ',
    orderId: 'ORD87654321001',
    merchant: 'Nykaa',
    bank: 'HDFC Bank',
    paymentGateway: 'Razorpay',
    pgAmount: 1200,
    omsAmount: 1200,
    cbsAmount: 1150,
    pgStatus: 'Success',
    omsStatus: 'Completed',
    cbsStatus: 'Settled',
    status: 'mismatch',
    matchConfidence: 72,
    paymentMethod: 'UPI',
    errorType: 'amount_mismatch',
    errorDescription: 'CBS amount ₹1,150 differs from PG amount ₹1,200. Likely 2% PG processing fee + GST deduction.',
    autoFixRecommendation: 'Adjust CBS entry by +₹50 to account for 2% PG Fee (₹24) + 18% GST on fee (₹4.32) ≈ ₹28.32, rounded. Remaining ₹21.68 may be additional bank charges.',
    gstAmount: 216,
  },
  // Error 2: Missing Entry
  {
    id: 'TXN000012',
    upiRefId: 'pay_MISSING002ABC',
    orderId: 'ORD98765432002',
    merchant: 'Nykaa',
    bank: 'HDFC Bank',
    paymentGateway: 'Razorpay',
    pgAmount: 8499,
    omsAmount: 8499,
    cbsAmount: null,
    pgStatus: 'Success',
    omsStatus: 'Completed',
    cbsStatus: null,
    status: 'mismatch',
    matchConfidence: 33,
    paymentMethod: 'Card',
    errorType: 'missing_entry',
    errorDescription: 'Transaction exists in Amazon OMS and Razorpay PG but NOT FOUND in HDFC CBS. Settlement may be delayed or missing.',
    autoFixRecommendation: 'Escalate to HDFC Reconciliation Team. Raise ticket with UPI Ref: pay_MISSING002ABC. Expected settlement within T+1 business days.',
    gstAmount: 1530,
  },
  // Error 3: Status Inconsistency
  {
    id: 'TXN000018',
    upiRefId: 'pay_STATUS003DEF',
    orderId: 'ORD12345678003',
    merchant: 'Nykaa',
    bank: 'ICICI Bank',
    paymentGateway: 'PayU',
    pgAmount: 3299,
    omsAmount: 3299,
    cbsAmount: 3299,
    pgStatus: 'Success',
    omsStatus: 'Completed',
    cbsStatus: 'Pending',
    status: 'mismatch',
    matchConfidence: 65,
    paymentMethod: 'UPI',
    errorType: 'status_inconsistency',
    errorDescription: 'PG reports "Success" but CBS shows "Pending". Possible clearing delay or CBS batch processing lag.',
    autoFixRecommendation: 'Wait for CBS end-of-day batch settlement. If pending after 24hrs, initiate manual settlement verification with ICICI operations.',
    gstAmount: 594,
  },
  // Additional mismatch scenarios
  {
    id: 'TXN000025',
    upiRefId: 'pay_AMTMIS004GHI',
    orderId: 'ORD55667788004',
    merchant: 'Nykaa',
    bank: 'Axis Bank',
    paymentGateway: 'Paytm',
    pgAmount: 567,
    omsAmount: 580,
    cbsAmount: 567,
    pgStatus: 'Success',
    omsStatus: 'Completed',
    cbsStatus: 'Settled',
    status: 'mismatch',
    matchConfidence: 78,
    paymentMethod: 'Wallet',
    errorType: 'amount_mismatch',
    errorDescription: 'OMS shows ₹580 but PG and CBS show ₹567. Possible coupon/discount not reflected in OMS.',
    autoFixRecommendation: 'Apply ₹13 promotional discount adjustment in OMS. Verify coupon code usage for order.',
    gstAmount: 102,
  },
  {
    id: 'TXN000032',
    upiRefId: 'pay_STATUS005JKL',
    orderId: 'ORD11223344005',
    merchant: 'Nykaa',
    bank: 'State Bank of India',
    paymentGateway: 'Cashfree',
    pgAmount: 450,
    omsAmount: 450,
    cbsAmount: 450,
    pgStatus: 'Failed',
    omsStatus: 'Completed',
    cbsStatus: 'Settled',
    status: 'mismatch',
    matchConfidence: 45,
    paymentMethod: 'NetBanking',
    errorType: 'status_inconsistency',
    errorDescription: 'PG reports "Failed" but OMS and CBS show successful completion. Possible webhook failure or duplicate transaction.',
    autoFixRecommendation: 'Verify transaction via PG dashboard. If legitimate, update PG status manually. Check for duplicate refund requests.',
    gstAmount: 81,
  },
];

// Pending transactions
const pendingScenarios: Partial<Transaction>[] = [
  {
    id: 'TXN000040',
    upiRefId: 'pay_PENDING001MNO',
    orderId: 'ORD99887766001',
    merchant: 'Nykaa',
    bank: 'Kotak Mahindra Bank',
    paymentGateway: 'Razorpay',
    pgAmount: 15999,
    omsAmount: 15999,
    cbsAmount: null,
    pgStatus: 'Processing',
    omsStatus: 'Payment Pending',
    cbsStatus: null,
    status: 'pending',
    matchConfidence: 50,
    paymentMethod: 'Card',
    gstAmount: 2880,
  },
  {
    id: 'TXN000041',
    upiRefId: 'pay_PENDING002PQR',
    orderId: 'ORD77665544002',
    merchant: 'Nykaa',
    bank: 'Yes Bank',
    paymentGateway: 'CCAvenue',
    pgAmount: 2199,
    omsAmount: 2199,
    cbsAmount: null,
    pgStatus: 'Initiated',
    omsStatus: 'Awaiting Confirmation',
    cbsStatus: null,
    status: 'pending',
    matchConfidence: 40,
    paymentMethod: 'UPI',
    gstAmount: 396,
  },
];

export function generateMockTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  
  // Generate 43 matched transactions
  for (let i = 1; i <= 43; i++) {
    if (![5, 12, 18, 25, 32, 40, 41].includes(i)) {
      transactions.push(generateMatchedTransaction(i));
    }
  }
  
  // Add error scenarios
  errorScenarios.forEach((error) => {
    transactions.push({
      ...generateMatchedTransaction(0),
      ...error,
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 3),
    } as Transaction);
  });
  
  // Add pending scenarios
  pendingScenarios.forEach((pending) => {
    transactions.push({
      ...generateMatchedTransaction(0),
      ...pending,
      timestamp: new Date(Date.now() - Math.random() * 3600000 * 6),
    } as Transaction);
  });
  
  // Sort by timestamp descending
  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function generateHeatmapData(): { status: TransactionStatus; index: number }[] {
  const data: { status: TransactionStatus; index: number }[] = [];
  const mismatchIndices = [7, 23, 45, 67, 89]; // 5 mismatches
  const pendingIndices = [12, 34, 78]; // 3 pending
  
  for (let i = 0; i < 100; i++) {
    if (mismatchIndices.includes(i)) {
      data.push({ status: 'mismatch', index: i });
    } else if (pendingIndices.includes(i)) {
      data.push({ status: 'pending', index: i });
    } else {
      data.push({ status: 'matched', index: i });
    }
  }
  
  return data;
}
