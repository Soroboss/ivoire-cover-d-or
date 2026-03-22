/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import type { Client, Couvaison, Transaction, Machine, AuditLog, ReceiptArchive, ClientMessage } from '../types';
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
  clientMessages: ClientMessage[];
  addCouvaison: (couv: Omit<Couvaison, 'id' | 'clientId'>, clientInfos: Omit<Client, 'id'>) => Promise<void>;
  /** Plusieurs lots (types d’œufs différents) pour une même réception client — une synchro API à la fin */
  addCouvaisonsBatch: (
    lines: Omit<Couvaison, 'id' | 'clientId'>[],
    clientInfos: Omit<Client, 'id'>,
  ) => Promise<void>;
  updateCouvaison: (id: string, updates: Partial<Couvaison>) => Promise<void>;
  deleteCouvaison: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  addMachine: (machine: Omit<Machine, 'id'>) => Promise<void>;
  updateMachine: (id: string, updates: Partial<Machine>) => Promise<void>;
  deleteMachine: (id: string) => Promise<void>;
  addReceiptArchive: (archive: Omit<ReceiptArchive, 'id' | 'createdAt'>) => Promise<void>;
  addClientMessage: (message: Omit<ClientMessage, 'id' | 'sentAt'> & { sentAt?: string }) => Promise<void>;
  addLog: (action: AuditLog['action'], target: string, details: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [receiptArchives, setReceiptArchives] = useState<ReceiptArchive[]>([]);
  const [clientMessages, setClientMessages] = useState<ClientMessage[]>([]);

  const [clients, setClients] = useState<Client[]>([]);
  
  const [couvaisons, setCouvaisons] = useState<Couvaison[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [machines, setMachines] = useState<Machine[]>([]);

  // Charge les données depuis InsForge au démarrage.
  useEffect(() => {
    (async () => {
      const seedMachines: Array<Omit<Machine, 'id'>> = [
        {
          nom: 'Couveuse Alpha-1000',
          capacite: 1000,
          type: 'Couveuse',
          enService: true,
          casiers: [
            { id: uuidv4(), nom: 'Casier Haut', capacite: 500 },
            { id: uuidv4(), nom: 'Casier Bas', capacite: 500 },
          ],
        },
        {
          nom: 'Éclosoir Beta-500',
          capacite: 500,
          type: 'Éclosoir',
          enService: true,
          casiers: [
            { id: uuidv4(), nom: 'Panier 1', capacite: 250 },
            { id: uuidv4(), nom: 'Panier 2', capacite: 250 },
          ],
        },
      ]

      try {
        const clientsRes = await callInsforgeFunction<{ clients: Client[] }>('clients_list', {})
        setClients(clientsRes.clients)
      } catch {
        // no-op
      }

      try {
        const couvRes = await callInsforgeFunction<{ couvaisons: Couvaison[] }>('couvaisons_list', {})
        setCouvaisons(couvRes.couvaisons)
      } catch {
        // no-op
      }

      try {
        const machinesRes = await callInsforgeFunction<{ machines: Machine[] }>('machines_list', {})
        if (machinesRes.machines.length === 0) {
          // Seed uniquement si la table est vide.
          await Promise.all(seedMachines.map(m => callInsforgeFunction('machine_create', m)))
          const machinesRes2 = await callInsforgeFunction<{ machines: Machine[] }>('machines_list', {})
          setMachines(machinesRes2.machines)
        } else {
          setMachines(machinesRes.machines)
        }
      } catch {
        // no-op
      }

      try {
        const txRes = await callInsforgeFunction<{ transactions: Transaction[] }>('transactions_list', {})
        setTransactions(txRes.transactions)
      } catch {
        // no-op
      }

      try {
        const logsRes = await callInsforgeFunction<{ logs: AuditLog[] }>('logs_list', {})
        setLogs(logsRes.logs)
      } catch {
        // no-op
      }

      try {
        const receiptRes = await callInsforgeFunction<{ archives: ReceiptArchive[] }>('receipt_archives_list', {})
        setReceiptArchives(receiptRes.archives)
      } catch {
        // no-op
      }

      try {
        const messagesRes = await callInsforgeFunction<{ messages: ClientMessage[] }>('client_messages_list', {})
        setClientMessages(messagesRes.messages)
      } catch {
        // no-op
      }
    })()
  }, [])

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

  const addCouvaison = async (couv: Omit<Couvaison, 'id' | 'clientId'>, clientInfos: Omit<Client, 'id'>) => {
    const res = await callInsforgeFunction<{ couvaison: Couvaison }>('couvaison_create', {
      couv,
      clientInfos,
    })

    if (!res.couvaison) {
      throw new Error('Echec de création côté backend (couvaison_create).')
    }

    // On resynchronise depuis le backend pour éviter toute divergence d'ID client.
    const [clientsRes, couvRes] = await Promise.all([
      callInsforgeFunction<{ clients: Client[] }>('clients_list', {}),
      callInsforgeFunction<{ couvaisons: Couvaison[] }>('couvaisons_list', {}),
    ])
    setClients(clientsRes.clients)
    setCouvaisons(couvRes.couvaisons)

    addLog('CRÉATION', 'Couvaison', `Réception de ${couv.nombreOeufs} œufs (${couv.typeOeuf}) pour ${clientInfos.nom}.`)
  }

  const addCouvaisonsBatch = async (
    lines: Omit<Couvaison, 'id' | 'clientId'>[],
    clientInfos: Omit<Client, 'id'>,
  ) => {
    const valid = lines.filter((l) => l.nombreOeufs > 0);
    if (valid.length === 0) {
      throw new Error('Ajoutez au moins un lot avec une quantité > 0.')
    }
    for (const couv of valid) {
      const res = await callInsforgeFunction<{ couvaison: Couvaison }>('couvaison_create', {
        couv,
        clientInfos,
      })
      if (!res.couvaison) {
        throw new Error('Echec de création côté backend (couvaison_create).')
      }
    }
    const [clientsRes, couvRes] = await Promise.all([
      callInsforgeFunction<{ clients: Client[] }>('clients_list', {}),
      callInsforgeFunction<{ couvaisons: Couvaison[] }>('couvaisons_list', {}),
    ])
    setClients(clientsRes.clients)
    setCouvaisons(couvRes.couvaisons)
    const summary = valid.map((c) => `${c.nombreOeufs} ${c.typeOeuf}`).join(', ')
    addLog('CRÉATION', 'Couvaison', `Réception multiple (${valid.length} lot(s)): ${summary} pour ${clientInfos.nom}.`)
  }

  const updateCouvaison = async (id: string, updates: Partial<Couvaison>) => {
    const before = couvaisons.find(c => c.id === id)
    const res = await callInsforgeFunction<{ couvaison: Couvaison }>('couvaison_update', {
      id,
      updates,
    })

    if (!res.couvaison) {
      throw new Error('Echec de mise à jour côté backend (couvaison_update).')
    }

    setCouvaisons(prev => prev.map(c => (c.id === id ? res.couvaison : c)))
    const changes: string[] = []
    if (updates.statut && updates.statut !== before?.statut) changes.push(`statut ${before?.statut ?? '-'} -> ${updates.statut}`)
    if (updates.dateMiseEnMachine) changes.push('mise en machine enregistrée')
    if (updates.oeufsClairs !== undefined || updates.oeufsPourris !== undefined) changes.push('résultat mirage enregistré')
    if (updates.dateEclosionDemarrage) changes.push(`démarrage éclosion (${updates.nomDepart ?? 'nom départ non précisé'})`)
    if (updates.poussinsNes !== undefined || updates.mortsEnCoque !== undefined) changes.push('bilan éclosion enregistré')
    if (updates.emplacements) changes.push('assignation casiers mise à jour')
    const details = changes.length > 0 ? changes.join(', ') : 'mise à jour des données du lot'
    addLog('MODIFICATION', 'Couvaison', `Lot ID...${id.slice(-4)}: ${details}`)
  }

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

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    const res = await callInsforgeFunction<{ transaction: Transaction }>('transaction_create', transaction)

    if (!res.transaction) {
      throw new Error('Echec de création côté backend (transaction_create).')
    }

    setTransactions(prev => [...prev, res.transaction])
    addLog('CRÉATION', 'Facture', `${transaction.typeTransaction} de ${transaction.montantTotal} F (Saisie comptable).`)
  }

  const addMachine = async (machine: Omit<Machine, 'id'>) => {
    await callInsforgeFunction('machine_create', machine)
    const machinesRes = await callInsforgeFunction<{ machines: Machine[] }>('machines_list', {})
    setMachines(machinesRes.machines)
    addLog('CRÉATION', 'Machine', `Ajout de la machine de production: ${machine.nom}.`)
  }

  const updateMachine = async (id: string, updates: Partial<Machine>) => {
    await callInsforgeFunction('machine_update', { id, updates })
    const machinesRes = await callInsforgeFunction<{ machines: Machine[] }>('machines_list', {})
    setMachines(machinesRes.machines)
    const text = updates.enService !== undefined ? `Etat de machine changé` : `Paramétrage machine modifié`
    addLog('MODIFICATION', 'Machine', `${text} (ID...${id.slice(-4)}).`)
  }

  const deleteMachine = async (id: string) => {
    try {
      await callInsforgeFunction('machine_delete', { id })
      const machinesRes = await callInsforgeFunction<{ machines: Machine[] }>('machines_list', {})
      setMachines(machinesRes.machines)
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

  const addClientMessage = async (message: Omit<ClientMessage, 'id' | 'sentAt'> & { sentAt?: string }) => {
    const payload = {
      ...message,
      sentAt: message.sentAt ?? new Date().toISOString(),
    }
    const res = await callInsforgeFunction<{ message: ClientMessage }>('client_message_create', payload)
    if (!res.message) {
      throw new Error('Echec de création message client côté backend')
    }
    setClientMessages(prev => [res.message, ...prev].slice(0, 1000))
  }

  return (
    <AppContext.Provider
      value={{
        logs,
        receiptArchives,
        clientMessages,
        clients,
        couvaisons,
        transactions,
        machines,
        addCouvaison,
        addCouvaisonsBatch,
        updateCouvaison,
        deleteCouvaison,
        addTransaction,
        addMachine,
        updateMachine,
        deleteMachine,
        addReceiptArchive,
        addClientMessage,
        addLog,
      }}
    >
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
