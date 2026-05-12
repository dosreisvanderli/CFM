import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Transaction, ThemeColors } from '../types';

interface TransactionItemProps {
  item: Transaction;
  theme: ThemeColors;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  currentMonth: number;
  currentYear: number;
}

const TransactionItemComp: React.FC<TransactionItemProps> = ({ 
  item, 
  theme, 
  isSelected, 
  onToggleSelection,
  currentMonth,
  currentYear
}) => {
  const isPastPending = item.status === 'PENDENTE' && (item.year < currentYear || (item.year === currentYear && item.month < currentMonth));
  
  return (
    <View style={[styles.itemCard, { backgroundColor: theme.card, flexDirection: 'row', alignItems: 'center', paddingVertical: 0, paddingHorizontal: 2 }]}>
      
      <TouchableOpacity onPress={(e: any) => { e?.stopPropagation?.(); onToggleSelection(item.id); }} style={{ paddingRight: 6, paddingVertical: 0 }}>
        <View style={{
          width: 16, 
          height: 16, 
          borderRadius: 4, 
          borderWidth: 1.5, 
          borderColor: isSelected ? theme.primary : theme.subText, 
          backgroundColor: isSelected ? theme.primary : 'transparent', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          {isSelected && <Text style={{color: 'white', fontWeight: 'bold', fontSize: 10}}>✓</Text>}
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} onPress={(e: any) => { e?.stopPropagation?.(); onToggleSelection(item.id); }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 4 }}>
          <Text style={{ color: theme.subText, fontSize: 11, width: 42 }}>
            {String(item.day || 1).padStart(2, '0')}/{String(item.month + 1).padStart(2, '0')}
          </Text>
          <Text style={{ color: theme.text, fontSize: 13, flex: 1 }} numberOfLines={1}>
            {item.description} {isPastPending && " (Atrasado)"}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', minWidth: 70 }}>
          <Text style={{ fontSize: 13, color: item.type === 'INCOME' ? theme.income : theme.expense }} numberOfLines={1}>
            {item.type === 'INCOME' ? '+' : '-'} {parseFloat(item.amount).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  itemCard: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 2,
  }
});

export const TransactionItem = React.memo(TransactionItemComp);
