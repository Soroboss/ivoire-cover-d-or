/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type {
  Client,
  Couvaison,
  Transaction,
  Machine,
  AuditLog,
  ReceiptArchive,
  ClientMessage,
  Depense,
  SalarieAgent,
  ClientFinancialSummary,
  MessageTemplate,
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { callBackendFunction } from '../lib/insforgeApi';
import { getClientGlobalBalance } from '../lib/financeCalculations';

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

interface AppState {
  clients: Client[];
  couvaisons: Couvaison[];
  transactions: Transaction[];
  machines: Machine[];
  logs: AuditLog[];
  receiptArchives: ReceiptArchive[];
  clientMessages: ClientMessage[];
  depenses: Depense[];
  clientSummaries: ClientFinancialSummary[];
  messageTemplates: MessageTemplate[];
  addCouvaison: (couv: Omit<Couvaison, 'id' | 'clientId'>, clientInfos: Omit<Client, 'id'>) => Promise<void>;
  /** Plusieurs lots (types d’œufs différents) pour une même réception client — une synchro API à la fin */
  addCouvaisonsBatch: (
    lines: Omit<Couvaison, 'id' | 'clientId'>[],
    clientInfos: Omit<Client, 'id'>,
    acompte?: number,
    remise?: number,
  ) => Promise<void>;
  updateCouvaison: (id: string, updates: Partial<Couvaison>) => Promise<void>;
  deleteCouvaison: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  addMachine: (machine: Omit<Machine, 'id'>) => Promise<void>;
  updateMachine: (id: string, updates: Partial<Machine>) => Promise<void>;
  deleteMachine: (id: string) => Promise<void>;
  addReceiptArchive: (archive: Omit<ReceiptArchive, 'id' | 'createdAt'>) => Promise<void>;
  addClientMessage: (message: Omit<ClientMessage, 'id' | 'sentAt'> & { sentAt?: string }) => Promise<void>;
  addDepense: (d: Omit<Depense, 'id' | 'createdAt'>) => Promise<void>;
  updateDepense: (id: string, updates: Partial<Omit<Depense, 'id' | 'createdAt'>>) => Promise<void>;
  deleteDepense: (id: string) => Promise<void>;
  salaireAgents: SalarieAgent[];
  addSalaireAgent: (a: Omit<SalarieAgent, 'id' | 'createdAt'>) => Promise<void>;
  updateSalaireAgent: (id: string, updates: Partial<Omit<SalarieAgent, 'id' | 'createdAt'>>) => Promise<void>;
  deleteSalaireAgent: (id: string) => Promise<void>;
  addMessageTemplate: (t: Omit<MessageTemplate, 'id' | 'updatedAt'>) => Promise<void>;
  updateMessageTemplate: (id: string, updates: Partial<MessageTemplate>) => Promise<void>;
  deleteMessageTemplate: (id: string) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  addLog: (action: AuditLog['action'], target: string, details: string, targetId?: string, metadata?: Record<string, any>) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  
  const [logs, setLogs] = useState<AuditLog[]>(() => loadFromStorage('ivoire_logs', []));
  const [receiptArchives, setReceiptArchives] = useState<ReceiptArchive[]>(() => loadFromStorage('ivoire_receipt_archives', []));
  const [clientMessages, setClientMessages] = useState<ClientMessage[]>(() => loadFromStorage('ivoire_client_messages', []));

  const [clients, setClients] = useState<Client[]>(() => loadFromStorage('ivoire_clients', []));
  
  const [couvaisons, setCouvaisons] = useState<Couvaison[]>(() => loadFromStorage('ivoire_couvaisons', []));

  const [transactions, setTransactions] = useState<Transaction[]>(() => loadFromStorage('ivoire_transactions', []));

  const [machines, setMachines] = useState<Machine[]>(() => loadFromStorage('ivoire_machines', []));

  const [depenses, setDepenses] = useState<Depense[]>(() => loadFromStorage('ivoire_depenses', []));

  const [salaireAgents, setSalaireAgents] = useState<SalarieAgent[]>(() => loadFromStorage('ivoire_salaire_agents', []));
  const [clientSummaries, setClientSummaries] = useState<ClientFinancialSummary[]>(() => loadFromStorage('ivoire_client_summaries', []));
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>(() => loadFromStorage('ivoire_message_templates', []));

  // Synchro des états dans le cache local
  useEffect(() => { saveToStorage('ivoire_clients', clients); }, [clients]);
  useEffect(() => { saveToStorage('ivoire_couvaisons', couvaisons); }, [couvaisons]);
  useEffect(() => { saveToStorage('ivoire_transactions', transactions); }, [transactions]);
  useEffect(() => { saveToStorage('ivoire_machines', machines); }, [machines]);
  useEffect(() => { saveToStorage('ivoire_logs', logs); }, [logs]);
  useEffect(() => { saveToStorage('ivoire_receipt_archives', receiptArchives); }, [receiptArchives]);
  useEffect(() => { saveToStorage('ivoire_client_messages', clientMessages); }, [clientMessages]);
  useEffect(() => { saveToStorage('ivoire_depenses', depenses); }, [depenses]);
  useEffect(() => { saveToStorage('ivoire_salaire_agents', salaireAgents); }, [salaireAgents]);
  useEffect(() => { saveToStorage('ivoire_client_summaries', clientSummaries); }, [clientSummaries]);
  useEffect(() => { saveToStorage('ivoire_message_templates', messageTemplates); }, [messageTemplates]);

  const refreshSummaries = async () => {
    try {
      const res = await callBackendFunction<{ summaries: ClientFinancialSummary[] }>('client_financial_summary_list', {});
      if (res.summaries) setClientSummaries(res.summaries);
    } catch (e) {
      console.error('Erreur lors du rafraîchissement des résumés financiers:', e);
    }
  };

  // Charge les données depuis InsForge au démarrage et dès qu'un utilisateur se connecte
  useEffect(() => {
    if (!currentUser) return;

    (async () => {
      try {
        const res = await callBackendFunction<{
          clients?: Client[];
          couvaisons?: Couvaison[];
          machines?: Machine[];
          transactions?: Transaction[];
          logs?: AuditLog[];
          archives?: ReceiptArchive[];
          messages?: ClientMessage[];
          depenses?: Depense[];
          agents?: SalarieAgent[];
          templates?: MessageTemplate[];
          summaries?: ClientFinancialSummary[];
        }>('app_bootstrap_data', {});

        if (res.clients) setClients(res.clients);
        if (res.couvaisons) setCouvaisons(res.couvaisons);
        if (res.transactions) setTransactions(res.transactions);
        if (res.logs) setLogs(res.logs);
        if (res.archives) setReceiptArchives(res.archives);
        if (res.messages) setClientMessages(res.messages);
        if (res.depenses) setDepenses(res.depenses);
        if (res.agents) setSalaireAgents(res.agents);
        if (res.summaries) setClientSummaries(res.summaries);
        if (res.templates) setMessageTemplates(res.templates);
        if (res.machines) setMachines(res.machines);
      } catch (e) {
        console.error('Erreur lors du chargement des données:', e);
      }
    })();
  }, [currentUser?.id]);


  const addLog = (
    action: AuditLog['action'], 
    target: string, 
    details: string, 
    targetId?: string, 
    metadata?: Record<string, any>
  ) => {
    if (!currentUser) return;
    const newLog: AuditLog = {
      id: uuidv4(),
      userId: currentUser.id,
      userName: currentUser.nom,
      action,
      target,
      targetId,
      details,
      metadata,
      timestamp: new Date().toISOString()
    };
    // Keep only last 1000 logs to prevent memory leaks
    setLogs(prev => [newLog, ...prev].slice(0, 1000));

    // Persistance backend InsForge (non bloquante pour l'UX).
    void callBackendFunction('log_create', newLog).catch(() => undefined);
  };

  const addCouvaison = async (couv: Omit<Couvaison, 'id' | 'clientId'>, clientInfos: Omit<Client, 'id'>) => {
    const res = await callBackendFunction<{ couvaison: Couvaison }>('couvaison_create', {
      couv,
      clientInfos,
      idempotencyKey: uuidv4(),
    })

    if (!res.couvaison) {
      throw new Error('Echec de création côté backend (couvaison_create).')
    }

    // On resynchronise depuis le backend pour éviter toute divergence d'ID client.
    const [clientsRes, couvRes] = await Promise.all([
      callBackendFunction<{ clients: Client[] }>('clients_list', {}),
      callBackendFunction<{ couvaisons: Couvaison[] }>('couvaisons_list', {}),
    ])
    setClients(clientsRes.clients)
    setCouvaisons(couvRes.couvaisons)
    void refreshSummaries();

    addLog('CRÉATION', 'Couvaison', `Réception de ${couv.nombreOeufs} œufs (${couv.typeOeuf}) pour ${clientInfos.nom}.`)
  }

  const addCouvaisonsBatch = async (
    lines: Omit<Couvaison, 'id' | 'clientId'>[],
    clientInfos: Omit<Client, 'id'>,
    acompte?: number,
    remise?: number,
  ) => {
    const valid = lines.filter((l) => l.nombreOeufs > 0);
    if (valid.length === 0) {
      throw new Error('Ajoutez au moins un lot avec une quantité > 0.')
    }
    const createdLots: Couvaison[] = [];
    for (const couv of valid) {
      const res = await callBackendFunction<{ couvaison: Couvaison }>('couvaison_create', {
        couv,
        clientInfos,
        idempotencyKey: uuidv4(),
      })
      if (res.couvaison) {
        createdLots.push(res.couvaison);
      }
    }

    if (remise && remise > 0 && createdLots.length > 0) {
      // On applique la remise globale sur le premier lot
      await callBackendFunction('transaction_create', {
        couvaisonId: createdLots[0].id,
        clientId: createdLots[0].clientId,
        montantTotal: remise,
        dateTransaction: new Date().toISOString(),
        typeTransaction: 'Remise',
        notes: `Remise accordée lors de la réception`,
        idempotencyKey: uuidv4(),
      });
    }

    if (acompte && acompte > 0 && createdLots.length > 0) {
       const firstLot = createdLots[0] as Couvaison;
       let remaining = acompte;

       // 1. Solder les dettes passées s'il y en a
       const oldBalance = getClientGlobalBalance(transactions, couvaisons, firstLot.clientId, clientSummaries);
       if (oldBalance > 0) {
         const toPayOld = Math.min(remaining, oldBalance);
         await callBackendFunction('transaction_create', {
           couvaisonId: firstLot.id,
           clientId: firstLot.clientId,
           montantTotal: toPayOld,
           dateTransaction: new Date().toISOString(),
           typeTransaction: 'Paiement',
           notes: `Règlement dettes antérieures (pendant réception nouveaux lots)`,
           idempotencyKey: uuidv4(),
         });
         remaining -= toPayOld;
       }

       // 2. Répartir le reste sur les nouveaux lots créés
       if (remaining > 0) {
         for (let i = 0; i < createdLots.length; i++) {
           const lot = createdLots[i];
           const lotTotal = lot.nombreOeufs * lot.prixUnitaire;
           const val = i === createdLots.length - 1 ? remaining : Math.min(remaining, lotTotal);
           if (val > 0) {
             await callBackendFunction('transaction_create', {
               couvaisonId: lot.id,
               clientId: lot.clientId,
               montantTotal: val,
               dateTransaction: new Date().toISOString(),
               typeTransaction: 'Paiement',
               notes: `Acompte réception - Lot ${lot.typeOeuf}`,
               idempotencyKey: uuidv4(),
             });
             remaining -= val;
           }
         }
       }
    }
    const [clientsRes, couvRes] = await Promise.all([
      callBackendFunction<{ clients: Client[] }>('clients_list', {}),
      callBackendFunction<{ couvaisons: Couvaison[] }>('couvaisons_list', {}),
    ])
    setClients(clientsRes.clients)
    setCouvaisons(couvRes.couvaisons)
    void refreshSummaries();
    const summary = valid.map((c) => `${c.nombreOeufs} ${c.typeOeuf}`).join(', ')
    addLog('CRÉATION', 'Couvaison', `Réception multiple (${valid.length} lot(s)): ${summary} pour ${clientInfos.nom}.`)
  }

  const updateCouvaison = async (id: string, updates: Partial<Couvaison>) => {
    const before = couvaisons.find(c => c.id === id)
    const res = await callBackendFunction<{ couvaison: Couvaison }>('couvaison_update', {
      id,
      updates,
    })

    if (!res.couvaison) {
      throw new Error('Echec de mise à jour côté backend (couvaison_update).')
    }

    setCouvaisons(prev => prev.map(c => (c.id === id ? res.couvaison : c)))
    void refreshSummaries();
    const changes: string[] = []
    if (updates.statut && updates.statut !== before?.statut) changes.push(`statut ${before?.statut ?? '-'} -> ${updates.statut}`)
    if (updates.dateMiseEnMachine) changes.push('mise en machine enregistrée')
    if (updates.oeufsClairs !== undefined || updates.oeufsPourris !== undefined) changes.push('résultat mirage enregistré')
    if (updates.dateEclosionDemarrage) changes.push(`démarrage éclosion (${updates.nomDepart ?? 'nom départ non précisé'})`)
    if (updates.poussinsNes !== undefined || updates.mortsEnCoque !== undefined) changes.push('bilan éclosion enregistré')
    if (updates.emplacements) changes.push('assignation casiers mise à jour')
    const logDetails = changes.length > 0 ? changes.join(', ') : 'mise à jour des données du lot'
    addLog('MODIFICATION', 'Couvaison', `Lot ${res.couvaison.typeOeuf} (ID...${id.slice(-4)}): ${logDetails}`, id)
  }

  const deleteCouvaison = async (id: string) => {
    // Audit de sécurité business : on ne permet pas la suppression si des paiements existent déjà.
    const hasPayments = transactions.some(t => t.couvaisonId === id && t.typeTransaction === 'Paiement');
    if (hasPayments) {
      throw new Error("Impossible de supprimer ce lot : des paiements y sont déjà rattachés. Annulez les paiements ou le lot d'abord.");
    }

    try {
      await callBackendFunction<{ success: boolean }>('couvaison_delete', { id })

      // Met à jour l'état local pour refléter la suppression immédiatement.
      setCouvaisons(prev => prev.filter(c => c.id !== id))
      setTransactions(prev => prev.filter(t => t.couvaisonId !== id))

      addLog('SUPPRESSION', 'Couvaison', `Suppression du lot ID...${id.slice(-4)}.`)

      // Resynchronise depuis le backend pour rester cohérent.
      const [clientsRes, couvRes] = await Promise.all([
        callBackendFunction<{ clients: Client[] }>('clients_list', {}),
        callBackendFunction<{ couvaisons: Couvaison[] }>('couvaisons_list', {}),
      ])
      setClients(clientsRes.clients)
      setCouvaisons(couvRes.couvaisons)
      void refreshSummaries();
    } catch {
      // Si la suppression backend échoue, on ne modifie pas l'état.
      throw new Error('Echec de suppression côté backend')
    }
  }

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    const res = await callBackendFunction<{ transaction: Transaction }>('transaction_create', {
      ...transaction,
      idempotencyKey: uuidv4(),
    })

    if (!res.transaction) {
      throw new Error('Echec de création côté backend (transaction_create).')
    }

    setTransactions(prev => [...prev, res.transaction])
    void refreshSummaries();
    addLog('CRÉATION', 'Facture', `${transaction.typeTransaction} de ${transaction.montantTotal} F (Saisie comptable).`)
  }

  const addMachine = async (machine: Omit<Machine, 'id'>) => {
    await callBackendFunction('machine_create', machine)
    const machinesRes = await callBackendFunction<{ machines: Machine[] }>('machines_list', {})
    setMachines(machinesRes.machines)
    addLog('CRÉATION', 'Machine', `Ajout de la machine de production: ${machine.nom}.`)
  }

  const updateMachine = async (id: string, updates: Partial<Machine>) => {
    await callBackendFunction('machine_update', { id, updates })
    const machinesRes = await callBackendFunction<{ machines: Machine[] }>('machines_list', {})
    setMachines(machinesRes.machines)
    const text = updates.enService !== undefined ? `Etat de machine changé` : `Paramétrage machine modifié`
    addLog('MODIFICATION', 'Machine', `${text} (ID...${id.slice(-4)}).`)
  }

  const deleteMachine = async (id: string) => {
    try {
      await callBackendFunction('machine_delete', { id })
      const machinesRes = await callBackendFunction<{ machines: Machine[] }>('machines_list', {})
      setMachines(machinesRes.machines)
      addLog('SUPPRESSION', 'Machine', `Suppression de machine (ID...${id.slice(-4)}).`)
    } catch {
      throw new Error('Echec de suppression machine côté backend')
    }
  }

  const addReceiptArchive = async (archive: Omit<ReceiptArchive, 'id' | 'createdAt'>) => {
    try {
      const createdAt = new Date().toISOString()
      await callBackendFunction('receipt_archive_create', archive)
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
      idempotencyKey: uuidv4(),
    }
    const res = await callBackendFunction<{ message: ClientMessage }>('client_message_create', payload)
    if (!res.message) {
      throw new Error('Echec de création message client côté backend')
    }
    setClientMessages(prev => [res.message, ...prev].slice(0, 1000))
  }

  const addDepense = async (d: Omit<Depense, 'id' | 'createdAt'>) => {
    const res = await callBackendFunction<{ depense: Depense }>('depense_create', {
      ...d,
      idempotencyKey: uuidv4(),
    })
    if (!res.depense) {
      throw new Error('Echec de création dépense (depense_create).')
    }
    setDepenses(prev => [res.depense, ...prev])
    addLog('CRÉATION', 'Dépense', `${d.libelle} — ${d.montant.toLocaleString()} F (${d.categorie}).`)
  }

  const updateDepense = async (id: string, updates: Partial<Omit<Depense, 'id' | 'createdAt'>>) => {
    const res = await callBackendFunction<{ depense: Depense }>('depense_update', { id, updates })
    if (!res.depense) {
      throw new Error('Echec de mise à jour dépense (depense_update).')
    }
    setDepenses(prev => prev.map(x => (x.id === id ? res.depense : x)))
    addLog('MODIFICATION', 'Dépense', `Mise à jour ${res.depense.libelle} (ID…${id.slice(-4)}).`)
  }

  const deleteDepense = async (id: string) => {
    try {
      await callBackendFunction<{ success: boolean }>('depense_delete', { id })
      setDepenses(prev => prev.filter(d => d.id !== id))
      addLog('SUPPRESSION', 'Dépense', `Suppression dépense ID…${id.slice(-4)}.`)
    } catch {
      throw new Error('Echec de suppression dépense côté backend')
    }
  }

  const addSalaireAgent = async (a: Omit<SalarieAgent, 'id' | 'createdAt'>) => {
    const res = await callBackendFunction<{ agent: SalarieAgent }>('salaire_agent_create', {
      ...a,
      idempotencyKey: uuidv4(),
    })
    if (!res.agent) {
      throw new Error('Echec de création fiche salarié (salaire_agent_create).')
    }
    setSalaireAgents(prev => [...prev, res.agent].sort((x, y) => x.nom.localeCompare(y.nom, 'fr')))
    addLog('CRÉATION', 'Salarié', `Fiche ${a.nom} — salaire brut ${a.salaireMensuelBrut.toLocaleString()} F.`)
  }

  const updateSalaireAgent = async (id: string, updates: Partial<Omit<SalarieAgent, 'id' | 'createdAt'>>) => {
    const res = await callBackendFunction<{ agent: SalarieAgent }>('salaire_agent_update', { id, updates })
    if (!res.agent) {
      throw new Error('Echec de mise à jour fiche salarié (salaire_agent_update).')
    }
    setSalaireAgents(prev =>
      prev.map(x => (x.id === id ? res.agent : x)).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
    )
    addLog('MODIFICATION', 'Salarié', `Mise à jour fiche ${res.agent.nom} (ID…${id.slice(-4)}).`)
  }

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const res = await callBackendFunction<{ client: Client }>('client_update', { id, updates })
    if (!res.client) {
      throw new Error('Echec de mise à jour client côté backend (client_update).')
    }
    setClients(prev => prev.map(c => (c.id === id ? res.client : c)))
    addLog('MODIFICATION', 'Client', `Mise à jour des infos de ${res.client.nom} (ID…${id.slice(-4)}).`)
  }

  const deleteSalaireAgent = async (id: string) => {
    try {
      await callBackendFunction<{ success: boolean }>('salaire_agent_delete', { id })
      setSalaireAgents(prev => prev.filter(x => x.id !== id))
      addLog('SUPPRESSION', 'Salarié', `Suppression fiche salarié ID…${id.slice(-4)}.`)
    } catch {
      throw new Error('Echec de suppression fiche salarié côté backend')
    }
  }

  const addMessageTemplate = async (t: Omit<MessageTemplate, 'id' | 'updatedAt'>) => {
    const res = await callBackendFunction<{ template: MessageTemplate }>('message_template_create', {
      ...t,
      updatedAt: new Date().toISOString(),
    })
    if (res.template) {
      setMessageTemplates(prev => [...prev, res.template])
      addLog('CRÉATION', 'WhatsApp', `Nouveau template: ${t.name}.`)
    }
  }

  const updateMessageTemplate = async (id: string, updates: Partial<MessageTemplate>) => {
    const res = await callBackendFunction<{ template: MessageTemplate }>('message_template_update', {
      id,
      updates: { ...updates, updatedAt: new Date().toISOString() },
    })
    if (res.template) {
      setMessageTemplates(prev => prev.map(t => (t.id === id ? res.template : t)))
      addLog('MODIFICATION', 'WhatsApp', `Template mis à jour: ${res.template.name}.`)
    }
  }

  const deleteMessageTemplate = async (id: string) => {
    await callBackendFunction('message_template_delete', { id })
    setMessageTemplates(prev => prev.filter(t => t.id !== id))
    addLog('SUPPRESSION', 'WhatsApp', `Template supprimé (ID...${id.slice(-4)}).`)
  }

  const value = useMemo(() => ({
    logs,
    receiptArchives,
    clientMessages,
    depenses,
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
    addDepense,
    updateDepense,
    deleteDepense,
    salaireAgents,
    addSalaireAgent,
    updateSalaireAgent,
    deleteSalaireAgent,
    updateClient,
    addLog,
    clientSummaries,
    messageTemplates,
    addMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate,
  }), [
    logs,
    receiptArchives,
    clientMessages,
    depenses,
    clients,
    couvaisons,
    transactions,
    machines,
    salaireAgents,
    clientSummaries,
    messageTemplates
  ]);

  return (
    <AppContext.Provider value={value}>
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
