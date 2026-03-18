import { createContext, useContext, useState, useEffect } from 'react';
import type { Client, Couvaison, Transaction, Machine, AuditLog } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';

interface AppState {
  clients: Client[];
  couvaisons: Couvaison[];
  transactions: Transaction[];
  machines: Machine[];
  logs: AuditLog[];
  addCouvaison: (couv: Omit<Couvaison, 'id' | 'clientId'>, clientInfos: Omit<Client, 'id'>) => void;
  updateCouvaison: (id: string, updates: Partial<Couvaison>) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addMachine: (machine: Omit<Machine, 'id'>) => void;
  updateMachine: (id: string, updates: Partial<Machine>) => void;
  addLog: (action: AuditLog['action'], target: string, details: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  
  const [logs, setLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('ivoire_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('ivoire_clients');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [couvaisons, setCouvaisons] = useState<Couvaison[]>(() => {
    const saved = localStorage.getItem('ivoire_couvaisons');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('ivoire_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [machines, setMachines] = useState<Machine[]>(() => {
    const saved = localStorage.getItem('ivoire_machines');
    return saved ? JSON.parse(saved) : [
      { 
        id: 'm-1', nom: 'Couveuse Alpha-1000', capacite: 1000, type: 'Couveuse', enService: true,
        casiers: [
          { id: 'c-1-1', nom: 'Casier Haut', capacite: 500 },
          { id: 'c-1-2', nom: 'Casier Bas', capacite: 500 }
        ]
      },
      { 
        id: 'm-2', nom: 'Éclosoir Beta-500', capacite: 500, type: 'Éclosoir', enService: true,
        casiers: [
          { id: 'c-2-1', nom: 'Panier 1', capacite: 250 },
          { id: 'c-2-2', nom: 'Panier 2', capacite: 250 }
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('ivoire_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('ivoire_couvaisons', JSON.stringify(couvaisons));
  }, [couvaisons]);

  useEffect(() => {
    localStorage.setItem('ivoire_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('ivoire_machines', JSON.stringify(machines));
  }, [machines]);

  useEffect(() => {
    localStorage.setItem('ivoire_logs', JSON.stringify(logs));
  }, [logs]);

  const addLog = (action: AuditLog['action'], target: string, details: string) => {
    if (!currentUser) return;
    const newLog: AuditLog = {
      id: uuidv4(),
      userId: currentUser.id,
      userName: currentUser.nom,
      action,
      target,
      details,
      timestamp: new Date().toISOString()
    };
    // Keep only last 1000 logs to prevent memory leaks
    setLogs(prev => [newLog, ...prev].slice(0, 1000));
  };

  const addCouvaison = (couv: Omit<Couvaison, 'id' | 'clientId'>, clientInfos: Omit<Client, 'id'>) => {
    let client = clients.find(c => c.telephone === clientInfos.telephone);
    if (!client) {
      client = { id: uuidv4(), ...clientInfos };
      setClients(prev => [...prev, client!]);
    }

    const newCouvaison: Couvaison = {
      ...couv,
      id: uuidv4(),
      clientId: client.id,
    };
    setCouvaisons(prev => [...prev, newCouvaison]);
    addLog('CRÉATION', 'Couvaison', `Réception de ${couv.nombreOeufs} œufs (${couv.typeOeuf}) pour ${client.nom}.`);
  };

  const updateCouvaison = (id: string, updates: Partial<Couvaison>) => {
    setCouvaisons(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    addLog('MODIFICATION', 'Couvaison', `Mise à jour d'étape (Statut/Résultats) pour le lot ID...${id.slice(-4)}`);
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [...prev, { ...transaction, id: uuidv4() }]);
    addLog('CRÉATION', 'Facture', `${transaction.typeTransaction} de ${transaction.montantTotal} F (Saisie comptable).`);
  };

  const addMachine = (machine: Omit<Machine, 'id'>) => {
    setMachines(prev => [...prev, { ...machine, id: uuidv4() }]);
    addLog('CRÉATION', 'Machine', `Ajout de la machine de production: ${machine.nom}.`);
  };

  const updateMachine = (id: string, updates: Partial<Machine>) => {
    setMachines(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    let text = updates.enService !== undefined ? `Etat de machine changé` : `Paramétrage machine modifié`;
    addLog('MODIFICATION', 'Machine', `${text} (ID...${id.slice(-4)}).`);
  };

  return (
    <AppContext.Provider value={{ logs, clients, couvaisons, transactions, machines, addCouvaison, updateCouvaison, addTransaction, addMachine, updateMachine, addLog }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
