'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Expense, MonthlyProject } from '@/types/expense';
import { calculateMonthlyProjects, formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Minus, ChevronRight } from 'lucide-react';

interface DashboardProps {
  expenses: Expense[];
  isLoading?: boolean;
  onSyncClick?: () => void;
  rangeLabel?: string;
}

export function Dashboard({ expenses, isLoading = false, onSyncClick, rangeLabel = 'Selected Period' }: DashboardProps) {
  const router = useRouter();
  const [monthlyProjects, setMonthlyProjects] = useState<MonthlyProject[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [dailyAverage, setDailyAverage] = useState(0);
  const [netDifference, setNetDifference] = useState(0);

  useEffect(() => {
    if (expenses.length > 0) {
      // Calculate totals for the selected period
      const spent = expenses
        .filter(exp => exp.type === 'expense')
        .reduce((sum, exp) => sum + exp.amount, 0);

      const income = expenses
        .filter(exp => exp.type === 'income')
        .reduce((sum, exp) => sum + exp.amount, 0);

      // Calculate daily average
      if (expenses.length > 0) {
        // Get date range from expenses
        const dates = expenses.map(e => new Date(e.date).getTime());
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const daysDiff = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        setDailyAverage(spent / daysDiff);
      }

      setTotalSpent(spent);
      setTotalIncome(income);
      setNetDifference(income - spent);
      setMonthlyProjects(calculateMonthlyProjects(expenses));
    } else {
      setTotalSpent(0);
      setTotalIncome(0);
      setDailyAverage(0);
      setNetDifference(0);
      setMonthlyProjects([]);
    }
  }, [expenses]);

  return (
    <div className="space-y-8">
      {/* Header with sync button */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-2">{rangeLabel}</p>
        </div>
        <button
          onClick={onSyncClick}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Spending Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {expenses.length > 0 ? (
          <>
            <div className="bg-white border border-slate-200 p-6 rounded-xl hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Total Spent</p>
                  <p className="text-3xl font-bold text-slate-900 mt-3">
                    {formatCurrency(totalSpent)}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <TrendingDown className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-xl hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Total Income</p>
                  <p className="text-3xl font-bold text-slate-900 mt-3">
                    {formatCurrency(totalIncome)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-xl hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Daily Average</p>
                  <p className="text-3xl font-bold text-slate-900 mt-3">
                    {formatCurrency(dailyAverage)}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <DollarSign className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-xl hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Net Difference</p>
                  <p className={`text-3xl font-bold mt-3 ${
                    netDifference >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {netDifference >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netDifference))}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  netDifference >= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <Minus className={`${
                    netDifference >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} size={24} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-4 bg-white border border-slate-200 rounded-xl p-12 text-center">
            <p className="text-slate-500">No spending data available for this period.</p>
          </div>
        )}
      </div>

      {/* Monthly Projects */}
      {monthlyProjects.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Monthly Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900">Month</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900">Total Spent</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900">Total Income</th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900">Net Change</th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {monthlyProjects.map((project, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{project.month}</td>
                    <td className="px-6 py-4 text-right text-red-600 font-semibold">
                      {formatCurrency(project.totalSpent)}
                    </td>
                    <td className="px-6 py-4 text-right text-green-600 font-semibold">
                      {formatCurrency(project.totalIncome)}
                    </td>
                    <td className={`px-6 py-4 text-right font-semibold ${
                      project.netChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(project.netChange)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => router.push(`/analytics?month=${project.month}`)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                      >
                        View Details
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
