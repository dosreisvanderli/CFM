export type TransactionType = 'EXPENSE' | 'INCOME';
export type TransactionStatus = 'PENDENTE' | 'PAGO';

export interface Transaction {
  id: string;
  description: string;
  amount: string;
  category: string;
  type: TransactionType;
  status: TransactionStatus;
  day: number;
  month: number;
  year: number;
  paidAtMonth?: number | null;
  paidAtYear?: number | null;
  groupId?: string | null;
}

export interface User {
  uid: string;
  isOfflineMode?: boolean;
  isAnonymous?: boolean;
}

export interface ThemeColors {
  primary: string;
  income: string;
  expense: string;
  pending: string;
  background: string;
  card: string;
  text: string;
  subText: string;
  miniText: string;
  border: string;
  pill: string;
}
