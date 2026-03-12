// Expense type definition
export interface Expense {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  category?: string;
  messageId?: string;
  rawEmail?: string;
}

export interface SpendingSummary {
  thisMonth: number;
  last30Days: number;
  lastYear: number;
  dailyAverage: number;
}

export interface MonthlyProject {
  month: string;
  totalSpent: number;
  totalIncome: number;
  netChange: number;
}
