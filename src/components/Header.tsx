import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { ThemeColors, User } from '../types';
import { MONTHS_SHORT } from '../constants';

interface HeaderProps {
  user: User | null;
  theme: ThemeColors;
  currentYear: number;
  currentMonth: number;
  isSyncing: boolean;
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
  setCurrentYear: (year: number | ((prev: number) => number)) => void;
  setCurrentMonth: (month: number) => void;
  activeTab: 'EXPENSE' | 'INCOME';
  setActiveTab: (tab: 'EXPENSE' | 'INCOME') => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  theme,
  currentYear,
  currentMonth,
  isSyncing,
  showMenu,
  setShowMenu,
  setCurrentYear,
  setCurrentMonth,
  activeTab,
  setActiveTab,
  onRefresh
}) => {
  return (
    <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      {!user?.isOfflineMode && (user?.isAnonymous || user?.uid?.startsWith('local')) ? (
        <View style={{ backgroundColor: '#f1c40f', padding: 2, alignItems: 'center', marginBottom: 5, borderRadius: 4 }}>
          <Text style={{ color: '#000', fontSize: 9, fontWeight: 'bold' }}>MODO VISITANTE: DADOS NESTE CELULAR APENAS</Text>
        </View>
      ) : user?.isOfflineMode ? (
        <View style={{ backgroundColor: '#7f8c8d', padding: 2, alignItems: 'center', marginBottom: 5, borderRadius: 4 }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>MODO OFFLINE: NÃO SINCRONIZA COM OUTROS APARELHOS</Text>
        </View>
      ) : (
        <View style={{ backgroundColor: '#27ae60', padding: 2, alignItems: 'center', marginBottom: 5, borderRadius: 4 }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>✓ SINCRONIZADO NA NUVEM</Text>
        </View>
      )}
      
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, elevation: 999, paddingVertical: 5}}>
         <View style={{flexDirection: 'row', alignItems: 'center'}}>
           <Image 
             source={{ uri: 'logo_new.png' }} 
             style={{ width: 34, height: 34, marginRight: 10, borderRadius: 8 }} 
             resizeMode="contain"
           />
           <View>
             <Text style={[styles.headerTitle, { color: theme.primary }]}>CFM Mobile</Text>
             {isSyncing && <Text style={{fontSize: 7, color: '#27ae60', fontWeight: 'bold', marginTop: -2}}>SINCRONIZANDO...</Text>}
           </View>
           <TouchableOpacity onPress={onRefresh} style={{marginLeft: 12, padding: 5, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 15}}>
              <Text style={{color: '#f1c40f', fontSize: 10}}>↻</Text>
           </TouchableOpacity>
         </View>
         <View style={{alignItems: 'flex-end', position: 'relative', zIndex: 9999}}>
           <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={{padding: 5, paddingRight: 0}}>
              <Text style={{color: theme.primary, fontSize: 13, fontWeight: 'bold'}}>Opções ▾</Text>
           </TouchableOpacity>
         </View>
      </View>
      
      <View style={[styles.yearSelector, { marginTop: 10, marginBottom: 5 }]}>
        <TouchableOpacity onPress={() => setCurrentYear(prev => prev - 1)}>
          <Text style={[styles.yearArrow, { color: theme.primary }]}>❮</Text>
        </TouchableOpacity>
        <Text style={[styles.yearText, { color: theme.primary }]}>{currentYear}</Text>
        <TouchableOpacity onPress={() => setCurrentYear(prev => prev + 1)}>
          <Text style={[styles.yearArrow, { color: theme.primary }]}>❯</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.monthsContainer}>
        {MONTHS_SHORT.map((mName, idx) => (
          <TouchableOpacity 
            key={idx} 
            onPress={() => setCurrentMonth(idx)}
            style={[styles.monthPill, { backgroundColor: theme.pill }, currentMonth === idx && { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.monthPillText, { color: theme.subText }, currentMonth === idx && { color: theme.background }]} numberOfLines={1}>
              {mName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{flexDirection: 'row', paddingHorizontal: 4, paddingBottom: 5}}>
          <TouchableOpacity 
          style={{flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: activeTab === 'EXPENSE' ? theme.pill : 'transparent', borderBottomWidth: 3, borderBottomColor: activeTab === 'EXPENSE' ? theme.expense : 'transparent'}}
          onPress={() => setActiveTab('EXPENSE')}
        >
          <Text style={{color: activeTab === 'EXPENSE' ? theme.expense : theme.subText, fontSize: 13, fontWeight: 'bold'}}>SAÍDAS ▾</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: activeTab === 'INCOME' ? theme.pill : 'transparent', borderBottomWidth: 3, borderBottomColor: activeTab === 'INCOME' ? theme.income : 'transparent'}}
          onPress={() => setActiveTab('INCOME')}
        >
          <Text style={{color: activeTab === 'INCOME' ? theme.income : theme.subText, fontSize: 13, fontWeight: 'bold'}}>ENTRADAS ▲</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearArrow: {
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: 'bold',
  },
  yearText: {
    fontSize: 20,
    fontWeight: '900',
  },
  monthsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  monthPill: {
    width: '15.5%',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  monthPillText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
});
