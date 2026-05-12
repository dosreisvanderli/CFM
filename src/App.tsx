import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Plus, Minus, Search, Trash2, CheckCircle2, Copy, Menu as MenuIcon, X, Settings, Edit2 } from 'lucide-react';

import { useTheme } from './useTheme';
import { useAuth } from './useAuth';
import { useTransactions } from './useTransactions';
import { useSummary } from './useSummary';

import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { Menu } from './components/Menu';
import { DonationModal } from './components/DonationModal';

import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from './constants';
import { Transaction } from './types';
import { generateId, getIsolatedData, setIsolatedData } from './utils';
import { db, setFirestoreDoc, doc, collection, auth, writeBatch } from './firebase';

const INITIAL_FORM = {
  desc: '',
  val: '',
  cat: '',
  type: 'EXPENSE',
  dueDay: '',
  dueMonth: '',
  dueYear: '',
  installments: '1',
  currentInstallment: '1',
  status: 'PENDENTE'
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <View style={styles.err}><Text>Algo deu errado. Atualize o app.</Text></View>;
    return this.props.children;
  }
}

const CFMMobileLite = () => {
  const { theme, themeMode, setThemeMode, dayStartHour, setDayStartHour, dayEndHour, setDayEndHour, activeTheme } = useTheme();
  const { user, authLoading, isLoggingIn, handleLoginGoogle, handleLoginGuest, handleLogout, enterOfflineMode, showDonationPrompt, setShowDonationPrompt } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { 
    transactions, 
    isSyncing, 
    handleSaveTransaction, 
    handleDeleteTransactions, 
    handleBulkUpdateStatus, 
    handleCopyTransactions,
    setTransactions
  } = useTransactions(user, isOnline);

  const realDate = new Date();
  const realDay = realDate.getDate();
  const realMonth = realDate.getMonth();
  const realYear = realDate.getFullYear();

  const summary = useSummary(transactions, currentMonth, currentYear, searchQuery, activeTab, realDay, realMonth, realYear);

  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notifBeforeDays, setNotifBeforeDays] = useState(localStorage.getItem('cfm_notif_days') || '1');
  const [notifOnDay, setNotifOnDay] = useState(localStorage.getItem('cfm_notif_onday') !== 'false'); // Default to true
  const [showNotifPermissionPrompt, setShowNotifPermissionPrompt] = useState(false);

  useEffect(() => {
    localStorage.setItem('cfm_notif_days', notifBeforeDays);
  }, [notifBeforeDays]);

  useEffect(() => {
    localStorage.setItem('cfm_notif_onday', String(notifOnDay));
  }, [notifOnDay]);

  const checkAndSendNotifications = useCallback(() => {
    if (Notification.permission !== 'granted') return;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayKey = today.toISOString().split('T')[0];
    
    // Only notify once per day
    if (localStorage.getItem('cfm_last_notif_date') === todayKey) return;

    const pending = transactions.filter(t => t.status === 'PENDENTE' && t.type === 'EXPENSE');
    let notifyCount = 0;
    let nextBill = '';

    pending.forEach(t => {
      const dueDate = new Date(t.year, t.month, t.day);
      dueDate.setHours(0,0,0,0);
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      
      const shouldNotifyOnDay = notifOnDay && diffDays === 0;
      const shouldNotifyBefore = parseInt(notifBeforeDays) > 0 && diffDays === parseInt(notifBeforeDays);

      if (shouldNotifyOnDay || shouldNotifyBefore) {
        notifyCount++;
        nextBill = t.description;
      }
    });

    if (notifyCount > 0) {
      const title = notifyCount === 1 ? 'Lembrete de Conta' : 'Lembrete de Contas';
      const body = notifyCount === 1 
        ? `Sua conta "${nextBill}" vence logo.` 
        : `Você tem ${notifyCount} contas vencendo hoje ou em breve.`;
      
      try {
        new Notification(title, { body, icon: '/pwa-192.png' });
        localStorage.setItem('cfm_last_notif_date', todayKey);
      } catch (e) {
        console.error("Erro ao enviar notificação", e);
      }
    }
  }, [transactions, notifOnDay, notifBeforeDays]);

  useEffect(() => {
    if (transactions.length > 0 && localStorage.getItem('cfm_notif_enabled') === 'true') {
      checkAndSendNotifications();
    }
  }, [transactions, checkAndSendNotifications]);

  useEffect(() => {
    // Proactively ask for notification permission if not yet decided and hasn't dismissed before
    if (('Notification' in window) && 
        Notification.permission === 'default' && 
        !localStorage.getItem('cfm_notif_dismissed')) {
      setTimeout(() => setShowNotifPermissionPrompt(true), 3000);
    }
  }, []);


  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [selectedToDelete, setSelectedToDelete] = useState<string[]>([]);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyForm, setCopyForm] = useState({ day: realDay.toString(), month: (realMonth + 1).toString(), year: realYear.toString(), showEditor: false });
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert("Seu navegador não suporta notificações.");
      return;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      alert("Notificações ativadas!");
      localStorage.setItem('cfm_notif_enabled', 'true');
    } else {
      alert("Permissão de notificação negada.");
      localStorage.setItem('cfm_notif_enabled', 'false');
    }
  };

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem('cfm_pwa_dismissed')) {
        setShowInstallPrompt(true);
      }
    });
    
    // Check if inside a restricted browser
    const ua = navigator.userAgent;
    const isRestricted = (ua.includes('Instagram') || ua.includes('FBAN') || ua.includes('FBAV') || ua.includes('MicroMessenger'));
    if (isRestricted && !localStorage.getItem('cfm_pwa_dismissed')) {
       setShowInstallPrompt(true);
    }
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
      }
    } else {
       alert("Para instalar:\n1. Clique no menu do navegador (⋮ ou  compartilhar)\n2. 'Adicionar à tela inicial'");
       setShowInstallPrompt(false);
    }
  };

  const onToggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const handleSave = async () => {
    if (!form.desc || !form.val) {
      alert("Preencha Descrição e Valor.");
      return;
    }
    try {
      await handleSaveTransaction(form, editingId, currentMonth, currentYear);
      setShowForm(false);
      setEditingId(null);
      setForm(INITIAL_FORM);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (item: Transaction) => {
    setEditingId(item.id);
    setForm({
      desc: item.description.replace(/\s\(\d+\/\d+\)$/, '').trim(),
      val: item.amount.replace('.', ','),
      cat: item.category,
      type: item.type,
      dueDay: item.day.toString(),
      dueMonth: (item.month + 1).toString(),
      dueYear: item.year.toString(),
      installments: '1',
      currentInstallment: '1',
      status: item.status
    });
    setShowForm(true);
  };

  const handleDeleteRelated = (item: Transaction) => {
     setDeletingItem(item);
     setSelectedToDelete([item.id]);
  };

  const confirmDelete = async () => {
    if (selectedToDelete.length === 0) return;
    try {
      await handleDeleteTransactions(selectedToDelete);
      setDeletingItem(null);
      setSelectedToDelete([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkPay = async () => {
    await handleBulkUpdateStatus(selectedItems, 'PAGO', currentMonth, currentYear);
    setSelectedItems([]);
  };

  const handleBulkCopy = () => {
    if (selectedItems.length === 0) return;
    setCopyForm({ day: realDay.toString(), month: (realMonth + 1).toString(), year: realYear.toString(), showEditor: false });
    setShowCopyModal(true);
  };

  const confirmCopy = async (useCurrentDate: boolean) => {
    try {
      if (useCurrentDate) {
        await handleCopyTransactions(selectedItems, {
          day: realDay,
          month: realMonth,
          year: realYear
        });
      } else {
        await handleCopyTransactions(selectedItems, {
          day: parseInt(copyForm.day),
          month: parseInt(copyForm.month) - 1,
          year: parseInt(copyForm.year)
        });
      }
      setSelectedItems([]);
      setShowCopyModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkEdit = () => {
    if (selectedItems.length === 0) return;
    const itemToEdit = transactions.find(t => t.id === selectedItems[0]);
    if (itemToEdit) {
      handleEdit(itemToEdit);
      setSelectedItems([]);
    }
  };

  const handleBulkDelete = () => {
     if (selectedItems.length === 0) return;
     setDeletingItem({ isBulk: true, description: 'Itens Selecionados' });
     setSelectedToDelete(selectedItems);
  };

  const handleExport = async () => {
    const data = transactions.length > 0 ? transactions : getIsolatedData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cfm_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (re: any) => {
        try {
          const content = JSON.parse(re.target.result);
          if (Array.isArray(content)) {
            if (user?.isOfflineMode) {
              setTransactions(content);
              setIsolatedData(content, 'cfm_transactions_offline');
            } else if (user) {
              const batch = writeBatch(db);
              content.forEach(item => {
                const id = item.id || generateId();
                const ref = doc(db, `users/${user.uid}/transactions`, id);
                const toSave = { ...item };
                delete (toSave as any).id;
                batch.set(ref, toSave);
              });
              await batch.commit();
            }
            alert("Importado com sucesso!");
          }
        } catch (err) {
          alert("Erro ao importar arquivo.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleCleanDuplicates = async () => {
    const seen = new Set();
    const toDelete: string[] = [];
    transactions.forEach(t => {
       const key = `${t.description}-${t.amount}-${t.day}-${t.month}-${t.year}-${t.type}`;
       if (seen.has(key)) toDelete.push(t.id);
       else seen.add(key);
    });
    if (toDelete.length > 0) {
      await handleDeleteTransactions(toDelete);
      alert(`${toDelete.length} duplicados removidos.`);
    } else {
      alert("Nenhum duplicado encontrado.");
    }
  };

  const closeDonationPrompt = () => {
     setShowDonationPrompt(false);
     if (user && !user.isOfflineMode) {
        setFirestoreDoc(doc(db, `users/${user.uid}`), { lastDonationPromptDate: Date.now() }, { merge: true });
     }
  };

  if (authLoading) {
    return (
      <View style={[styles.loginContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 20, color: theme.text }}>Carregando CFM Mobile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.loginContainer, { backgroundColor: theme.background }]}>
        <View style={styles.loginCard}>
          <Text style={[styles.loginTitle, { color: theme.primary }]}>CFM Mobile</Text>
          <Text style={{ color: theme.subText, textAlign: 'center', marginBottom: 40, fontSize: 14 }}>Controle Financeiro de verdade no seu celular.</Text>
          
          <TouchableOpacity 
            style={[styles.loginBtn, { backgroundColor: '#4285F4', marginBottom: 12 }]} 
            onPress={handleLoginGoogle} 
            disabled={isLoggingIn}
          >
            {isLoggingIn ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Entrar com Google</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginBtn, { backgroundColor: '#27ae60', marginBottom: 12 }]} 
            onPress={handleLoginGuest}
          >
            <Text style={styles.loginBtnText}>Entrar como Visitante</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginBtn, { backgroundColor: '#7f8c8d' }]} 
            onPress={enterOfflineMode}
          >
            <Text style={styles.loginBtnText}>Usar Modo Local (Offline)</Text>
          </TouchableOpacity>

          <Text style={{ color: theme.miniText, fontSize: 11, textAlign: 'center', marginTop: 30, lineHeight: 16 }}>
            Seus dados são sincronizados com a nuvem no Google.{"\n"}Visitante e Offline salvam apenas neste aparelho.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      activeOpacity={1} 
      style={[styles.container, { backgroundColor: theme.background }]} 
      onPress={() => setSelectedItems([])}
    >
      <Header 
        user={user} 
        theme={theme} 
        currentYear={currentYear} 
        currentMonth={currentMonth} 
        isSyncing={isSyncing} 
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        setCurrentYear={setCurrentYear}
        setCurrentMonth={setCurrentMonth}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={() => window.location.reload()}
      />

      {showMenu && (
        <Menu 
          theme={theme} 
          user={user} 
          onInstall={handleInstallApp}
          onRefresh={() => window.location.reload()}
          onCleanDuplicates={handleCleanDuplicates}
          onAppearance={() => { setShowThemeSettings(true); setShowMenu(false); }}
          onNotifications={() => { setShowNotificationSettings(true); setShowMenu(false); }}
          onSaveCloud={handleLoginGoogle}
          onImport={handleImport}
          onExport={handleExport}
          onLogout={handleLogout}
          onDonate={() => { setShowDonationPrompt(true); setShowMenu(false); }}
          onClose={() => setShowMenu(false)}
          hasOfflineData={getIsolatedData('cfm_transactions_offline').length > 0}
        />
      )}

      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Search size={14} color={theme.subText} style={{ marginRight: 8 }} />
        <TextInput 
          style={{ flex: 1, color: theme.text, fontSize: 13, height: 36 }} 
          placeholder="Buscar descrição ou categoria..." 
          placeholderTextColor={theme.miniText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={14} color={theme.subText} />
          </TouchableOpacity>
        )}
      </View>

      <Dashboard 
        summary={summary} 
        theme={theme} 
        activeTab={activeTab}
        currentMonth={currentMonth}
        currentYear={currentYear}
        realDay={realDay}
        realMonth={realMonth}
        realYear={realYear}
      />

      <TransactionList 
        summary={summary} 
        theme={theme} 
        selectedItems={selectedItems}
        onToggleSelection={onToggleSelection}
        onDeselectAll={() => setSelectedItems([])}
        currentMonth={currentMonth}
        currentYear={currentYear}
        realMonth={realMonth}
        realYear={realYear}
        todayFormatted={`${String(realDay).padStart(2, '0')}/${String(realMonth + 1).padStart(2, '0')}`}
        activeTab={activeTab}
      />

      {selectedItems.length > 0 && (
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={(e: any) => e.stopPropagation()} 
          style={[styles.selectionBar, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold' }}>{selectedItems.length} selecionados</Text>
          <View style={{ flexDirection: 'row' }}>
            {selectedItems.length === 1 && (
              <TouchableOpacity onPress={handleBulkEdit} style={styles.selectionBtn}>
                <Edit2 color={theme.primary} size={20} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleBulkPay} style={styles.selectionBtn}>
              <CheckCircle2 color={theme.income} size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBulkCopy} style={styles.selectionBtn}>
              <Copy color={theme.primary} size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBulkDelete} style={styles.selectionBtn}>
              <Trash2 color={theme.expense} size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedItems([])} style={styles.selectionBtn}>
              <X color={theme.subText} size={20} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.fabContainer}>
        {activeTab === 'EXPENSE' ? (
          <TouchableOpacity 
            style={[styles.fab, { backgroundColor: theme.expense, width: '90%' }]}
            onPress={(e: any) => {
              e.stopPropagation();
              setForm({ ...INITIAL_FORM, type: 'EXPENSE', cat: EXPENSE_CATEGORIES[0], dueDay: realDay.toString(), dueMonth: (currentMonth + 1).toString(), dueYear: currentYear.toString() });
              setShowForm(true);
            }}
          >
            <Text style={styles.fabText}>- SAÍDA</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.fab, { backgroundColor: theme.income, width: '90%' }]}
            onPress={(e: any) => {
              e.stopPropagation();
              setForm({ ...INITIAL_FORM, type: 'INCOME', cat: INCOME_CATEGORIES[0], dueDay: realDay.toString(), dueMonth: (currentMonth + 1).toString(), dueYear: currentYear.toString() });
              setShowForm(true);
            }}
          >
            <Text style={styles.fabText}>+ ENTRADA</Text>
          </TouchableOpacity>
        )}
      </View>

      {showForm && (
        <TransactionForm 
          theme={theme} 
          form={form} 
          setForm={setForm} 
          onSave={handleSave} 
          onCancel={() => { setShowForm(false); setEditingId(null); }} 
          editingId={editingId}
        />
      )}

      {showCopyModal && (
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.modalOverlay} 
          onPress={() => setShowCopyModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()} 
            style={[styles.deleteModal, { backgroundColor: theme.card }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 15 }]}>Copiar Transações</Text>
            
            {copyForm.showEditor ? (
              <>
                <Text style={{ color: theme.subText, textAlign: 'center', marginBottom: 20 }}>Escolha a nova data:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <TextInput 
                    style={[styles.smallInput, { color: theme.text, borderColor: theme.border, marginRight: 5 }]} 
                    keyboardType="numeric" 
                    value={copyForm.day} 
                    onChangeText={t => setCopyForm(prev => ({ ...prev, day: t }))} 
                    placeholder="Dia"
                  />
                  <TextInput 
                    style={[styles.smallInput, { color: theme.text, borderColor: theme.border, marginRight: 5 }]} 
                    keyboardType="numeric" 
                    value={copyForm.month} 
                    onChangeText={t => setCopyForm(prev => ({ ...prev, month: t }))} 
                    placeholder="Mês"
                  />
                  <TextInput 
                    style={[styles.smallInput, { color: theme.text, borderColor: theme.border, width: 80 }]} 
                    keyboardType="numeric" 
                    value={copyForm.year} 
                    onChangeText={t => setCopyForm(prev => ({ ...prev, year: t }))} 
                    placeholder="Ano"
                  />
                </View>
                <TouchableOpacity style={[styles.btn, { backgroundColor: theme.income, width: '100%', marginBottom: 10 }]} onPress={() => confirmCopy(false)}>
                  <Text style={styles.btnText}>CONFIRMAR CÓPIA</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, { backgroundColor: theme.border, width: '100%' }]} onPress={() => setCopyForm(prev => ({ ...prev, showEditor: false }))}>
                  <Text style={styles.btnText}>VOLTAR</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ color: theme.subText, textAlign: 'center', marginBottom: 20 }}>Deseja copiar para a data atual (Hoje)?</Text>
                <View style={{ width: '100%' }}>
                  <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary, marginBottom: 10 }]} onPress={() => confirmCopy(true)}>
                    <Text style={styles.btnText}>SIM, PARA HOJE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, { backgroundColor: theme.income, marginBottom: 10 }]} onPress={() => setCopyForm(prev => ({ ...prev, showEditor: true }))}>
                    <Text style={styles.btnText}>NÃO, EDITAR DATA</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, { backgroundColor: theme.border }]} onPress={() => setShowCopyModal(false)}>
                    <Text style={styles.btnText}>CANCELAR</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Re-using styles for deleting logic to keep it simple but functional */}
      {deletingItem && (
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.modalOverlay} 
          onPress={() => { setDeletingItem(null); setSelectedToDelete([]); }}
        >
           <TouchableOpacity 
             activeOpacity={1} 
             onPress={(e) => e.stopPropagation()} 
             style={[styles.deleteModal, { backgroundColor: theme.card }]}
           >
              <Text style={[styles.modalTitle, { color: theme.text }]}>Excluir Transação</Text>
              <Text style={{ color: theme.subText, textAlign: 'center', marginBottom: 20 }}>Deseja excluir permanentemente os itens selecionados?</Text>
              <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity style={[styles.btn, { backgroundColor: theme.expense, flex: 1, marginRight: 5 }]} onPress={confirmDelete}>
                    <Text style={styles.btnText}>EXCLUIR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, { backgroundColor: theme.border, flex: 1, marginLeft: 5 }]} onPress={() => { setDeletingItem(null); setSelectedToDelete([]); }}>
                    <Text style={styles.btnText}>CANCELAR</Text>
                  </TouchableOpacity>
              </View>
           </TouchableOpacity>
        </TouchableOpacity>
      )}

      {showThemeSettings && (
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.modalOverlay} 
          onPress={() => setShowThemeSettings(false)}
        >
           <TouchableOpacity 
             activeOpacity={1} 
             onPress={(e) => e.stopPropagation()} 
             style={[styles.themeModal, { backgroundColor: theme.card }]}
           >
              <Text style={[styles.modalTitle, { color: theme.text }]}>Aparência</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                 {['auto', 'day', 'night'].map(mode => (
                   <TouchableOpacity 
                     key={mode} 
                     onPress={() => setThemeMode(mode as any)}
                     style={{ flex: 1, padding: 10, marginHorizontal: 5, borderRadius: 10, backgroundColor: themeMode === mode ? theme.primary : theme.pill, alignItems: 'center' }}
                   >
                     <Text style={{ color: themeMode === mode ? theme.background : theme.text, fontSize: 12, fontWeight: 'bold' }}>
                       {mode === 'auto' ? 'AUTO' : mode === 'day' ? 'DIA' : 'NOITE'}
                     </Text>
                   </TouchableOpacity>
                 ))}
              </View>
              {themeMode === 'auto' && (
                <View>
                   <Text style={{ fontSize: 11, color: theme.subText, marginBottom: 10, textAlign: 'center' }}>Intervalo do Modo Dia (H)</Text>
                   <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                     <TextInput 
                       style={[styles.smallInput, { color: theme.text, borderColor: theme.border }]} 
                       keyboardType="numeric" 
                       value={dayStartHour.toString()} 
                       onChangeText={t => setDayStartHour(Number(t) || 0)} 
                     />
                     <Text style={{ marginHorizontal: 15, color: theme.text }}>até</Text>
                     <TextInput 
                       style={[styles.smallInput, { color: theme.text, borderColor: theme.border }]} 
                       keyboardType="numeric" 
                       value={dayEndHour.toString()} 
                       onChangeText={t => setDayEndHour(Number(t) || 0)} 
                     />
                   </View>
                </View>
              )}
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: theme.primary, width: '100%' }]} 
                onPress={() => setShowThemeSettings(false)}
              >
                <Text style={styles.btnText}>FECHAR</Text>
              </TouchableOpacity>
           </TouchableOpacity>
        </TouchableOpacity>
      )}

      {showNotificationSettings && (
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.modalOverlay} 
          onPress={() => setShowNotificationSettings(false)}
        >
           <TouchableOpacity 
             activeOpacity={1} 
             onPress={(e) => e.stopPropagation()} 
             style={[styles.themeModal, { backgroundColor: theme.card }]}
           >
              <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 15 }]}>Configurar Lembretes</Text>
              
              <Text style={{ color: theme.subText, fontSize: 13, marginBottom: 20 }}>
                Receba alertas antes das suas contas vencerem para evitar esquecimentos.
              </Text>

              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: theme.primary, marginBottom: 20 }]} 
                onPress={() => {
                  requestNotificationPermission();
                  setShowNotifPermissionPrompt(false);
                }}
              >
                <Text style={styles.btnText}>ATIVAR NOTIFICAÇÕES NO NAVEGADOR</Text>
              </TouchableOpacity>

              <View style={{ marginBottom: 15, padding: 15, backgroundColor: theme.pill, borderRadius: 12 }}>
                <TouchableOpacity 
                  onPress={() => setNotifOnDay(!notifOnDay)}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}
                >
                  <View style={{ width: 22, height: 22, borderWidth: 1, borderColor: theme.border, borderRadius: 6, marginRight: 12, backgroundColor: notifOnDay ? theme.income : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                    {notifOnDay && <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>}
                  </View>
                  <Text style={{ color: theme.text, fontSize: 14 }}>Notificar no dia do vencimento</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                     <Text style={{ color: theme.text, fontSize: 14 }}>Notificar antecedência:</Text>
                     <Text style={{ color: theme.miniText, fontSize: 11 }}>Escolha quantos dias antes</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput 
                      style={[styles.smallInput, { color: theme.text, borderColor: theme.border, width: 45, height: 35, padding: 0 }]} 
                      keyboardType="numeric" 
                      value={notifBeforeDays} 
                      onChangeText={setNotifBeforeDays} 
                    />
                    <Text style={{ color: theme.text, marginLeft: 8, fontSize: 14 }}>dias</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: theme.border, width: '100%', marginTop: 10 }]} 
                onPress={() => setShowNotificationSettings(false)}
              >
                <Text style={[styles.btnText, { color: theme.text }]}>SALVAR E FECHAR</Text>
              </TouchableOpacity>
           </TouchableOpacity>
        </TouchableOpacity>
      )}

      {showNotifPermissionPrompt && (
        <View style={[styles.installPrompt, { backgroundColor: theme.card, borderColor: theme.border, bottom: 160 }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold' }}>Deseja alertas de vencimento?</Text>
            <Text style={{ color: theme.miniText, fontSize: 11 }}>Notificamos 1 dia antes ou na data.</Text>
          </View>
          <TouchableOpacity 
            style={[styles.installBtn, { backgroundColor: theme.income }]} 
            onPress={() => {
              setShowNotificationSettings(true);
              setShowNotifPermissionPrompt(false);
            }}
          >
             <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>CONFIGURAR</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              setShowNotifPermissionPrompt(false);
              localStorage.setItem('cfm_notif_dismissed', 'true');
            }} 
            style={{ padding: 5, marginLeft: 10 }}
          >
            <X color={theme.subText} size={20} />
          </TouchableOpacity>
        </View>
      )}


      {showInstallPrompt && (
        <View style={[styles.installPrompt, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: 'bold' }}>CFM no seu celular</Text>
            <Text style={{ color: theme.miniText, fontSize: 11 }}>Instale para melhor experiência.</Text>
          </View>
          <TouchableOpacity style={[styles.installBtn, { backgroundColor: theme.primary }]} onPress={handleInstallApp}>
             <Text style={{ color: theme.background, fontSize: 12, fontWeight: 'bold' }}>INSTALAR</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowInstallPrompt(false)} style={{ padding: 5, marginLeft: 10 }}>
            <X color={theme.subText} size={20} />
          </TouchableOpacity>
        </View>
      )}

      {showDonationPrompt && (
  <DonationModal theme={theme} onClose={closeDonationPrompt} />
)}
</TouchableOpacity>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <CFMMobileLite />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginCard: { width: '85%', padding: 30, alignItems: 'center' },
  loginTitle: { fontSize: 32, fontWeight: '900', marginBottom: 10 },
  loginBtn: { paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, width: '100%', alignItems: 'center' },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15, paddingHorizontal: 12, borderRadius: 10, height: 40, marginTop: 10 },
  fabContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', padding: 15, paddingBottom: 20 },
  fab: { paddingVertical: 15, borderRadius: 30, width: '46%', alignItems: 'center', elevation: 5 },
  fabText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  selectionBar: { position: 'absolute', bottom: 85, left: 15, right: 15, height: 56, borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 8 },
  selectionBtn: { padding: 8, marginLeft: 5 },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 20000 },
  deleteModal: { width: '85%', padding: 25, borderRadius: 15, alignItems: 'center' },
  themeModal: { width: '85%', padding: 25, borderRadius: 15 },
  smallInput: { borderWidth: 1, borderRadius: 8, padding: 8, width: 60, textAlign: 'center' },
  btn: { padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  installPrompt: { position: 'absolute', bottom: 85, left: 15, right: 15, padding: 15, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', elevation: 10, zIndex: 1000 },
  installBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  donationCard: { width: '80%', padding: 30, borderRadius: 20, alignItems: 'center', elevation: 20 },
  err: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
