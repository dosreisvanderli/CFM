import { useMemo } from 'react';
import { Transaction } from './types';

export function useSummary(
  transactions: Transaction[],
  currentMonth: number,
  currentYear: number,
  searchQuery: string,
  activeTab: 'EXPENSE' | 'INCOME',
  realDay: number,
  realMonth: number,
  realYear: number
) {
  return useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    const atrasados: any[] = [];
    const pendentesHoje: any[] = [];
    const pendentesRestoMes: any[] = [];
    const pagos: any[] = [];
    const futurosPagos: any[] = [];
    const futurosPendentes: any[] = [];

    let atrasadosTotal = 0;
    let pendentesHojeTotal = 0;
    let pendentesRestoMesTotal = 0;
    let pagosTotal = 0;
    let futurosPagosTotal = 0;
    let futurosPendentesTotal = 0;

    let income = 0;
    let expense = 0;
    const catDist: Record<string, number> = {};

    transactions.forEach(t => {
      // Cálculo global para o resumo da barra inferior e gráficos (sempre processa o mês atual)
      if (t.year === currentYear && t.month === currentMonth && t.status === 'PAGO') {
          const val = parseFloat(t.amount);
          if (t.type === 'INCOME') income += val;
          else expense += val;
      }

      if (searchQuery && !t.description.toLowerCase().includes(searchLower) && !(t.category && t.category.toLowerCase().includes(searchLower))) {
         return;
      }

      // FILTRO POR ABA ATIVA
      if (t.type !== activeTab) return;

      const v = parseFloat(t.amount);
      const isIncome = t.type === 'INCOME';
      
      const tTime = (t.year || 0) * 10000 + ((t.month || 0) + 1) * 100 + (t.day || 0);
      const nowTime = realYear * 10000 + (realMonth + 1) * 100 + realDay;
      
      const isPastDate = tTime < nowTime;
      const isViewingMonth = t.year === currentYear && t.month === currentMonth;
      const isFutureMonthRelative = t.year > currentYear || (t.year === currentYear && t.month > currentMonth);
      const isPastMonthRelative = t.year < currentYear || (t.year === currentYear && t.month < currentMonth);

      // 1. MÊS VISUALIZADO:
      if (isViewingMonth) {
          if (t.status === 'PAGO') {
              pagos.push(t);
              pagosTotal += isIncome ? v : -v;
              if (!isIncome) {
                  catDist[t.category] = (catDist[t.category] || 0) + v;
              }
          } else {
              // PENDENTE
              if (isPastDate) {
                  atrasados.push(t);
                  atrasadosTotal += isIncome ? v : -v;
              } else if (tTime === nowTime) {
                  pendentesHoje.push(t);
                  pendentesHojeTotal += isIncome ? v : -v;
              } else {
                  pendentesRestoMes.push(t);
                  pendentesRestoMesTotal += isIncome ? v : -v;
              }
          }
          return;
      }

      // 2. MESES ANTERIORES AO VISUALIZADO (se pendente, é atrasado):
      if (isPastMonthRelative) {
          if (t.status === 'PENDENTE') {
              atrasados.push(t);
              atrasadosTotal += isIncome ? v : -v;
          }
          return;
      }

      // 3. MESES FUTUROS AO VISUALIZADO:
      if (isFutureMonthRelative) {
          if (t.status === 'PAGO') {
              futurosPagos.push(t);
              futurosPagosTotal += isIncome ? v : -v;
          } else {
              futurosPendentes.push(t);
              futurosPendentesTotal += isIncome ? v : -v;
          }
          return;
      }
    });

    const sortByDate = (a: any, b: any) => {
        if (a.year !== b.year) return a.year - b.year;
        if (a.month !== b.month) return a.month - b.month;
        return (a.day || 0) - (b.day || 0);
    };
    
    atrasados.sort(sortByDate);
    pendentesHoje.sort(sortByDate);
    pendentesRestoMes.sort(sortByDate);
    pagos.sort(sortByDate);
    futurosPagos.sort(sortByDate);
    futurosPendentes.sort(sortByDate);
    
    return { 
      atrasados, pendentesHoje, pendentesRestoMes, pagos, futurosPagos, futurosPendentes, 
      atrasadosTotal, pendentesHojeTotal, pendentesRestoMesTotal, pagosTotal, futurosPagosTotal, futurosPendentesTotal, 
      income, expense, catDist,
      countHoje: pendentesHoje.length
    };
  }, [transactions, currentMonth, currentYear, searchQuery, activeTab, realDay, realMonth, realYear]);
}
