'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Expense, MonthlyProject } from '@/types/expense';
import { formatCurrency } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartComponentProps {
  expenses: Expense[];
  monthlyProjects: MonthlyProject[];
}

export function ChartComponent({ expenses, monthlyProjects }: ChartComponentProps) {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    // Prepare data for monthly spending chart
    const monthlyData = monthlyProjects.slice(0, 6).reverse();
    const months = monthlyData.map(p => p.month);
    const spending = monthlyData.map(p => p.totalSpent);
    const income = monthlyData.map(p => p.totalIncome);

    setChartData({
      months,
      spending,
      income,
    });
  }, [expenses, monthlyProjects]);

  if (!chartData) return <div>Loading charts...</div>;

  const monthlySpendingChartData = {
    labels: chartData.months,
    datasets: [
      {
        label: 'Expenses',
        data: chartData.spending,
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Income',
        data: chartData.income,
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const monthlySpendingOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Spending vs Income',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatCurrency(value),
        },
      },
    },
  };

  const categoryData = expenses.reduce((acc, exp) => {
    const cat = exp.category || 'Other';
    const existing = acc.find(c => c.category === cat);
    if (existing) {
      existing.amount += exp.type === 'expense' ? exp.amount : 0;
    } else {
      acc.push({ category: cat, amount: exp.type === 'expense' ? exp.amount : 0 });
    }
    return acc;
  }, [] as { category: string; amount: number }[]);

  const pieChartData = {
    labels: categoryData.map(c => c.category),
    datasets: [
      {
        data: categoryData.map(c => c.amount),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Expenses by Category',
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <Line data={monthlySpendingChartData} options={monthlySpendingOptions} />
    </div>
  );
}
