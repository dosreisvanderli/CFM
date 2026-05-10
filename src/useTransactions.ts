import { useState, useEffect, useCallback, useRef } from 'react';
import { db, collection, query, onSnapshot, doc, setFirestoreDoc, writeBatch } from './firebase';
import { handleFirestoreError, OperationType } from './firebaseUtils';
import { Transaction, User } from './types';
import { auth } from './firebase';
import { generateId, getIsolatedData, setIsolatedData } from './utils';

export function useTransactions(user: User | null, isOnline: boolean) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cloudDataLoaded, setCloudDataLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);


const syncDone = useRef(false);
  useEffect(() => {
    if (!user) return;
    
    if (user.isOfflineMode) {
      setTransactions(getIsolatedData('cfm_transactions_offline'));
      return;
    }

    const q = query(collection(db, `users/${user.uid}/transactions`));
    setCloudDataLoaded(false);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      const seenIds = new Set();
      
      snapshot.forEach(docSnap => {
        if (!seenIds.has(docSnap.id)) {
          data.push({ id: docSnap.id, ...docSnap.data() });
          seenIds.add(docSnap.id);
        }
      });
      
      const sortedData = data.sort((a, b) => {
        const timeA = (a.year || 0) * 10000 + ((a.month || 0) + 1) * 100 + (a.day || 0);
        const timeB = (b.year || 0) * 10000 + ((b.month || 0) + 1) * 100 + (b.day || 0);
        return timeB - timeA || b.id.localeCompare(a.id);
      });

      setTransactions(sortedData);
      setCloudDataLoaded(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/transactions`, auth);
    });
    return () => unsubscribe();
  }, [user]);

  const syncLocalToCloud = useCallback(async (targetUser: User) => {
    if (!targetUser || targetUser.isOfflineMode || isSyncing) return;
    
    const local = getIsolatedData();
    const offlineData = getIsolatedData('cfm_transactions_offline');
    
    const allLocal = [...local];
    offlineData.forEach(off => {
        if (!allLocal.find(l => l.id === off.id)) {
            allLocal.push(off);
        }
    });
    if (allLocal.length === 0) return;

    setIsSyncing(true);
    try {
      if (!cloudDataLoaded) await new Promise(r => setTimeout(r, 2000));
      const cloudLogicKeys = new Set(transactions.map(t => `${t.description}-${t.amount}-${t.day}-${t.month}-${t.year}-${t.type}`));
      const seenLocally = new Set();
      const toUpload = allLocal.filter(t => {
        const key = `${t.description}-${t.amount}-${t.day}-${t.month}-${t.year}-${t.type}`;
        if (cloudLogicKeys.has(key) || seenLocally.has(key)) return false;
        seenLocally.add(key);
        return true;
      });

      if (toUpload.length > 0) {
        const batch = writeBatch(db);
        toUpload.forEach(item => {
          const id = item.id || generateId();
          const ref = doc(db, `users/${targetUser.uid}/transactions`, id);
          const toSave = { ...item };
          delete (toSave as any).id;
          batch.set(ref, toSave);
        });
        await batch.commit();
        localStorage.removeItem('cfm_transactions_offline');
        localStorage.removeItem('cfm_transactions_isolated');
      }
    } catch (e) {
      console.error("Erro na sincronização automática:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [transactions, cloudDataLoaded, isSyncing]);

  useEffect(() => {
    if (user && !user.isOfflineMode && isOnline && cloudDataLoaded && !syncDone.current) {
      syncDone.current = true;
      syncLocalToCloud(user);
    }
  }, [user?.uid, isOnline, cloudDataLoaded]);

  const handleSaveTransaction = async (formData: any, editingId: string | null, currentMonth: number, currentYear: number) => {
    if (!user) return;
    try {
      if (editingId) {
        const itemDay = parseInt(formData.dueDay) || new Date().getDate();
        const itemMonth = (parseInt(formData.dueMonth) || currentMonth + 1) - 1;
        const itemYear = parseInt(formData.dueYear) || currentYear;
        
        const maxDays = new Date(itemYear, itemMonth + 1, 0).getDate();
        const finalDay = itemDay > maxDays ? maxDays : itemDay;

        const existingT = transactions.find(t => t.id === editingId);
        if(!existingT) return;

        const newlyPaid = formData.status === 'PAGO' && existingT.status !== 'PAGO';
        const newlyPending = formData.status === 'PENDENTE' && existingT.status !== 'PENDENTE';
        
        const updatedData: any = {
          description: formData.desc,
          amount: parseFloat(formData.val.replace(',', '.')).toFixed(2),
          category: formData.cat,
          type: formData.type,
          status: formData.status,
          day: finalDay,
          month: itemMonth,
          year: itemYear,
          paidAtMonth: newlyPaid ? currentMonth : (newlyPending ? null : (existingT.paidAtMonth ?? null)),
          paidAtYear: newlyPaid ? currentYear : (newlyPending ? null : (existingT.paidAtYear ?? null))
        };

        if (existingT.groupId) updatedData.groupId = existingT.groupId;

        if (user.isOfflineMode) {
          const data = getIsolatedData('cfm_transactions_offline');
          const idx = data.findIndex((t: any) => t.id === editingId);
          if (idx >= 0) {
            data[idx] = { ...data[idx], ...updatedData };
            setIsolatedData(data, 'cfm_transactions_offline');
            setTransactions(data);
          }
        } else {
          await setFirestoreDoc(doc(db, `users/${user.uid}/transactions`, editingId), updatedData);
        }
      } else {
        const numInstallments = parseInt(formData.installments) || 1;
        const startInstallment = parseInt(formData.currentInstallment) || 1;
        const baseAmount = parseFloat(formData.val.replace(',', '.')).toFixed(2);
        const parsedDay = parseInt(formData.dueDay) || new Date().getDate();
        const initialMonth = (parseInt(formData.dueMonth) || currentMonth + 1) - 1;
        const initialYear = parseInt(formData.dueYear) || currentYear;
        const newGroupId = numInstallments > 1 || startInstallment > 1 ? doc(collection(db, 'temp')).id : null;
        
        const today = new Date();
        today.setHours(0,0,0,0);
        const batch = writeBatch(db);
        const offlineItemsToAdd: any[] = [];
        const totalToGenerate = numInstallments > 1 || startInstallment > 1 ? (numInstallments - startInstallment + 1) : 1;

        for (let i = 0; i < totalToGenerate; i++) {
          const currentInstNum = startInstallment + i;
          let m = initialMonth + i;
          let y = initialYear + Math.floor(m / 12);
          m = m % 12;
          const maxDays = new Date(y, m + 1, 0).getDate();
          const d = parsedDay > maxDays ? maxDays : parsedDay;
          const targetDate = new Date(y, m, d);
          const isFuture = targetDate > today;
          const itemStatus = isFuture ? 'PENDENTE' : (i === 0 ? formData.status : 'PENDENTE');

          const insertData: any = {
            description: `${formData.desc} ${(numInstallments > 1 || startInstallment > 1) ? `(${currentInstNum}/${numInstallments})` : ''}`.trim(),
            amount: baseAmount,
            category: formData.cat,
            type: formData.type,
            status: itemStatus,
            day: d,
            month: m,
            year: y,
            paidAtMonth: itemStatus === 'PAGO' ? currentMonth : null,
            paidAtYear: itemStatus === 'PAGO' ? currentYear : null
          };
          if (newGroupId) insertData.groupId = newGroupId;

          if (user.isOfflineMode) {
            insertData.id = generateId();
            offlineItemsToAdd.push(insertData);
          } else {
            const ref = doc(collection(db, `users/${user.uid}/transactions`));
            batch.set(ref, insertData);
          }
        }

        if (user.isOfflineMode) {
          const currentData = getIsolatedData('cfm_transactions_offline');
          const next = [...currentData, ...offlineItemsToAdd];
          setIsolatedData(next, 'cfm_transactions_offline');
          setTransactions(next);
        } else {
          await batch.commit();
        }
      }
    } catch (e: any) {
      console.error("SAVE ERROR:", JSON.stringify(e));
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}/transactions`, auth);
      throw e;
    }
  };

  const handleDeleteTransactions = async (ids: string[]) => {
    if (!user || ids.length === 0) return;
    try {
      if (user.isOfflineMode) {
        const current = getIsolatedData('cfm_transactions_offline');
        const next = current.filter((t: any) => !ids.includes(t.id));
        setIsolatedData(next, 'cfm_transactions_offline');
        setTransactions(next);
      } else {
        const batch = writeBatch(db);
        for (const id of ids) {
          batch.delete(doc(db, `users/${user.uid}/transactions`, id));
        }
        await batch.commit();
      }
    } catch (e: any) {
      handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/transactions`, auth);
      throw e;
    }
  };

  const handleBulkUpdateStatus = async (ids: string[], status: 'PAGO' | 'PENDENTE', currentMonth: number, currentYear: number) => {
    if (!user || ids.length === 0) return;
    try {
      const itemsToUpdate = transactions.filter(t => ids.includes(t.id));
      if (user.isOfflineMode) {
        const current = getIsolatedData('cfm_transactions_offline');
        itemsToUpdate.forEach(item => {
          const idx = current.findIndex((t: any) => t.id === item.id);
          if (idx >= 0) {
            current[idx].status = status;
            current[idx].paidAtMonth = status === 'PAGO' ? currentMonth : null;
            current[idx].paidAtYear = status === 'PAGO' ? currentYear : null;
          }
        });
        setIsolatedData(current, 'cfm_transactions_offline');
        setTransactions(current);
      } else {
        const batch = writeBatch(db);
        for (const item of itemsToUpdate) {
          batch.update(doc(db, `users/${user.uid}/transactions`, item.id), {
            status: status,
            paidAtMonth: status === 'PAGO' ? currentMonth : null,
            paidAtYear: status === 'PAGO' ? currentYear : null
          });
        }
        await batch.commit();
      }
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}/transactions`, auth);
      throw e;
    }
  };

  const handleCopyTransactions = async (ids: string[]) => {
    if (!user || ids.length === 0) return;
    try {
      const itemsToCopy = transactions.filter(t => ids.includes(t.id));
      if (user.isOfflineMode) {
        const offlineItemsToAdd: any[] = [];
        itemsToCopy.forEach(item => {
          let nextMonth = item.month + 1;
          let nextYear = item.year;
          if (nextMonth > 11) { nextMonth = 0; nextYear++; }
          offlineItemsToAdd.push({
            id: generateId(),
            description: item.description,
            amount: item.amount,
            category: item.category,
            type: item.type,
            status: 'PENDENTE',
            day: item.day || new Date().getDate(),
            month: nextMonth,
            year: nextYear,
            groupId: item.groupId || null
          });
        });
        const next = [...getIsolatedData('cfm_transactions_offline'), ...offlineItemsToAdd];
        setIsolatedData(next, 'cfm_transactions_offline');
        setTransactions(next);
      } else {
        const batch = writeBatch(db);
        itemsToCopy.forEach(item => {
          const newRef = doc(collection(db, `users/${user.uid}/transactions`));
          let nextMonth = item.month + 1;
          let nextYear = item.year;
          if (nextMonth > 11) { nextMonth = 0; nextYear++; }
          batch.set(newRef, {
            description: item.description,
            amount: item.amount,
            category: item.category,
            type: item.type,
            status: 'PENDENTE',
            day: item.day || new Date().getDate(),
            month: nextMonth,
            year: nextYear,
            groupId: item.groupId || null
          });
        });
        await batch.commit();
      }
    } catch (err: any) {
       handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/transactions`, auth);
       throw err;
    }
  };

  return {
    transactions,
    setTransactions,
    cloudDataLoaded,
    isSyncing,
    syncLocalToCloud,
    handleSaveTransaction,
    handleDeleteTransactions,
    handleBulkUpdateStatus,
    handleCopyTransactions
  };
}
