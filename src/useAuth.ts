import { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInAnonymously, onAuthStateChanged, signOut, db, disableNetwork, enableNetwork, getDoc, doc, setPersistence, browserLocalPersistence } from './firebase';
import { User } from './types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showDonationPrompt, setShowDonationPrompt] = useState(false);

  useEffect(() => {
    const isOffline = localStorage.getItem('cfm_offline_mode') === 'true';

    if (isOffline) {
      disableNetwork(db).catch(console.error);
      setUser({ uid: 'local_offline_user', isOfflineMode: true });
      setAuthLoading(false);
      return;
    }

    let redirectHandled = false;

    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        return getRedirectResult(auth);
      })
      .then((result) => {
        redirectHandled = true;
        if (result?.user) {
          console.log("Redirect login ok:", result.user.email);
          // O onAuthStateChanged cuidará de atualizar o estado 'user'
        }
      })
      .catch(err => {
        redirectHandled = true;
        if (err.code !== 'auth/redirect-cancelled-by-user' && err.code !== 'auth/popup-closed-by-user') {
          console.error("Erro no redirect:", err);
        }
      });

    const unsub = onAuthStateChanged(auth, (usr) => {
      if (localStorage.getItem('cfm_offline_mode') === 'true') return;

      if (usr) {
        setUser({
          uid: usr.uid,
          isAnonymous: usr.isAnonymous,
          isOfflineMode: false
        });
        
        getDoc(doc(db, `users/${usr.uid}`)).then(d => {
          const data = d.data();
          const lastDonation = data?.lastDonationPromptDate || 0;
          const now = Date.now();
          if (now - lastDonation > 30 * 24 * 60 * 60 * 1000) {
            setShowDonationPrompt(true);
          }
        }).catch(err => {
          console.log('Donation prompt error (possibly offline):', err);
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    // Timeout de segurança maior para cobrir o redirect
    const timer = setTimeout(() => {
      setAuthLoading(false);
    }, 5000);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  const handleLoginGoogle = async () => {
    if (localStorage.getItem('cfm_offline_mode') === 'true') {
      localStorage.removeItem('cfm_offline_mode');
      enableNetwork(db).catch(console.error);
    }

    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (e2: any) {
          console.error(e2);
          alert("Não conseguimos conectar com o Google: " + (e2.message || "Tente novamente."));
        }
      } else {
        console.error(e);
        alert("Não conseguimos conectar com o Google: " + (e.message || "Tente novamente."));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLoginGuest = async () => {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.error(e);
      alert("Erro ao entrar como visitante.");
    }
  };

  const handleLogout = async () => {
    if (user?.isOfflineMode) {
      localStorage.removeItem('cfm_offline_mode');
      await enableNetwork(db);
      setUser(null);
    } else {
      await signOut(auth);
    }
  };

  const enterOfflineMode = () => {
    localStorage.setItem('cfm_offline_mode', 'true');
    disableNetwork(db).catch(console.error);
    setUser({ uid: 'local_offline_user', isOfflineMode: true });
  };

  return {
    user,
    authLoading,
    isLoggingIn,
    showDonationPrompt,
    setShowDonationPrompt,
    handleLoginGoogle,
    handleLoginGuest,
    handleLogout,
    enterOfflineMode
  };
}
