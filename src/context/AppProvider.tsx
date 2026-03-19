/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import type { Client, Couvaison, Transaction, Machine, AuditLog, ReceiptArchive } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { callInsforgeFunction } from '../lib/insforgeApi';

interface AppState {
  clients: Client[];
  couvaisons: Couvaison[];
  transactions: Transaction[];
  machines: Machine[];
  logs: AuditLog[];
  receiptArchives: ReceiptArchive[];
  addCouvaison: (couv: Omit<Couvaison, 'id' | 'clientId'>, clientInfos: Omit<Client, 'id'>) => void;
  updateCouvaison: (id: string, updates: Partial<Couvaison>) => void;
  deleteCouvaison: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addMachine: (machine: Omit<Machine, 'id'>) => void;
  updateMachine: (id: string, updates: Partial<Machine>) => void;
  deleteMachine: (id: string) => Promise<void>;
  addReceiptArchive: (archive: Omit<ReceiptArchive, 'id' | 'createdAt'>) => Promise<void>;
  addLog: (action: AuditLog['action'], target: string, details: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  
  const [logs, setLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('ivoire_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [receiptArchives, setReceiptArchives] = useState<ReceiptArchive[]>([]);

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

  // Charge les données depuis InsForge au démarrage.
  useEffect(() => {
    (async () => {
      try {
        const clientsRes = await callInsforgeFunction<{ clients: Client[] }>('clients_list', {})
        setClients(clientsRes.clients)
      } catch {
        // fallback localStorage (déjà initialisé via useState)
      }

      try {
        const couvRes = await callInsforgeFunction<{ couvaisons: Couvaison[] }>('couvaisons_list', {})
        setCouvaisons(couvRes.couvaisons)
      } catch {
        // fallback localStorage
      }

      try {
        const machinesRes = await callInsforgeFunction<{ machines: Machine[] }>('machines_list', {})
        if (machinesRes.machines.length > 0) {
          setMachines(machinesRes.machines)
        }
      } catch {
        // fallback localStorage
      }

      try {
        const txRes = await callInsforgeFunction<{ transactions: Transaction[] }>('transactions_list', {})
        setTransactions(txRes.transactions)
      } catch {
        // fallback localStorage
      }

      try {
        const logsRes = await callInsforgeFunction<{ logs: AuditLog[] }>('logs_list', {})
        setLogs(logsRes.logs)
      } catch {
        // fallback localStorage
      }

      try {
        const receiptRes = await callInsforgeFunction<{ archives: ReceiptArchive[] }>('receipt_archives_list', {})
        setReceiptArchives(receiptRes.archives)
      } catch {
        // no-op
      }
    })()
  }, [])

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

    // Persistance backend InsForge (non bloquante pour l'UX).
    void callInsforgeFunction('log_create', newLog).catch(() => undefined);
  };

  const addCouvaison = (couv: Omit<Couvaison, 'id' | 'clientId'>, clientInfos: Omit<Client, 'id'>) => {
    ;(async () => {
      try {
        const res = await callInsforgeFunction<{ couvaison: Couvaison }>('couvaison_create', {
          couv,
          clientInfos,
        })
        if (res.couvaison) {
          // On resynchronise depuis le backend pour éviter toute divergence d'ID client.
          const [clientsRes, couvRes] = await Promise.all([
            callInsforgeFunction<{ clients: Client[] }>('clients_list', {}),
            callInsforgeFunction<{ couvaisons: Couvaison[] }>('couvaisons_list', {}),
          ])
          setClients(clientsRes.clients)
          setCouvaisons(couvRes.couvaisons)

          addLog('CRÉATION', 'Couvaison', `Réception de ${couv.nombreOeufs} œufs (${couv.typeOeuf}) pour ${clientInfos.nom}.`)
        }
      } catch {
        // fallback local (au moins pour ne pas bloquer l'utilisateur)
        let client = clients.find(c => c.telephone === clientInfos.telephone)
        if (!client) {
          client = { id: uuidv4(), ...clientInfos }
          setClients(prev => [...prev, client!])
        }
        const newCouvaison: Couvaison = { ...couv, id: uuidv4(), clientId: client!.id }
        setCouvaisons(prev => [...prev, newCouvaison])
        addLog('CRÉATION', 'Couvaison', `Réception de ${couv.nombreOeufs} œufs (${couv.typeOeuf}) pour ${clientInfos.nom}.`)
      }
    })()
  };

  const updateCouvaison = (id: string, updates: Partial<Couvaison>) => {
    ;(async () => {
      try {
        const res = await callInsforgeFunction<{ couvaison: Couvaison }>('couvaison_update', {
          id,
          updates,
        })
        if (res.couvaison) {
          setCouvaisons(prev => prev.map(c => (c.id === id ? res.couvaison : c)))
        } else {
          // fallback local
          setCouvaisons(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)))
        }
      } catch {
        setCouvaisons(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)))
      } finally {
        addLog('MODIFICATION', 'Couvaison', `Mise à jour d'étape (Statut/Résultats) pour le lot ID...${id.slice(-4)}`)
      }
    })()
  };

  const deleteCouvaison = async (id: string) => {
    try {
      await callInsforgeFunction<{ success: boolean }>('couvaison_delete', { id })

      // Met à jour l'état local pour refléter la suppression immédiatement.
      setCouvaisons(prev => prev.filter(c => c.id !== id))
      setTransactions(prev => prev.filter(t => t.couvaisonId !== id))

      addLog('SUPPRESSION', 'Couvaison', `Suppression du lot ID...${id.slice(-4)}.`)

      // Resynchronise depuis le backend pour rester cohérent.
      const [clientsRes, couvRes] = await Promise.all([
        callInsforgeFunction<{ clients: Client[] }>('clients_list', {}),
        callInsforgeFunction<{ couvaisons: Couvaison[] }>('couvaisons_list', {}),
      ])
      setClients(clientsRes.clients)
      setCouvaisons(couvRes.couvaisons)
    } catch {
      // Si la suppression backend échoue, on ne modifie pas l'état.
      throw new Error('Echec de suppression côté backend')
    }
  }

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    ;(async () => {
      try {
        const res = await callInsforgeFunction<{ transaction: Transaction }>('transaction_create', transaction)
        if (res.transaction) {
          setTransactions(prev => [...prev, res.transaction])
        } else {
          setTransactions(prev => [...prev, { ...transaction, id: uuidv4() }])
        }
      } catch {
        setTransactions(prev => [...prev, { ...transaction, id: uuidv4() }])
      } finally {
        addLog('CRÉATION', 'Facture', `${transaction.typeTransaction} de ${transaction.montantTotal} F (Saisie comptable).`)
      }
    })()
  };

  const addMachine = (machine: Omit<Machine, 'id'>) => {
    ;(async () => {
      try {
        await callInsforgeFunction('machine_create', machine)
        const machinesRes = await callInsforgeFunction<{ machines: Machine[] }>('machines_list', {})
        setMachines(machinesRes.machines)
      } catch {
        setMachines(prev => [...prev, { ...machine, id: uuidv4() }])
      } finally {
        addLog('CRÉATION', 'Machine', `Ajout de la machine de production: ${machine.nom}.`)
      }
    })()
  };

  const updateMachine = (id: string, updates: Partial<Machine>) => {
    ;(async () => {
      try {
        await callInsforgeFunction('machine_update', { id, updates })
        const machinesRes = await callInsforgeFunction<{ machines: Machine[] }>('machines_list', {})
        setMachines(machinesRes.machines)
      } catch {
        setMachines(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)))
      } finally {
        const text = updates.enService !== undefined ? `Etat de machine changé` : `Paramétrage machine modifié`
        addLog('MODIFICATION', 'Machine', `${text} (ID...${id.slice(-4)}).`)
      }
    })()
  };

  const deleteMachine = async (id: string) => {
    try {
      await callInsforgeFunction('machine_delete', { id })
      setMachines(prev => prev.filter(m => m.id !== id))
      addLog('SUPPRESSION', 'Machine', `Suppression de machine (ID...${id.slice(-4)}).`)
    } catch {
      throw new Error('Echec de suppression machine côté backend')
    }
  }

  const addReceiptArchive = async (archive: Omit<ReceiptArchive, 'id' | 'createdAt'>) => {
    try {
      const createdAt = new Date().toISOString()
      await callInsforgeFunction('receipt_archive_create', archive)
      setReceiptArchives(prev => [
        {
          ...archive,
          id: uuidv4(),
          createdAt,
        },
        ...prev,
      ])
      addLog('CRÉATION', 'Archive Reçu', `Archivage du reçu ${archive.invoiceNumber} pour client ID...${archive.clientId.slice(-4)}.`)
    } catch {
      throw new Error('Echec d’archivage reçu côté backend')
    }
  }

  return (
    <AppContext.Provider value={{ logs, receiptArchives, clients, couvaisons, transactions, machines, addCouvaison, updateCouvaison, deleteCouvaison, addTransaction, addMachine, updateMachine, deleteMachine, addReceiptArchive, addLog }}>
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
