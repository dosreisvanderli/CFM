import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../types';

interface DashboardProps {
  summary: any;
  theme: ThemeColors;
  activeTab: 'EXPENSE' | 'INCOME';
  currentMonth: number;
  currentYear: number;
  realDay: number;
  realMonth: number;
  realYear: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  theme,
  activeTab,
  currentMonth,
  currentYear,
  realDay,
  realMonth,
  realYear
}) => {
  return (
    <View style={[styles.dashboard, { backgroundColor: theme.card }]}>
      <View style={[styles.balanceCard, { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 5, paddingVertical: 5 }]}>
        <View style={{alignItems: 'center', flex: 1}}>
          <Text style={{ color: theme.miniText, fontSize: 8, fontWeight: 'bold' }}>
            {activeTab === 'INCOME' 
              ? (currentMonth === realMonth && currentYear === realYear ? `RECEBIDOS ATÉ ${String(realDay).padStart(2, '0')}/${String(realMonth + 1).padStart(2, '0')}` : 'RECEBIDOS')
              : (currentMonth === realMonth && currentYear === realYear ? `PAGOS ATÉ ${String(realDay).padStart(2, '0')}/${String(realMonth + 1).padStart(2, '0')}` : 'PAGOS MÊS')
            }
          </Text>
          <Text style={{ color: activeTab === 'INCOME' ? theme.income : theme.expense, fontSize: 13, marginTop: 2, fontWeight: 'bold' }} numberOfLines={1}>
            R$ {Math.abs(summary.pagosTotal).toFixed(2)}
          </Text>
        </View>
        <View style={{alignItems: 'center', flex: 1}}>
          <Text style={{ color: theme.miniText, fontSize: 8, fontWeight: 'bold' }}>
            {activeTab === 'INCOME' ? `Receber hoje(${summary.countHoje})` : `Acertar Lanc.(${summary.countHoje})`}
          </Text>
          <Text style={{ color: activeTab === 'INCOME' ? theme.income : theme.expense, fontSize: 13, marginTop: 2, fontWeight: 'bold' }} numberOfLines={1}>
            R$ {Math.abs(summary.pendentesHojeTotal).toFixed(2)}
          </Text>
        </View>
        <View style={{alignItems: 'center', flex: 1}}>
          <Text style={{ color: theme.miniText, fontSize: 8, fontWeight: 'bold' }}>{activeTab === 'INCOME' ? 'FUTUROS' : 'RESTO MÊS'}</Text>
          <Text style={{ color: activeTab === 'INCOME' ? theme.income : theme.expense, fontSize: 13, marginTop: 2, fontWeight: 'bold' }} numberOfLines={1}>
            R$ {activeTab === 'INCOME'
              ? Math.abs(summary.futurosPagosTotal + summary.futurosPendentesTotal).toFixed(2)
              : Math.abs(summary.pendentesRestoMesTotal + summary.futurosPagosTotal + summary.futurosPendentesTotal).toFixed(2)
            }
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <Text style={{ color: theme.income, fontSize: 10, fontWeight: 'bold' }}>▲ Entradas: R$ {summary.income.toFixed(2)}</Text>
        <Text style={{ color: theme.expense, fontSize: 10, fontWeight: 'bold' }}>▼ Saídas: R$ {summary.expense.toFixed(2)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dashboard: {
    padding: 10,
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 15,
    elevation: 3,
  },
  balanceCard: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  }
});
