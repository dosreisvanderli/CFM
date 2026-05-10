import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ThemeColors } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';

interface TransactionFormProps {
  theme: ThemeColors;
  form: any;
  setForm: (form: any) => void;
  onSave: () => void;
  onCancel: () => void;
  editingId: string | null;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  theme,
  form,
  setForm,
  onSave,
  onCancel,
  editingId
}) => {
  return (
    <View style={styles.overlay}>
      <View style={[styles.modal, { backgroundColor: theme.card }]}>
        <Text style={[styles.modalTitle, { color: theme.text }]}>
          {editingId ? 'Editar' : 'Novo'} ({form.type === 'INCOME' ? 'Entrada' : 'Saída'})
        </Text>
        <TextInput 
          style={[styles.input, { color: theme.text, borderColor: theme.border }]} 
          placeholder="Descrição" 
          placeholderTextColor={theme.miniText} 
          value={form.desc} 
          onChangeText={t => setForm({ ...form, desc: t })} 
        />
        <TextInput 
          style={[styles.input, { color: theme.text, borderColor: theme.border }]} 
          placeholder="Valor R$" 
          placeholderTextColor={theme.miniText} 
          keyboardType="numeric" 
          value={form.val} 
          onChangeText={t => setForm({ ...form, val: t })} 
        />
        
        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.subText, marginBottom: 2 }}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {(form.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
              <TouchableOpacity 
                key={c} 
                onPress={() => setForm({ ...form, cat: c })}
                style={{ 
                  paddingHorizontal: 12, 
                  paddingVertical: 6, 
                  borderRadius: 15, 
                  backgroundColor: form.cat === c ? theme.primary : theme.pill,
                  marginRight: 8
                }}
              >
                <Text style={{ fontSize: 11, color: form.cat === c ? theme.background : theme.text, fontWeight: 'bold' }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
          <View style={{ flex: 1, marginRight: 2 }}>
            <Text style={styles.inputLabel}>Dia</Text>
            <TextInput style={[styles.inputSmall, { color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={form.dueDay} onChangeText={t => setForm({ ...form, dueDay: t })} />
          </View>
          <View style={{ flex: 1, marginHorizontal: 2 }}>
            <Text style={styles.inputLabel}>Mês</Text>
            <TextInput style={[styles.inputSmall, { color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={form.dueMonth} onChangeText={t => setForm({ ...form, dueMonth: t })} />
          </View>
          <View style={{ flex: 1.2, marginHorizontal: 2 }}>
            <Text style={styles.inputLabel}>Ano</Text>
            <TextInput style={[styles.inputSmall, { color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={form.dueYear} onChangeText={t => setForm({ ...form, dueYear: t })} />
          </View>
          <View style={{ flex: 1.4, marginHorizontal: 2 }}>
            <Text style={styles.inputLabel}>Total Parc.</Text>
            <TextInput style={[styles.inputSmall, { color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={form.installments} editable={!editingId} onChangeText={t => setForm({ ...form, installments: t })} />
          </View>
          <View style={{ flex: 1.4, marginLeft: 2 }}>
            <Text style={styles.inputLabel}>Parc. Atual</Text>
            <TextInput style={[styles.inputSmall, { color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={form.currentInstallment} editable={!editingId} onChangeText={t => setForm({ ...form, currentInstallment: t })} />
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
          <TouchableOpacity 
            style={[styles.statusBtn, { backgroundColor: form.status === 'PENDENTE' ? theme.pending : theme.pill, marginRight: 5 }]} 
            onPress={() => setForm({ ...form, status: 'PENDENTE' })}
          >
            <Text style={{ color: form.status === 'PENDENTE' ? '#fff' : theme.subText, fontWeight: 'bold', fontSize: 12 }}>PENDENTE</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statusBtn, { backgroundColor: form.status === 'PAGO' ? theme.income : theme.pill, marginLeft: 5 }]} 
            onPress={() => setForm({ ...form, status: 'PAGO' })}
          >
            <Text style={{ color: form.status === 'PAGO' ? '#fff' : theme.subText, fontWeight: 'bold', fontSize: 12 }}>PAGO</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }]} onPress={onSave}><Text style={styles.btnText}>SALVAR</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#7f8c8d' }]} onPress={onCancel}><Text style={styles.btnText}>CANCELAR</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10000,
    justifyContent: 'flex-end',
  },
  modal: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
  },
  inputSmall: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    textAlign: 'center',
    fontSize: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 2,
  },
  statusBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
