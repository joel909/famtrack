'use client';

import { useEffect, useState } from 'react';
import { Expense } from '@/types/expense';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getExpenses, saveExpenses, saveAuthTokens, getAuthToken, clearAuthTokens, getLastSyncTime, saveLastSyncTime } from '@/lib/storage';
import { LogOut, Loader, Trash2 } from 'lucide-react';

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load expenses from storage on mount
  useEffect(() => {
    const saved = getExpenses();
    setExpenses(saved);

    // Check for auth callback redirect from Google
    const urlParams = new URLSearchParams(window.location.search);
    const authenticated = urlParams.get('authenticated');
    
    if (authenticated === 'true') {
      const accessToken = getCookieValue('accessToken');
      const refreshToken = getCookieValue('refreshToken');
      
      if (accessToken && refreshToken) {
        saveAuthTokens(accessToken, refreshToken);
        setIsAuthenticated(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else {
      const token = getAuthToken();
      setIsAuthenticated(!!token);
    }
  }, []);

  const getCookieValue = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const token = parts.pop()?.split(';').shift() || null;
      // Decode URL-encoded tokens
      return token ? decodeURIComponent(token) : null;
    }
    return null;
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/token', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to start login process');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    const token = getAuthToken();
    if (!token) {
      alert('Please log in first');
      return;
    }

    try {
      setIsLoading(true);
      const refreshToken = getCookieValue('refreshToken');
      const lastSyncTime = getLastSyncTime();
      
      const response = await fetch('/api/gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Last-Sync-Time': lastSyncTime || '',
        },
        body: JSON.stringify({ accessToken: token, refreshToken }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Check if it's an auth error that requires re-login
        if (data.needsReauth && response.status === 401) {
          clearAuthTokens();
          setIsAuthenticated(false);
          alert('Your session has expired. Please log in again.');
          return;
        }
        const errorMsg = data.details ? `${data.error}\n\nDetails: ${data.details}` : data.error;
        alert(`Error: ${errorMsg}`);
        return;
      }

      // Update tokens if refreshed ones are provided
      if (data.tokens) {
        saveAuthTokens(data.tokens.accessToken, data.tokens.refreshToken);
      }

      if (data.success && data.expenses) {
        const existingIds = new Set(expenses.map(e => e.messageId));
        const newExpenses = data.expenses.filter(
          (e: Expense) => !existingIds.has(e.messageId)
        );

        const updated = [...expenses, ...newExpenses];
        setExpenses(updated);
        saveExpenses(updated);
        saveLastSyncTime(new Date().toISOString());
        alert(`Synced ${newExpenses.length} new expenses!`);
      } else {
        alert('No expenses found or sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync expenses: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthTokens();
    saveExpenses([]); // Clear all expenses from localStorage
    saveLastSyncTime(''); // Clear last sync time for fresh full sync on next login
    setIsAuthenticated(false);
    setExpenses([]);
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(exp => exp.id !== id);
    setExpenses(updated);
    saveExpenses(updated);
  };

  // Get current month's expenses
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const thisMonthExpenses = expenses.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate this month's spending
  const thisMonthSpending = thisMonthExpenses
    .filter(exp => exp.type === 'expense')
    .reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate projected spending for the month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDayOfMonth = now.getDate();
  const averageDailySpending = currentDayOfMonth > 0 ? thisMonthSpending / currentDayOfMonth : 0;
  const projectedMonthSpending = Math.round(averageDailySpending * daysInMonth * 100) / 100;

  // Calculate current balance (total income - total expenses)
  const totalIncome = expenses
    .filter(exp => exp.type === 'income')
    .reduce((sum, exp) => sum + exp.amount, 0);
  
  const totalExpenses = expenses
    .filter(exp => exp.type === 'expense')
    .reduce((sum, exp) => sum + exp.amount, 0);
  
  const currentBalance = totalIncome - totalExpenses;

  return (
    <main className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="FamTrack Logo" className="w-8 h-8" />
            <h1 className="text-2xl font-bold text-slate-900">FamTrack</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleSync}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                {isLoading ? 'Loading...' : 'Login with Gmail'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 space-y-6">
        {!isAuthenticated ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Welcome to FamTrack</h2>
            <p className="text-slate-600 mb-6">
              Connect your Gmail account to start tracking your expenses.
            </p>
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader className="inline mr-2" size={20} />
                  Loading...
                </>
              ) : (
                'Login with Gmail'
              )}
            </button>
          </div>
        ) : (
          <>
            {/* This Month's Spending & Projected Spending */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-8">
                <p className="text-slate-500 text-sm font-medium mb-2">This Month's Spending</p>
                <p className="text-5xl font-bold text-slate-900">{formatCurrency(thisMonthSpending)}</p>
                <p className="text-slate-500 text-sm mt-3">{thisMonthExpenses.length} transactions</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-8">
                <p className="text-slate-500 text-sm font-medium mb-2">Projected Spending</p>
                <p className="text-5xl font-bold text-blue-600">{formatCurrency(projectedMonthSpending)}</p>
                <p className="text-slate-500 text-xs mt-3">Based on {currentDayOfMonth} days @ {formatCurrency(averageDailySpending)}/day</p>
              </div>
            </div>

            {/* Transaction History */}
            {thisMonthExpenses.length > 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-xl font-bold text-slate-900">Transaction History</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">Date</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900">Description</th>
                        <th className="px-6 py-3 text-right font-semibold text-slate-900">Amount</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {thisMonthExpenses.map(expense => (
                        <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-600 font-medium">{formatDate(expense.date)}</td>
                          <td className="px-6 py-4 text-slate-900">{expense.description}</td>
                          <td className={`px-6 py-4 text-right font-semibold ${
                            expense.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <p className="text-slate-500">
                  No transactions this month. Click "Refresh" to fetch your latest expenses.
                </p>
              </div>
            )}

            {/* View Analytics Button */}
            {expenses.length > 0 && (
              <div className="flex justify-center">
                <a
                  href="/analytics"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
                >
                  View Financial Insights
                </a>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-slate-600 text-sm">
          <p>© 2025 Joel. All rights reserved.</p>
          <p className="mt-2">Made with ❤️ by Joel</p>
        </div>
      </footer>
    </main>
  );
}
