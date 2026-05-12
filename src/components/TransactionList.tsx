import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction, ThemeColors } from '../types';
import { TransactionItem } from './TransactionItem';
import { MONTHS } from '../constants';

interface TransactionListProps {
  summary: any;
  theme: ThemeColors;
  selectedItems: string[];
  onToggleSelection: (id: string) => void;
  onDeselectAll?: () => void;
  currentMonth: number;
  currentYear: number;
  realMonth: number;
  realYear: number;
  todayFormatted: string;
  activeTab: 'EXPENSE' | 'INCOME';
}

export const TransactionList: React.FC<TransactionListProps> = ({
  summary,
  theme,
  selectedItems,
  onToggleSelection,
  onDeselectAll,
  currentMonth,
  currentYear,
  realMonth,
  realYear,
  todayFormatted,
  activeTab
}) => {
  const activeTheme = theme.card === '#ffffff' ? 'day' : 'night';

  return (
    <ScrollView style={styles.listArea} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity activeOpacity={1} onPress={onDeselectAll} style={{ flex: 1 }}>
        {summary.atrasados.length === 0 && (currentMonth === realMonth && currentYear === realYear) && (
        <View style={[styles.groupBanner, { backgroundColor: activeTheme === 'day' ? '#f0fdf4' : '#064e3b', borderLeftColor: '#22c55e', marginBottom: 15 }]}>
           <Text style={[styles.groupBannerTitle, { color: activeTheme === 'day' ? '#166534' : '#4ade80' }]}>OK ({todayFormatted})</Text>
           <Text style={{ color: activeTheme === 'day' ? '#166534' : '#4ade80', fontWeight: 'bold' }}>✓</Text>
        </View>
      )}
      
      {summary.atrasados.length === 0 && (currentYear < realYear || (currentYear === realYear && currentMonth < realMonth)) && (
        <View style={[styles.groupBanner, { backgroundColor: activeTheme === 'day' ? '#f0fdf4' : '#064e3b', marginBottom: 15 }]}>
           <Text style={[styles.groupBannerTitle, { color: activeTheme === 'day' ? '#166534' : '#4ade80' }]}>
             {activeTab === 'INCOME' ? `TUDO RECEBIDO EM ${MONTHS[currentMonth].toUpperCase()}` : `TUDO PAGO EM ${MONTHS[currentMonth].toUpperCase()}`}
           </Text>
           <Text style={{ color: activeTheme === 'day' ? '#166534' : '#4ade80', fontWeight: 'bold' }}>✓</Text>
        </View>
      )}

      {summary.atrasados.length > 0 && (
        <View>
          <View style={[styles.groupBanner, { backgroundColor: activeTheme === 'day' ? '#fef2f2' : '#450a0a' }]}>
             <Text style={[styles.groupBannerTitle, { color: activeTheme === 'day' ? '#b91c1c' : '#f87171' }]}>ATRASADOS ({summary.atrasados.length})</Text>
             <Text style={[styles.groupBannerValue, { color: activeTheme === 'day' ? '#b91c1c' : '#f87171' }]}>R$ {Math.abs(summary.atrasadosTotal).toFixed(2)}</Text>
          </View>
          {summary.atrasados.map((item: Transaction) => (
            <TransactionItem 
              key={item.id} 
              item={item} 
              theme={theme} 
              isSelected={selectedItems.includes(item.id)} 
              onToggleSelection={onToggleSelection}
              currentMonth={currentMonth}
              currentYear={currentYear}
            />
          ))}
        </View>
      )}

      {summary.pendentesHoje.length > 0 && (
        <View>
          <View style={[styles.groupBanner, { backgroundColor: activeTheme === 'day' ? '#fff7ed' : '#431407' }]}>
             <Text style={[styles.groupBannerTitle, { color: activeTheme === 'day' ? '#c2410c' : '#fb923c' }]}>
               Hoje({summary.countHoje}) {activeTab === 'INCOME' ? 'Entradas' : 'Saídas'}({summary.countHoje})={activeTab === 'INCOME' ? 'Receber hoje' : 'Acertar Lançamentos'}({summary.countHoje})
             </Text>
             <Text style={[styles.groupBannerValue, { color: activeTheme === 'day' ? '#c2410c' : '#fb923c' }]}>R$ {Math.abs(summary.pendentesHojeTotal).toFixed(2)}</Text>
          </View>
          {summary.pendentesHoje.map((item: Transaction) => (
            <TransactionItem 
              key={item.id} 
              item={item} 
              theme={theme} 
              isSelected={selectedItems.includes(item.id)} 
              onToggleSelection={onToggleSelection}
              currentMonth={currentMonth}
              currentYear={currentYear}
            />
          ))}
        </View>
      )}

      {summary.pendentesRestoMes.length > 0 && (
        <View>
          <View style={[styles.groupBanner, { backgroundColor: activeTheme === 'day' ? '#fff7ed' : '#431407', opacity: 0.9 }]}>
             <Text style={[styles.groupBannerTitle, { color: activeTheme === 'day' ? '#c2410c' : '#fb923c' }]}>
               {currentMonth === realMonth && currentYear === realYear 
                 ? `PEND. MÊS` 
                 : `PENDENTES EM ${MONTHS[currentMonth].toUpperCase()}`
               } ({summary.pendentesRestoMes.length})
             </Text>
             <Text style={[styles.groupBannerValue, { color: activeTheme === 'day' ? '#c2410c' : '#fb923c' }]}>R$ {Math.abs(summary.pendentesRestoMesTotal).toFixed(2)}</Text>
          </View>
          {summary.pendentesRestoMes.map((item: Transaction) => (
            <TransactionItem 
              key={item.id} 
              item={item} 
              theme={theme} 
              isSelected={selectedItems.includes(item.id)} 
              onToggleSelection={onToggleSelection}
              currentMonth={currentMonth}
              currentYear={currentYear}
            />
          ))}
        </View>
      )}

      {summary.pagos.length > 0 && (
        <View>
          <View style={[styles.groupBanner, { backgroundColor: activeTheme === 'day' ? '#f0fdf4' : '#064e3b' }]}>
             <Text style={[styles.groupBannerTitle, { color: activeTheme === 'day' ? '#166534' : '#4ade80' }]}>
               {activeTab === 'INCOME' 
                  ? (currentMonth === realMonth && currentYear === realYear ? `RECEBIDOS ATÉ (${todayFormatted})` : `RECEBIDOS EM ${MONTHS[currentMonth].toUpperCase()}`)
                  : (currentMonth === realMonth && currentYear === realYear ? `PAGOS ATÉ (${todayFormatted})` : `PAGOS EM ${MONTHS[currentMonth].toUpperCase()}`)
               } ({summary.pagos.length})
             </Text>
             <Text style={[styles.groupBannerValue, { color: activeTheme === 'day' ? '#166534' : '#4ade80' }]}>R$ {Math.abs(summary.pagosTotal).toFixed(2)}</Text>
          </View>
          {summary.pagos.map((item: Transaction) => (
            <TransactionItem 
              key={item.id} 
              item={item} 
              theme={theme} 
              isSelected={selectedItems.includes(item.id)} 
              onToggleSelection={onToggleSelection}
              currentMonth={currentMonth}
              currentYear={currentYear}
            />
          ))}
        </View>
      )}

      {/* Meses Futuros */}
      {(() => {
         const monthsMap: { [key: string]: { month: number, year: number, items: Transaction[] } } = {};
         [...summary.futurosPendentes, ...summary.futurosPagos].forEach(t => {
             const key = `${t.year}-${String(t.month).padStart(2, '0')}`;
             if (!monthsMap[key]) monthsMap[key] = { month: t.month, year: t.year, items: [] };
             monthsMap[key].items.push(t);
         });
         
         const sortedKeys = Object.keys(monthsMap).sort();
         const sortByDateLocal = (a: Transaction, b: Transaction) => (a.day || 0) - (b.day || 0);

         return sortedKeys.map(key => {
             const m = monthsMap[key];
             const mPagos = m.items.filter(i => i.status === 'PAGO');
             const mPend = m.items.filter(i => i.status === 'PENDENTE');
             
             return (
               <View key={key} style={{ marginTop: 15 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 5, color: theme.primary }]}>
                    {MONTHS[m.month].toUpperCase()} / {m.year}
                  </Text>
                  
                  {mPend.length > 0 && (
                    <View style={{ marginBottom: 5 }}>
                      <View style={[styles.groupBanner, { backgroundColor: activeTheme === 'day' ? '#fff7ed' : '#431407', borderLeftColor: '#f97316' }]}>
                        <Text style={[styles.groupBannerTitle, { color: activeTheme === 'day' ? '#c2410c' : '#fb923c' }]}>PENDENTES ({mPend.length})</Text>
                        <Text style={[styles.groupBannerValue, { color: activeTheme === 'day' ? '#c2410c' : '#fb923c', fontSize: 11 }]}>
                          R$ {mPend.reduce((sum, i) => sum + (i.type === 'INCOME' ? parseFloat(i.amount) : -parseFloat(i.amount)), 0).toFixed(2)}
                        </Text>
                      </View>
                      {mPend.sort(sortByDateLocal).map(i => (
                        <TransactionItem 
                          key={i.id} 
                          item={i} 
                          theme={theme} 
                          isSelected={selectedItems.includes(i.id)} 
                          onToggleSelection={onToggleSelection}
                          currentMonth={currentMonth}
                          currentYear={currentYear}
                        />
                      ))}
                    </View>
                  )}
                  
                  {mPagos.length > 0 && (
                    <View>
                      <View style={[styles.groupBanner, { backgroundColor: activeTheme === 'day' ? '#f0fdf4' : '#064e3b', borderLeftColor: '#22c55e', opacity: 0.9 }]}>
                        <Text style={[styles.groupBannerTitle, { color: activeTheme === 'day' ? '#166534' : '#4ade80' }]}>
                          {activeTab === 'INCOME' ? 'RECEBIDOS' : 'PAGOS'} ({mPagos.length})
                        </Text>
                        <Text style={[styles.groupBannerValue, { color: activeTheme === 'day' ? '#166534' : '#4ade80', fontSize: 11 }]}>
                          R$ {mPagos.reduce((sum, i) => sum + (i.type === 'INCOME' ? parseFloat(i.amount) : -parseFloat(i.amount)), 0).toFixed(2)}
                        </Text>
                      </View>
                      {mPagos.sort(sortByDateLocal).map(i => (
                        <TransactionItem 
                          key={i.id} 
                          item={i} 
                          theme={theme} 
                          isSelected={selectedItems.includes(i.id)} 
                          onToggleSelection={onToggleSelection}
                          currentMonth={currentMonth}
                          currentYear={currentYear}
                        />
                      ))}
                    </View>
                  )}
               </View>
             );
         });
      })()}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  listArea: {
    flex: 1,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  groupBanner: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    borderLeftWidth: 4,
  },
  groupBannerTitle: {
    fontSize: 10,
    fontWeight: '900',
  },
  groupBannerValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 5,
  }
});
