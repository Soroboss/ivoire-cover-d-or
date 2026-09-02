import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../../context/AppProvider';
import { format, addDays, parseISO } from 'date-fns';
import { formatWhatsAppMessage, openWhatsApp } from '../../lib/whatsappTemplates';
import { OEUF_CONFIG } from '../../types';
import type { TypeOeuf } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { receptionDateInputToIso } from '../../lib/couvaisonPlanning';
import { normalizeTelephone } from '../../lib/phoneNormalize';
import { getClientGlobalBalance } from '../../lib/financeCalculations';
import { AlertCircle, CreditCard, Wallet, Calculator, Edit2 } from 'lucide-react';
import { ClientEditModal } from '../clients/ClientEditModal';


type LotLine = {
  id: string;
  typeOeuf: TypeOeuf;
  nombreOeufs: number;
  prixUnitaire: number;
};

const emptyLine = (): LotLine => ({
  id: uuidv4(),
  typeOeuf: 'Poule',
  nombreOeufs: 0,
  prixUnitaire: OEUF_CONFIG.Poule.prix,
});

export const CouvaisonForm = ({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) => {
  const { addCouvaisonsBatch, clients, transactions, couvaisons, messageTemplates, addClientMessage, clientSummaries } = useAppContext();
  const { currentUser } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  

  const [clientNom, setClientNom] = useState('');
  const [clientTel, setClientTel] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [lines, setLines] = useState<LotLine[]>(() => [emptyLine()]);
  const [dateReception, setDateReception] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [acompte, setAcompte] = useState<number>(0);
  const [remise, setRemise] = useState<number>(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const matchingClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return [];
    return clients
      .filter((c) => {
        const nom = c.nom.toLowerCase();
        const tel = normalizeTelephone(c.telephone);
        const qTel = normalizeTelephone(q);
        return nom.includes(q) || tel.includes(qTel);
      })
      .slice(0, 8);
  }, [clientSearch, clients]);

  const registeredClient = useMemo(() => {
    const normalizedInput = normalizeTelephone(clientTel);
    if (!normalizedInput) return null;
    return clients.find((c) => normalizeTelephone(c.telephone) === normalizedInput);
  }, [clientTel, clients]);

  useEffect(() => {
    if (registeredClient && selectedClientId !== registeredClient.id) {
      setSelectedClientId(registeredClient.id);
      setClientNom(registeredClient.nom);
    } else if (!registeredClient && selectedClientId !== null) {
      setSelectedClientId(null);
    }
  }, [registeredClient, selectedClientId]);

  const isClientRegistered = !!registeredClient;

  const currentBalance = useMemo(() => {
    if (!selectedClientId) return 0;
    return getClientGlobalBalance(transactions, couvaisons, selectedClientId, clientSummaries);
  }, [selectedClientId, transactions, couvaisons, clientSummaries]);


  const handleSelectClient = (c: {id: string, nom: string, telephone: string}) => {
    setClientNom(c.nom);
    setClientTel(c.telephone);
    setClientSearch(`${c.nom} - ${c.telephone}`);
    setSelectedClientId(c.id);
  };

  const updateLine = (id: string, patch: Partial<LotLine>) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const next = { ...l, ...patch };
        if (patch.typeOeuf !== undefined) {
          next.prixUnitaire = OEUF_CONFIG[patch.typeOeuf].prix;
        }
        return next;
      }),
    );
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (id: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  };

  const totalOeufs = useMemo(() => lines.reduce((s, l) => s + (l.nombreOeufs > 0 ? l.nombreOeufs : 0), 0), [lines]);
  const totalBrut = useMemo(() => lines.reduce((s, l) => s + (l.nombreOeufs > 0 ? l.nombreOeufs * l.prixUnitaire : 0), 0), [lines]);
  const netAPayer = useMemo(() => Math.max(0, totalBrut - (remise || 0) + currentBalance), [totalBrut, remise, currentBalance]);
  const validLines = useMemo(() => lines.filter((l) => l.nombreOeufs > 0), [lines]);

  const handleWhatsAppReception = (batchLines: Omit<LotLine, 'id'>[], totalBrut: number, acompte: number, balance: number) => {
    const lotSummary = batchLines.map(l => `- ${l.nombreOeufs} ${l.typeOeuf}s (Total: ${l.nombreOeufs * l.prixUnitaire} F)`).join('\n');
    
    // On cherche le template
    const template = messageTemplates.find(t => t.name === 'Accusé de Réception' && t.isActive !== false)
      || messageTemplates.find(t => t.category === 'RECEPTION' && t.isActive !== false)
      || { content: `📝 *CONFIRMATION DE RÉCEPTION - IVOIRE COUVÉE D'OR* 📝\n\n` +
          `Cher(e) *{{client_name}}*,\n\n` +
          `Nous avons le plaisir de vous confirmer la mise en incubation de votre lot :\n\n` +
          `📅 *Dépôt le* : {{date_reception}}\n` +
          `📦 *Détail des lots* :\n{{details_lots}}\n\n` +
          `📊 *SUIVI FINANCIER* :\n` +
          `- Montant du lot : {{montant_total}} F\n` +
          `{{note_antecedents}}` +
          `- Acompte versé : {{acompte}} F\n` +
          `🚩 *Reste à régler : {{reste_a_payer}} F*\n\n` +
          `🕒 *PROCHAINES ÉTAPES* :\n` +
          `🔍 Mirage technique : environ le {{date_mirage}} (vérification de la fertilité).\n` +
          `🐣 Éclosion finale prévue : environ le {{date_eclosion}}.\n\n` +
          `_Veuillez conserver ce message comme preuve de dépôt. Merci de confier vos projets à l'expertise d'Ivoire Couvée d'Or !_\n\n` +
          `🆘 Besoin d'aide ? Contactez-nous au : +225 01 03 03 64 62.` };

    const startIso = receptionDateInputToIso(dateReception);
    const startDate = parseISO(startIso);
    const mirageDateObj = addDays(startDate, 14);
    
    // Estimation d'éclosion basée sur le cycle le plus long des lots déposés
    const primaryLot = batchLines[0];
    const maxDays = Math.max(...batchLines.map(l => OEUF_CONFIG[l.typeOeuf]?.jours || 21));
    const eclosionDateObj = addDays(startDate, maxDays);

    const msg = formatWhatsAppMessage(template as any, {
      client: { nom: clientNom, telephone: clientTel } as any,
      couvaisons, couvaison: { dateReception: startIso } as any,
      transactions,
      clientSummaries,
      extra: {
        type_oeuf: batchLines.length > 1 ? 'Multiples' : (primaryLot?.typeOeuf || ''),
        quantite: batchLines.reduce((sum, l) => sum + (l.nombreOeufs || 0), 0),
        details_lots: lotSummary,
        detail_lot: lotSummary,
        date_mise_en_machine: 'À définir',
        date_mirage: format(mirageDateObj, 'dd/MM/yyyy'),
        date_eclosion: format(eclosionDateObj, 'dd/MM/yyyy'),
        montant_total: (totalBrut - (remise || 0)).toLocaleString(),
        montant_lot: (totalBrut - (remise || 0)).toLocaleString(),
        note_antecedents: currentBalance > 0 
          ? `- Arriérés précédents : ${currentBalance.toLocaleString()} F\n` 
          : '',
        acompte: acompte.toLocaleString(),
        accompte: acompte.toLocaleString(),
        reste_a_payer: balance.toLocaleString()
      }
    });

    // Logging the message in history if client is known or newly created
    if (clientNom && clientTel) {
      addClientMessage({
        clientId: selectedClientId || 'new',
        canal: 'WhatsApp',
        statut: 'Envoye',
        template: 'Accusé de Réception',
        message: msg,
        sentByUserId: currentUser?.id,
        sentByName: currentUser?.nom,
      }).catch(console.error);
    }

    openWhatsApp(clientTel, msg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNom || !clientTel || validLines.length === 0) return;

    try {
      const batchData = validLines.map((l) => ({
        typeOeuf: l.typeOeuf,
        nombreOeufs: l.nombreOeufs,
        prixUnitaire: l.prixUnitaire,
        dateReception: receptionDateInputToIso(dateReception),
        statut: 'En attente' as const,
        emplacements: [],
      }));

      await addCouvaisonsBatch(
        batchData,
        {
          nom: clientNom,
          telephone: clientTel,
        },
        acompte,
        remise
      );

      // On propose l'envoi WhatsApp si souhaité
      const confirmMsg = window.confirm("Réception enregistrée ! Voulez-vous envoyer le bordereau de réception par WhatsApp au client ?");
      if (confirmMsg) {
        handleWhatsAppReception(batchData, totalBrut - remise, acompte, netAPayer - acompte);
      }

      onSuccess();
    } catch (err) {
      alert((err as Error).message || 'Erreur lors de la création de la réception');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray">
      <button 
        onClick={onCancel}
        className="flex items-center gap-2 text-brand-orange hover:text-brand-hover font-semibold mb-4 transition-colors"
      >
        <ArrowLeft size={18} />
        <span>Retour à la liste</span>
      </button>
      <h2 className="text-xl font-bold text-brand-dark mb-2">Réception de lots (bordereau)</h2>
      <p className="text-sm text-brand-muted mb-6">
        Un seul client et une date de réception : ajoutez <strong>plusieurs lignes</strong> (poules, pintades, cailles…)
        sans resaisir le client.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-brand-gray border-b pb-2">Informations client</h3>
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">
                Recherche client existant (optionnel)
              </label>
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Nom ou téléphone..."
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all"
              />
              {matchingClients.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-md overflow-hidden max-h-44 overflow-y-auto">
                  {matchingClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectClient(c)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-brand-lightgray/50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <span className="font-medium text-brand-dark">{c.nom}</span>
                      <span className="ml-2 text-brand-muted">{c.telephone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Nom du client</label>
              <input
                required
                type="text"
                value={clientNom}
                onChange={(e) => setClientNom(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Téléphone WhatsApp (+225…)</label>
              <input
                required
                type="text"
                value={clientTel}
                onChange={(e) => setClientTel(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all"
              />
              <div className="flex items-center justify-between mt-1">
                <p className={`text-xs ${isClientRegistered ? 'text-green-700 font-bold' : 'text-brand-muted'}`}>
                  {isClientRegistered
                    ? 'Client existant détecté.'
                    : 'Nouveau client : il sera créé à l’enregistrement.'}
                </p>
                {isClientRegistered && selectedClientId && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-orange hover:bg-brand-orange/10 px-2 py-1 rounded transition-all border border-brand-orange/20"
                    >
                      <Edit2 size={10} /> Modifier info/n°
                    </button>
                    {clients.find(c => c.id === selectedClientId) && (
                      <ClientEditModal
                        client={clients.find(c => c.id === selectedClientId)!}
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSuccess={(updated) => {
                          setClientNom(updated.nom);
                          setClientTel(updated.telephone);
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
            {isClientRegistered && (
              <div className={`p-4 rounded-lg border transition-all ${currentBalance > 0 ? 'bg-red-50 border-red-200' : currentBalance < 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${currentBalance > 0 ? 'text-red-500' : currentBalance < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                    {currentBalance > 0 ? <AlertCircle size={20} /> : <Wallet size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-dark">Situation financière</h4>
                    <p className={`text-lg font-black ${currentBalance > 0 ? 'text-red-600' : currentBalance < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      {currentBalance === 0 ? 'Solde à jour' : 
                       currentBalance > 0 ? `Dette : ${currentBalance.toLocaleString()} F` : 
                       `Avoir : ${Math.abs(currentBalance).toLocaleString()} F`}
                    </p>
                    {currentBalance > 0 && (
                       <p className="text-xs text-red-500 mt-1">Le client doit régler ses arriérés.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-brand-gray border-b pb-2 flex items-center gap-2">
              <Calculator size={18} />
              Résumé Financier & Paiement
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Date de réception</label>
              <input
                type="date"
                value={dateReception}
                onChange={(e) => setDateReception(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none"
              />
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                 <span className="text-sm font-medium text-slate-500">Total Brut (nouveaux lots)</span>
                 <span className="text-lg font-bold text-brand-dark">{totalBrut.toLocaleString()} F</span>
              </div>
              
              {isClientRegistered && currentBalance !== 0 && (
                <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 mt-2">
                   <span className="text-sm font-medium text-slate-500">
                     Situation financière ({currentBalance > 0 ? 'Dette' : 'Avoir'})
                   </span>
                   <span className={`text-sm font-bold ${currentBalance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                     {currentBalance > 0 ? '+' : '-'} {Math.abs(currentBalance).toLocaleString()} F
                   </span>
                </div>
              )}
              
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 mt-2">
                 <span className="text-sm font-medium text-slate-500">Remise (FCFA)</span>
                 <input
                   type="number"
                   min="0"
                   value={remise || ''}
                   onChange={(e) => setRemise(parseInt(e.target.value, 10) || 0)}
                   className="w-24 rounded-md border border-gray-300 p-1 text-right focus:ring-2 focus:ring-brand-orange outline-none font-bold text-brand-dark"
                   placeholder="0"
                 />
              </div>
              
              <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-2">
                 <span className="text-sm font-black text-brand-dark uppercase">Net à payer</span>
                 <span className="text-xl font-black text-brand-orange">{netAPayer.toLocaleString()} F</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-brand-orange/20 shadow-sm">
               <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-brand-dark flex items-center gap-2">
                    <CreditCard size={18} className="text-brand-orange" />
                    Montant versé ce jour
                  </label>
               </div>
               <input
                 type="number"
                 min="0"
                 value={acompte || ''}
                 onChange={(e) => setAcompte(parseInt(e.target.value, 10) || 0)}
                 placeholder="Ex: 5000"
                 className="w-full rounded-lg border border-gray-300 p-3 text-lg focus:ring-2 focus:ring-green-500 outline-none font-black text-green-700 bg-gray-50 text-right transition-all"
               />
               <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                 <span className="text-xs text-brand-muted font-medium">Reste après versement :</span>
                 <span className="font-bold text-sm text-brand-dark">
                   {Math.max(0, netAPayer - (acompte || 0)).toLocaleString()} F
                 </span>
               </div>
               <p className="text-[10px] text-brand-muted leading-tight italic mt-2">
                  La mise en machine se fait à l’étape suivante pour chaque lot.
               </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-2">
            <h3 className="font-semibold text-brand-gray">Détail des lots (plusieurs types)</h3>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-orange hover:underline"
            >
              <Plus size={16} /> Ajouter un type d&apos;œufs
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-brand-lightgray">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-50 text-brand-gray font-semibold">
                <tr>
                  <th className="px-3 py-2 text-left">Type d&apos;œuf</th>
                  <th className="px-3 py-2 text-right">Quantité</th>
                  <th className="px-3 py-2 text-right">Prix unitaire (FCFA)</th>
                  <th className="px-3 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-lightgray">
                {lines.map((line) => (
                  <tr key={line.id} className="bg-white">
                    <td className="px-3 py-2">
                      <select
                        value={line.typeOeuf}
                        onChange={(e) => updateLine(line.id, { typeOeuf: e.target.value as TypeOeuf })}
                        className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none"
                      >
                        {Object.keys(OEUF_CONFIG).map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={line.nombreOeufs || ''}
                        onChange={(e) =>
                          updateLine(line.id, {
                            nombreOeufs: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full rounded-md border border-gray-300 p-2 text-right focus:ring-2 focus:ring-brand-orange outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={line.prixUnitaire}
                        onChange={(e) =>
                          updateLine(line.id, { prixUnitaire: parseInt(e.target.value, 10) || 0 })
                        }
                        className="w-full rounded-md border border-gray-300 p-2 text-right focus:ring-2 focus:ring-brand-orange outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length <= 1}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Retirer cette ligne"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-brand-muted">
            <strong>{validLines.length}</strong> lot(s) avec quantité &gt; 0 · <strong>{totalOeufs}</strong> œufs au total
          </p>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-brand-lightgray">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-brand-gray rounded-md hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!clientNom || !clientTel || validLines.length === 0}
            className="px-6 py-2 bg-brand-orange text-white font-medium rounded-md hover:bg-brand-hover shadow-sm transition-colors disabled:opacity-50"
          >
            Émettre le bordereau ({validLines.length} lot{validLines.length > 1 ? 's' : ''})
          </button>
        </div>
      </form>
    </div>
  );
};
