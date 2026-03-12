'use client';

import React, { useState } from 'react';
import { Expense } from '@/types/expense';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Trash2, Mail, X } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  filterType?: 'all' | 'income' | 'expense';
  onDelete?: (id: string) => void;
}

export function ExpenseList({ expenses, filterType = 'all', onDelete }: ExpenseListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const filteredExpenses = expenses.filter(exp => {
    if (filterType === 'all') return true;
    return exp.type === filterType;
  });

  // Sort by date (most recent first)
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  if (sortedExpenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No expenses found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b bg-gray-200">
          <tr>
            <th className="px-4 py-2 text-left font-bold text-gray-900">Date</th>
            <th className="px-4 py-2 text-left font-bold text-gray-900">Description</th>
            <th className="px-4 py-2 text-right font-bold text-gray-900">Amount</th>
            <th className="px-4 py-2 text-left font-bold text-gray-900">Type</th>
            <th className="px-4 py-2 text-left font-bold text-gray-900">Category</th>
            <th className="px-4 py-2 text-center font-bold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedExpenses.map(expense => (
            <React.Fragment key={expense.id}>
              <tr className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900 font-medium">{formatDate(expense.date)}</td>
                <td className="px-4 py-3 text-gray-700">{expense.description}</td>
                <td className={`px-4 py-3 text-right font-semibold ${
                  expense.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    expense.type === 'income'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {expense.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{expense.category || 'N/A'}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setExpandedId(expandedId === expense.id ? null : expense.id)}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      title="Show Message"
                    >
                      <Mail size={16} />
                      <span className="text-xs">Message</span>
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(expense.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              
              {/* Expanded message row */}
              {expandedId === expense.id && (
                <tr className="bg-blue-50 border-b">
                  <td colSpan={6} className="px-4 py-4">
                    <div className="bg-white rounded-lg border border-blue-200 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900">Email Message</h3>
                        <button
                          onClick={() => setExpandedId(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded border border-gray-200 max-h-64 overflow-y-auto">
                        {expense.rawEmail || 'No email message available'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
