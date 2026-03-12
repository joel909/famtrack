import { Expense } from '@/types/expense';

const STORAGE_KEY = 'famtrack_expenses';
const AUTH_TOKEN_KEY = 'famtrack_auth_token';
const REFRESH_TOKEN_KEY = 'famtrack_refresh_token';

// Get expenses from localStorage
export function getExpenses(): Expense[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading expenses from storage:', error);
    return [];
  }
}

// Save expenses to localStorage
export function saveExpenses(expenses: Expense[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Error saving expenses to storage:', error);
  }
}

// Add a new expense
export function addExpense(expense: Expense): void {
  const expenses = getExpenses();
  expenses.push(expense);
  saveExpenses(expenses);
}

// Delete an expense
export function deleteExpense(id: string): void {
  const expenses = getExpenses().filter(exp => exp.id !== id);
  saveExpenses(expenses);
}

// Update an expense
export function updateExpense(id: string, updates: Partial<Expense>): void {
  const expenses = getExpenses();
  const index = expenses.findIndex(exp => exp.id === id);
  if (index !== -1) {
    expenses[index] = { ...expenses[index], ...updates };
    saveExpenses(expenses);
  }
}

// Auth token management
export function saveAuthTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error('Error saving auth tokens:', error);
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error reading auth token:', error);
    return null;
  }
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error reading refresh token:', error);
    return null;
  }
}

export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
  }
}

// Last sync time tracking
const LAST_SYNC_TIME_KEY = 'famtrack_last_sync_time';

export function getLastSyncTime(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(LAST_SYNC_TIME_KEY);
  } catch (error) {
    console.error('Error reading last sync time:', error);
    return null;
  }
}

export function saveLastSyncTime(syncTime: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(LAST_SYNC_TIME_KEY, syncTime);
  } catch (error) {
    console.error('Error saving last sync time:', error);
  }
}
