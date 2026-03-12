'use client';

import React, { useState } from 'react';
import { Filter } from 'lucide-react';

interface FilterComponentProps {
  onFilterChange: (filterType: 'all' | 'income' | 'expense') => void;
}

export function FilterComponent({ onFilterChange }: FilterComponentProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all');

  const handleFilterClick = (filter: 'all' | 'income' | 'expense') => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex items-center gap-2 text-gray-700">
        <Filter size={20} />
        <span className="font-semibold">Filter:</span>
      </div>
      <div className="flex gap-2">
        {(['all', 'income', 'expense'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => handleFilterClick(filter)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === filter
                ? filter === 'income'
                  ? 'bg-green-500 text-white'
                  : filter === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
