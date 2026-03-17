'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Expense } from '@/types/expense';
import { Dashboard } from '@/components/Dashboard';
import { ExpenseList } from '@/components/ExpenseList';
import { FilterComponent } from '@/components/Filter';
import { ChartComponent } from '@/components/Chart';
import { calculateMonthlyProjects, formatCurrency } from '@/lib/utils';
import { getExpenses, saveExpenses, getAuthToken, clearAuthTokens, getLastSyncTime, saveLastSyncTime } from '@/lib/storage';
import { LogOut, Loader, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [monthlyProjects, setMonthlyProjects] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<'30d' | '3m' | '6m' | '1y' | 'all' | 'custom'>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isDateRangeExpanded, setIsDateRangeExpanded] = useState(false);

  // Load expenses from storage on mount
  useEffect(() => {
    const saved = getExpenses();
    setExpenses(saved);
    
    if (saved.length > 0) {
      setMonthlyProjects(calculateMonthlyProjects(saved));
    }

    // Check if user is authenticated
    const token = getAuthToken();
    setIsAuthenticated(!!token);
  }, []);

  // Handle month parameter from URL
  useEffect(() => {
    const monthParam = searchParams.get('month');
    if (monthParam) {
      // Set date range to that specific month
      const [year, month] = monthParam.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      setDateRange('custom');
      setCustomStartDate(monthParam + '-01');
      setCustomEndDate(monthParam + '-' + String(endDate.getDate()).padStart(2, '0'));
    }
  }, [searchParams]);

  const getCookieValue = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  const getRangeLabel = () => {
    const formatDateShort = (date: Date) => {
      const month = date.toLocaleString('default', { month: 'short' });
      const day = date.getDate();
      return `${month} ${day}`;
    };

    switch (dateRange) {
      case '30d': {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        return `${formatDateShort(start)} - ${formatDateShort(now)}`;
      }
      case '3m': {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        return `${formatDateShort(start)} - ${formatDateShort(now)}`;
      }
      case '6m': {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        return `${formatDateShort(start)} - ${formatDateShort(now)}`;
      }
      case '1y': {
        const now = new Date();
        const start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return `${formatDateShort(start)} - ${formatDateShort(now)}`;
      }
      case 'all':
        return 'All Time';
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${customStartDate} to ${customEndDate}`;
        }
        return 'Custom Range';
      default:
        return 'Selected Period';
    }
  };

  const getDateRangeFilter = () => {
    const now = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case '30d':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case '3m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'custom':
        if (customStartDate) {
          startDate = new Date(customStartDate);
        }
        break;
      case 'all':
      default:
        startDate = new Date(0);
    }

    let endDate = now;
    if (dateRange === 'custom' && customEndDate) {
      endDate = new Date(customEndDate);
    }

    return { startDate, endDate };
  };

  const filteredExpensesByDate = expenses.filter(exp => {
    const { startDate, endDate } = getDateRangeFilter();
    const expDate = new Date(exp.date);
    return expDate >= startDate && expDate <= endDate;
  });

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
        alert(`Error: ${data.error}`);
        return;
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
        setMonthlyProjects(calculateMonthlyProjects(updated));
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
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(exp => exp.id !== id);
    setExpenses(updated);
    saveExpenses(updated);
    setMonthlyProjects(calculateMonthlyProjects(updated));
  };

  return (
    <main className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={24} />
            </a>
            <img src="/favicon.svg" alt="FamTrack Logo" className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Financial Insights</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
        {isAuthenticated && expenses.length > 0 ? (
          <>
            {/* Date Range Filter */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <button
                onClick={() => setIsDateRangeExpanded(!isDateRangeExpanded)}
                className="w-full flex justify-between items-center mb-4 hover:bg-slate-50 p-2 rounded-lg transition-colors"
              >
                <h3 className="text-sm font-semibold text-slate-900">Date Range</h3>
                {isDateRangeExpanded ? (
                  <ChevronUp size={20} className="text-slate-600" />
                ) : (
                  <ChevronDown size={20} className="text-slate-600" />
                )}
              </button>

              {isDateRangeExpanded && (
                <>
                  <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={() => setDateRange('30d')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    dateRange === '30d'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setDateRange('3m')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    dateRange === '3m'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  Last 3 Months
                </button>
                <button
                  onClick={() => setDateRange('6m')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    dateRange === '6m'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  Last 6 Months
                </button>
                <button
                  onClick={() => setDateRange('1y')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    dateRange === '1y'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  Last Year
                </button>
                <button
                  onClick={() => setDateRange('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    dateRange === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setDateRange('custom')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    dateRange === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Custom Date Range */}
              {dateRange === 'custom' && (
                <div className="flex gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

                  <p className="text-sm text-slate-500 mt-4">
                    Showing {filteredExpensesByDate.length} transactions
                  </p>
                </>
              )}
            </div>

            {/* Dashboard */}
            {filteredExpensesByDate.length > 0 ? (
              <>
                <Dashboard
                  expenses={filteredExpensesByDate}
                  isLoading={isLoading}
                  onSyncClick={handleSync}
                  rangeLabel={getRangeLabel()}
                  dateRange={dateRange}
                />

                {/* Charts */}
                <ChartComponent
                  expenses={filteredExpensesByDate}
                  monthlyProjects={monthlyProjects}
                />

                {/* Filter and Expense List */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900">All Transactions</h2>
                  </div>
                  <div className="p-6">
                    <FilterComponent onFilterChange={setFilterType} />
                    <div className="mt-6">
                      <ExpenseList
                        expenses={filteredExpensesByDate}
                        filterType={filterType}
                        onDelete={handleDeleteExpense}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <p className="text-slate-500">
                  No transactions found for the selected date range.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <p className="text-slate-500">
              {!isAuthenticated ? 'Please log in to view detailed analytics.' : 'No expenses found yet. Refresh to fetch your latest data.'}
            </p>
          </div>
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

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <main className="flex flex-col min-h-screen bg-slate-50">
        <div className="flex-grow flex items-center justify-center">
          <Loader className="animate-spin" size={32} />
        </div>
      </main>
    }>
      <AnalyticsContent />
    </Suspense>
  );
}
