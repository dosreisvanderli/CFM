import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeColors, User } from '../types';

interface MenuProps {
  theme: ThemeColors;
  user: User | null;
  onInstall: () => void;
  onRefresh: () => void;
  onCleanDuplicates: () => void;
  onAppearance: () => void;
  onNotifications: () => void;
  onSaveCloud: () => void;
  onImport: () => void;
  onExport: () => void;
  onLogout: () => void;
  onClose: () => void;
  onDonate: () => void;
  hasOfflineData: boolean;
}

export const Menu: React.FC<MenuProps> = ({
  theme,
  user,
  onInstall,
  onRefresh,
  onCleanDuplicates,
  onAppearance,
  onNotifications,
  onSaveCloud,
  onImport,
  onExport,
  onLogout,
  onClose,
  onDonate,
  hasOfflineData
}) => {
  return (
    <>
      <TouchableOpacity 
        activeOpacity={1} 
        style={styles.backdrop} 
        onPress={onClose} 
      />
      <View style={[styles.menuContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity onPress={onInstall} style={[styles.menuItem, { borderBottomColor: theme.border }]}>
          <Text style={[styles.menuText, { color: theme.primary, fontWeight: 'bold' }]}>Instalar App</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRefresh} style={[styles.menuItem, { borderBottomColor: theme.border }]}>
          <Text style={[styles.menuText, { color: theme.text }]}>Atualizar App ↻</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCleanDuplicates} style={[styles.menuItem, { borderBottomColor: theme.border }]}>
          <Text style={[styles.menuText, { color: '#e67e22' }]}>Limpar Duplicados ⚠</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onAppearance} style={[styles.menuItem, { borderBottomColor: theme.border }]}>
          <Text style={[styles.menuText, { color: theme.text }]}>Aparência</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNotifications} style={[styles.menuItem, { borderBottomColor: theme.border }]}>
          <Text style={[styles.menuText, { color: theme.text }]}>Notificações 🔔</Text>
        </TouchableOpacity>
        {(user?.isAnonymous || user?.uid?.startsWith('local') || user?.isOfflineMode || hasOfflineData) && (
          <TouchableOpacity onPress={onSaveCloud} style={[styles.menuItem, { borderBottomColor: theme.border, backgroundColor: 'rgba(66, 133, 244, 0.1)' }]}>
            <Text style={[styles.menuText, { color: '#4285F4', fontWeight: 'bold' }]}>Salvar dados na Nuvem ☁</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onImport} style={[styles.menuItem, { borderBottomColor: theme.border }]}>
          <Text style={[styles.menuText, { color: theme.text }]}>Importar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onExport} style={[styles.menuItem, { borderBottomColor: theme.border }]}>
          <Text style={[styles.menuText, { color: theme.text }]}>Exportar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDonate} style={[styles.menuItem, { borderBottomColor: theme.border }]}>
  <Text style={[styles.menuText, { color: '#27ae60', fontWeight: 'bold' }]}>Apoiar o Projeto ☕</Text>
</TouchableOpacity>
        <TouchableOpacity onPress={onLogout} style={styles.menuItem}>
          <Text style={[styles.menuText, { color: '#e74c3c', fontWeight: 'bold' }]}>Sair</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99998,
  },
  menuContainer: {
    position: 'absolute',
    top: 45,
    right: 15,
    padding: 5,
    borderRadius: 8,
    elevation: 50,
    zIndex: 99999,
    boxShadow: '0px 2px 3.84px rgba(0,0,0,0.25)',
    minWidth: 160,
    borderWidth: 1,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  menuText: {
    fontSize: 13,
  },
});
