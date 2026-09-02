import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppProvider';
import { useAuth } from '../../context/AuthContext';
import type { Client, Machine, Casier } from '../../types';
import { format } from 'date-fns';
import { resteLot, getClientGlobalBalance } from '../../lib/financeCalculations';

import { formatWhatsAppMessage, openWhatsApp } from '../../lib/whatsappTemplates';

const EclosionStartForm = ({
  couvaisonId,
  onCancel,
  onSuccess,
}: {
  couvaisonId: string;
  onCancel: () => void;
  onSuccess: () => void;
}) => {
  const { couvaisons, clients, machines, transactions, updateCouvaison, addClientMessage, messageTemplates, clientSummaries } = useAppContext();
  const { currentUser } = useAuth();

  const couv = useMemo(
    () => couvaisons.find(c => c.id === couvaisonId) || null,
    [couvaisons, couvaisonId],
  );
  const client = useMemo(
    () => clients.find((cl: Client) => cl.id === couv?.clientId) || null,
    [clients, couv],
  );

  const canStart = currentUser?.role === 'Admin' || currentUser?.role === 'Technicien' || currentUser?.role === 'Réception/Caisse';
  const [nomDepart, setNomDepart] = useState('');
  const startedDate = useMemo(() => new Date(), []);

  const [emplacements, setEmplacements] = useState<{ machineId: string, casierId: string, quantite: number }[]>(
    couv?.emplacements && couv.emplacements.length > 0
      ? couv.emplacements.map(x => ({ ...x }))
      : [{ machineId: '', casierId: '', quantite: couv?.nombreOeufs || 0 }]
  );

  const getCasierOccupation = (machineId: string, casierId: string) => {
    return couvaisons.reduce((sum, c) => {
      if (c.statut === 'En cours' && c.id !== couvaisonId) {
        const emps = c.emplacements?.filter(emp => emp.machineId === machineId && emp.casierId === casierId) || [];
        return sum + emps.reduce((acc, e) => acc + (Number(e.quantite) || 0), 0);
      }
      return sum;
    }, 0);
  };

  const updateEmplacement = (index: number, key: string, value: any) => {
    const newEmps = [...emplacements];
    newEmps[index] = { ...newEmps[index], [key]: value };
    if (key === 'machineId') newEmps[index].casierId = '';
    setEmplacements(newEmps);
  };

  const totalPlaque = emplacements.reduce((sum, emp) => sum + (Number(emp.quantite) || 0), 0);
  const oeufsViables = couv ? (couv.nombreOeufs - (couv.oeufsClairs || 0) - (couv.oeufsPourris || 0)) : 0;

  const whatsAppText = useMemo(() => {
    if (!couv || !client) return '';
    const resteSurCeLot = resteLot(transactions, couvaisonId, (couv.nombreOeufs || 0) * (couv.prixUnitaire || 0));
    const resteGlobal = getClientGlobalBalance(transactions, couvaisons, client.id, clientSummaries);
    const ancienneDette = resteGlobal - resteSurCeLot;

    const template = messageTemplates.find(t => t.name === 'Démarrage Éclosion' && t.isActive !== false)
      || messageTemplates.find(t => t.category === 'ECLOSION' && t.isActive !== false)
      || { content: `🚀 *DÉMARRAGE DE L'ÉCLOSION - IVOIRE COUVÉE D'OR*\n\n` +
          `Bonjour *{{client_name}}*,\n\n` +
          `🐣 Votre éclosion pour le Lot de *{{quantite}}* œufs de *{{type_oeuf}}s* a démarré, préparez-vous à venir récupérer vos poussins demain dans l'après-midi.\n\n` +
          `📅 *CALENDRIER TECHNIQUE* :\n` +
          `• 📥 Date de dépôt : {{date_reception}}\n` +
          `• 🔍 Jour de mirage : {{date_mirage}}\n` +
          `• 🐣 Démarrage éclosion : {{date_eclosion}}\n\n` +
          `📊 *INFOS TECHNIQUES* :\n` +
          `•  🧪 Lot : {{quantite}} {{type_oeuf}}s\n` +
          `•  ✅ Œufs viables en éclosion : *{{viables}}*\n` +
          `•  🏷️ Identifiant : {{nom_depart}}\n\n` +
          `💰 *SITUATION FINANCIÈRE* :\n` +
          `•  Reste à payer (ce lot) : {{reste_a_payer}}\n` +
          `🚩 *TOTAL GLOBAL À RÉGLER : {{total_global}}*\n\n` +
          `{{instruction_paiement}}\n\n` +
          `Merci de votre confiance !\nL'équipe Ivoire Couvée d'Or.\n` +
          `📞 Service client : +225 01 03 03 64 62` };

    return formatWhatsAppMessage(template as any, {
      client,
      couvaisons, couvaison: { ...couv },
      transactions,
      clientSummaries,
      extra: {
        nom_depart: nomDepart || '-',
        viables: oeufsViables,
        dettes_anterieures: ancienneDette > 0 ? `- Dettes antérieures : ${ancienneDette.toLocaleString()} F` : '',
        total_global: resteGlobal.toLocaleString() + ' F'
      }
    });
  }, [client, couv, couvaisonId, transactions, couvaisons, messageTemplates, nomDepart, oeufsViables]);


  if (!couv) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomDepart.trim()) {
      alert('Veuillez saisir le nom de départ.');
      return;
    }
    try {
      await updateCouvaison(couvaisonId, {
        nomDepart: nomDepart.trim(),
        dateEclosionDemarrage: startedDate.toISOString(),
        emplacements: emplacements.filter(e => e.machineId && e.casierId && e.quantite > 0),
      });
      if (client?.id) {
        try {
          await addClientMessage({
            clientId: client.id,
            couvaisonId: couv.id,
            canal: 'WhatsApp',
            statut: 'Envoye',
            template: 'demarrage_eclosion',
            message: whatsAppText,
            sentByUserId: currentUser?.id,
            sentByName: currentUser?.nom,
          });
        } catch {
          // no-op: si le log échoue on laisse quand même l'utilisateur poursuivre
        }
      }
      if (client?.telephone && whatsAppText) {
        openWhatsApp(client.telephone, whatsAppText);
      }
      onSuccess();
    } catch (err) {
      alert((err as Error).message || 'Erreur lors de l’enregistrement du démarrage.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray max-w-xl mx-auto mt-4">
      <h2 className="text-xl font-bold text-brand-dark mb-2">Démarrer l'éclosion</h2>
      <p className="text-sm text-brand-muted mb-6">
        Lot: {couv.nombreOeufs} {couv.typeOeuf}s
      </p>

      {!canStart && (
        <div className="mb-4 p-3 bg-amber-50 text-amber-800 text-sm rounded-md border border-amber-200">
          Vous n'avez pas le droit de démarrer l'éclosion.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
           <h3 className="font-semibold text-blue-900 mb-3 text-sm uppercase tracking-wider">Transfert en tiroirs d'éclosion</h3>
           <div className="space-y-3">
              {emplacements.map((emp, idx) => {
                const machineSelected = machines.find(m => m.id === emp.machineId);
                return (
                  <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-2">
                     <select required value={emp.machineId} onChange={e => updateEmplacement(idx, 'machineId', e.target.value)} className="flex-1 min-w-[120px] rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-brand-orange outline-none bg-white">
                        <option value="">-- Machine --</option>
                        {machines.filter((m: Machine) => m.enService).map((m: Machine) => (
                          <option key={m.id} value={m.id}>{m.nom} ({m.type})</option>
                        ))}
                     </select>
                     <select required value={emp.casierId} onChange={e => updateEmplacement(idx, 'casierId', e.target.value)} disabled={!machineSelected} className="flex-1 min-w-[120px] rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-brand-orange outline-none bg-white">
                        <option value="">-- Tiroir Éclosion --</option>
                        {machineSelected?.casiers?.map((c: Casier) => {
                          const occ = getCasierOccupation(machineSelected.id, c.id);
                          const dispo = c.capacite - occ;
                          const affecteIci = emplacements.filter((e, i) => i !== idx && e.machineId === machineSelected.id && e.casierId === c.id).reduce((s, e) => s + (Number(e.quantite) || 0), 0);
                          const dispoReelle = dispo - affecteIci;
                          return <option key={c.id} value={c.id} disabled={dispoReelle <= 0}>{c.nom} (Dispo: {dispoReelle}/{c.capacite})</option>
                        })}
                     </select>
                     <input required type="number" min="1" max={oeufsViables} placeholder="Qté" value={emp.quantite} onChange={e => updateEmplacement(idx, 'quantite', parseInt(e.target.value))} className="w-20 rounded-md border border-gray-300 p-2 text-sm text-center focus:ring-2 focus:ring-brand-orange outline-none" />
                     {idx > 0 && (
                       <button type="button" onClick={() => setEmplacements(emplacements.filter((_, i) => i !== idx))} className="px-2 py-1 text-red-500 font-bold">✕</button>
                     )}
                  </div>
                )
              })}
           </div>
           <button type="button" onClick={() => setEmplacements([...emplacements, { machineId: '', casierId: '', quantite: 0 }])} className="mt-2 text-xs text-blue-700 font-medium hover:underline">
              + Ajouter un autre tiroir
           </button>
           <div className="mt-2 text-xs font-bold text-right">
              Total assigné : <span className={totalPlaque !== oeufsViables ? 'text-red-500' : 'text-green-600'}>{totalPlaque} / {oeufsViables}</span>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-muted mb-1">Nom de départ / Batch</label>
            <input
              required
              type="text"
              placeholder="Ex: Batch A - Matin"
              value={nomDepart}
              onChange={(e) => setNomDepart(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none"
              disabled={!canStart}
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
          <p className="font-semibold text-brand-dark mb-1">Message WhatsApp (au démarrage)</p>
          <p className="text-brand-muted whitespace-pre-wrap leading-relaxed">{whatsAppText}</p>
          <p className="text-xs text-brand-muted mt-2">
            Date enregistrée: {format(startedDate, 'dd/MM/yyyy HH:mm')}
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-2 border-t border-brand-lightgray">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 text-brand-gray rounded-md hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          {client?.telephone && (
            <button
              type="button"
              onClick={() => openWhatsApp(client.telephone, whatsAppText)}
              className="px-4 py-2 bg-yellow-50 text-yellow-700 font-medium rounded-md hover:bg-yellow-100 transition-colors inline-flex items-center justify-center"
              title="Ouvrir WhatsApp avec le message pré-rempli"
            >
              Envoyer WhatsApp
            </button>
          )}
          <button
            type="submit"
            disabled={!canStart || !nomDepart.trim() || totalPlaque !== oeufsViables}
            className="px-4 py-2 bg-brand-orange text-white font-medium rounded-md hover:bg-brand-hover shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enregistrer démarrage
          </button>
        </div>
      </form>
    </div>
  );
};

export default EclosionStartForm;

