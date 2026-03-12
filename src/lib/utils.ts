import { Expense, SpendingSummary, MonthlyProject } from '@/types/expense';
import { 
  startOfMonth, 
  endOfMonth, 
  subDays, 
  startOfYear,
  format,
  parseISO,
  isWithinInterval,
  differenceInDays
} from 'date-fns';

// Parse FamApp emails to extract transaction info
// Email pattern: "You received ₹65.0 in your FamX account" or "Your payment of ₹50.0 is successful"
export function parseFamAppEmail(emailBody: string, emailSubject: string): Expense | null {
  try {
    // Look for rupee amount pattern in both subject and body
    const combinedText = `${emailSubject} ${emailBody}`;
    const amountMatch = combinedText.match(/₹([\d,]+\.?\d*)|Rs\.\s*([\d,]+\.?\d*)|\$([\d,]+\.?\d*)/);
    
    const amountStr = amountMatch ? (amountMatch[1] || amountMatch[2] || amountMatch[3]) : null;
    const amount = amountStr ? parseFloat(amountStr.replace(/,/g, '')) : null;

    if (!amount) return null;

    // Determine if it's income or expense based on keywords
    const lowerText = combinedText.toLowerCase();
    
    // Simple logic: if "paid" is in the text, it's expense. Otherwise income.
    const isExpense = lowerText.includes('paid');
    const isIncome = !isExpense;

    // Extract description from email
    let description = 'FamApp Transaction';
    let recipientName = '';
    
    if (isExpense) {
      // For expenses, extract "paid to X" - pattern: "paid ₹50.0 to bigbasket at 02:31 PM"
      const paidMatch = emailBody.match(/to\s+(.+?)\s+at\s+/i);
      if (paidMatch) {
        recipientName = paidMatch[1].trim();
        description = `Paid to ${recipientName}`;
      }
    } else if (isIncome) {
      // For income, extract "received from X" - pattern: "received ₹500.0 from JOBY CLAMEEZ PLANKALA at 01:59 PM"
      const receivedMatch = emailBody.match(/from\s+(.+?)\s+at\s+/i);
      if (receivedMatch) {
        recipientName = receivedMatch[1].trim();
        description = `Received from ${recipientName}`;
      }
    }
    
    // If no specific recipient/sender found, fallback to subject
    if (description === 'FamApp Transaction' && emailSubject) {
      description = emailSubject.substring(0, 100);
    }

    // Determine category based on recipient name
    let category = 'Individual';
    if (recipientName.toLowerCase().includes('bigbasket') || 
        recipientName.toLowerCase().includes('innovative retail')) {
      category = 'Food';
    }

    const transactionType = isExpense ? 'expense' : isIncome ? 'income' : 'expense';
    
    console.log('Email parsing debug:', {
      subject: emailSubject.substring(0, 50),
      body: emailBody.substring(0, 50),
      amount,
      isExpense,
      isIncome,
      transactionType,
      description,
      category,
    });

    return {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: '', // Will be set by caller with actual email date
      amount,
      description,
      type: transactionType,
      category,
      rawEmail: emailBody.substring(0, 500)
    };
  } catch (error) {
    console.error('Error parsing email:', error);
    return null;
  }
}

// Calculate spending summary metrics
export function calculateSpendingSummary(expenses: Expense[]): SpendingSummary {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const last30DaysStart = subDays(now, 30);
  const yearStart = startOfYear(now);

  let thisMonth = 0;
  let last30Days = 0;
  let lastYear = 0;

  expenses.forEach(exp => {
    if (exp.type === 'expense') {
      const expDate = parseISO(exp.date);
      
      if (isWithinInterval(expDate, { start: thisMonthStart, end: thisMonthEnd })) {
        thisMonth += exp.amount;
      }
      
      if (isWithinInterval(expDate, { start: last30DaysStart, end: now })) {
        last30Days += exp.amount;
      }
      
      if (isWithinInterval(expDate, { start: yearStart, end: now })) {
        lastYear += exp.amount;
      }
    }
  });

  const dailyAverage = last30Days > 0 ? last30Days / 30 : 0;

  return {
    thisMonth: Math.round(thisMonth * 100) / 100,
    last30Days: Math.round(last30Days * 100) / 100,
    lastYear: Math.round(lastYear * 100) / 100,
    dailyAverage: Math.round(dailyAverage * 100) / 100
  };
}

// Calculate monthly projects
export function calculateMonthlyProjects(expenses: Expense[]): MonthlyProject[] {
  const monthMap = new Map<string, { spent: number; income: number }>();

  expenses.forEach(exp => {
    const date = parseISO(exp.date);
    const monthKey = format(date, 'yyyy-MM');
    
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { spent: 0, income: 0 });
    }

    const month = monthMap.get(monthKey)!;
    if (exp.type === 'expense') {
      month.spent += exp.amount;
    } else {
      month.income += exp.amount;
    }
  });

  return Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      totalSpent: Math.round(data.spent * 100) / 100,
      totalIncome: Math.round(data.income * 100) / 100,
      netChange: Math.round((data.income - data.spent) * 100) / 100
    }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

// Filter expenses by type and date range
export function filterExpenses(
  expenses: Expense[],
  type?: 'income' | 'expense',
  startDate?: string,
  endDate?: string
): Expense[] {
  return expenses.filter(exp => {
    if (type && exp.type !== type) return false;
    
    if (startDate && exp.date < startDate) return false;
    if (endDate && exp.date > endDate) return false;
    
    return true;
  });
}

// Format currency for display
export function formatCurrency(amount: number, currency: string = '₹'): string {
  return `${currency}${amount.toFixed(2)}`;
}

// Format date for display
export function formatDate(date: string): string {
  try {
    return format(parseISO(date), 'MMM dd, yyyy');
  } catch {
    return date;
  }
}
