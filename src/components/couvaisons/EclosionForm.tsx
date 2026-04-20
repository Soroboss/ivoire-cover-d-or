import React, { useState } from 'react';
import { useAppContext } from '../../context/AppProvider';
import { useAuth } from '../../context/AuthContext';
import { resteLot, netPayeLot } from '../../lib/financeCalculations';
import { formatWhatsAppMessage, normalizePhoneForWhatsApp } from '../../lib/whatsappTemplates';

export const EclosionForm = ({ couvaisonId, onCancel, onSuccess }: { couvaisonId: string, onCancel: () => void, onSuccess: () => void }) => {
  const { couvaisons, clients, transactions, messageTemplates, updateCouvaison, deleteCouvaison, addClientMessage } = useAppContext();
  const { currentUser } = useAuth();
  const couv = couvaisons.find(c => c.id === couvaisonId);
  const client = clients.find(c => c.id === couv?.clientId);
  
  const [nes, setNes] = useState(couv?.poussinsNes || 0);
  const [morts, setMorts] = useState(couv?.mortsEnCoque || 0);
  const [cause, setCause] = useState<any>(couv?.causeEchecMajeure || 'Aucune');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const canDelete = currentUser?.role === 'Admin';

  const handleDelete = async () => {
    if (!couv) return;
    const ok = window.confirm("Supprimer ce lot ? Ceci efface la saisie associée.");
    if (!ok) return;
    try {
      await deleteCouvaison(couv.id);
      onCancel();
    } catch (e) {
      alert((e as Error).message || 'Erreur lors de la suppression');
    }
  };

  if (!couv) return null;

  const canFinalize = Boolean(couv.dateEclosionDemarrage && couv.nomDepart && couv.nomDepart.trim());
  if (!canFinalize) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray max-w-lg mx-auto mt-4">
        <h2 className="text-xl font-bold text-brand-dark mb-2">Clôturer l'éclosion</h2>
        <p className="text-sm text-brand-muted mb-4">
          Le démarrage de l'éclosion n'a pas encore été enregistré (nom de départ manquant).
          Veuillez d'abord cliquer sur <b>Démarrer l'éclosion</b>.
        </p>
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 text-brand-gray rounded-md hover:bg-gray-50 transition-colors">
          Retour
        </button>
      </div>
    );
  }

  const oeufsRestants = couv.nombreOeufs - (couv.oeufsClairs || 0) - (couv.oeufsPourris || 0);
  const prevNes = couv.poussinsNes || 0;
  const deltaNes = nes - prevNes;
  const nonEclos = oeufsRestants - nes - morts;

  const handlePartialSubmit = async () => {
    try {
      await updateCouvaison(couvaisonId, {
        poussinsNes: nes,
        mortsEnCoque: morts,
        causeEchecMajeure:
          (morts > 0 || nonEclos > 0) && cause !== 'Aucune' ? cause : couv.causeEchecMajeure,
      });

      if (deltaNes > 0 && sendWhatsApp && client?.telephone) {
        const totalDue = couv.nombreOeufs * couv.prixUnitaire;
        const netEncashed = netPayeLot(transactions, couvaisonId);
        const avoirs = transactions.filter(t => t.couvaisonId === couvaisonId && t.typeTransaction === 'Avoir').reduce((s,t) => s + t.montantTotal, 0);
        const remises = transactions.filter(t => t.couvaisonId === couvaisonId && t.typeTransaction === 'Remise').reduce((s,t) => s + t.montantTotal, 0);
        
        const template = messageTemplates.find(t => t.category === 'ECLOSION' && t.isActive)
           || { content: `🧾 *BILAN TECHNIQUE & FINANCIER ÉCLOSION*\n\n` +
           `👤 Client : *{{client_name}}* ({{client_id_ext}})\n` +
           `🐣 Lot : *{{quantite}} {{type_oeuf}}s*\n\n` +
           `🔍 *RÉSULTATS TECHNIQUES* :\n` +
           `- ✅ Œufs viables mis en éclosion : {{viables}}\n` +
           `- 🐥 Poussins prêts : *{{poussins_nes}}* (Sortie ce jour : +{{delta_nes}})\n` +
           `- ⚠️ Pertes à l'éclosion : {{morts}}\n` +
           `- 🏆 Taux de réussite : *{{taux_reussite}}*\n\n` +
           `💰 *SITUATION FINANCIÈRE* :\n` +
           `- Montant Total dû : {{montant_total}}\n` +
           `- Remises/Avoirs : {{remises_avoirs}}\n` +
           `- Déjà encaissé : {{deja_encaisse}}\n` +
           `🚩 *NET À PAYER : {{reste_a_payer}}*\n\n` +
           `📦 *Venez chercher vos poussins demain après-midi.*\n_Prévoyez le solde pour la livraison._\n\n` +
           `_Merci de votre confiance !_ \n*L'équipe Ivoire Couvée d'Or.*` };

         const whatsAppText = formatWhatsAppMessage(template as any, {
           client,
           couvaison: { ...couv, poussinsNes: nes },
           transactions,
           extra: {
             client_id_ext: client.clientIdExt || '—',
             viables: oeufsRestants,
             delta_nes,
             morts,
             remises_avoirs: (remises + avoirs).toLocaleString() + ' F',
             deja_encaisse: netEncashed.toLocaleString() + ' F'
           }
         });

        try {
          await addClientMessage({
            clientId: client.id,
            couvaisonId: couv.id,
            canal: 'WhatsApp',
            statut: 'Envoye',
            template: 'sortie_eclosion',
            message: whatsAppText,
            sentByUserId: currentUser?.id,
            sentByName: currentUser?.nom,
          });
        } catch { /* no-op */ }
        const url = `https://wa.me/${normalizePhoneForWhatsApp(client.telephone)}?text=${encodeURIComponent(whatsAppText)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }

      alert('Étape enregistrée avec succès !');
      onSuccess();
    } catch (err) {
      alert((err as Error).message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const confirm = window.confirm("Ceci va clôturer définitivement l'éclosion pour ce lot. Continuer ?");
    if (!confirm) return;

    try {
      await updateCouvaison(couvaisonId, {
        poussinsNes: nes,
        mortsEnCoque: morts,
        statut: 'Terminé',
        causeEchecMajeure:
          (morts > 0 || nonEclos > 0) && cause !== 'Aucune' ? cause : couv.causeEchecMajeure,
      });
      alert('L\'éclosion de ce lot a été clôturée avec succès.');
      onSuccess();
    } catch (err) {
      alert((err as Error).message || 'Erreur lors de la clôture');
    }
  };



  const maxFecondes = oeufsRestants;
  const successRateMachine = maxFecondes > 0 ? Math.round((nes / maxFecondes) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray max-w-xl mx-auto mt-4">
      <h2 className="text-xl font-bold text-green-800 mb-2">Saisie des Sorties & Bilan</h2>
      
      <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
        <div>
           <div className="text-xs text-brand-muted uppercase tracking-wider font-semibold">Œufs Viables</div>
           <div className="text-xl font-bold text-blue-900">{oeufsRestants}</div>
        </div>
        <div>
           <div className="text-xs text-brand-muted uppercase tracking-wider font-semibold">Déjà sortis</div>
           <div className="text-xl font-bold text-brand-dark">{prevNes}</div>
        </div>
        <div className="bg-green-100 rounded">
           <div className="text-xs text-green-800 uppercase tracking-wider font-semibold pt-1 px-1">En Machine</div>
           <div className="text-2xl font-black text-green-700">{nonEclos > 0 ? nonEclos : 0}</div>
        </div>
      </div>

      <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50 relative group">
        <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-1">
          <h3 className="text-xs font-black text-brand-dark uppercase tracking-wider">État Financier du Lot</h3>
          {client?.telephone && (
            <button
              type="button"
              onClick={() => {
                const totalDue = couv.nombreOeufs * couv.prixUnitaire;
                const netEncashed = netPayeLot(transactions, couvaisonId);
                const avoirs = transactions.filter(t => t.couvaisonId === couvaisonId && t.typeTransaction === 'Avoir').reduce((s,t) => s + t.montantTotal, 0);
                const remises = transactions.filter(t => t.couvaisonId === couvaisonId && t.typeTransaction === 'Remise').reduce((s,t) => s + t.montantTotal, 0);
                
                const template = messageTemplates.find(t => t.category === 'ECLOSION' && t.isActive)
                   || { content: `🧾 *BILAN TECHNIQUE & FINANCIER ÉCLOSION*\n\n` +
                   `👤 Client : *{{client_name}}* ({{client_id_ext}})\n` +
                   `🐣 Lot : *{{quantite}} {{type_oeuf}}s*\n\n` +
                   `🔍 *RÉSULTATS TECHNIQUES* :\n` +
                   `- ✅ Œufs viables mis en éclosion : {{viables}}\n` +
                   `- 🐥 Poussins prêts : *{{poussins_nes}}*\n` +
                   `- ⚠️ Pertes signalées : {{morts}}\n` +
                   `- 🏆 Taux de réussite : *{{taux_reussite}}*\n\n` +
                   `💰 *SITUATION FINANCIÈRE* :\n` +
                   `- Montant Total dû : {{montant_total}}\n` +
                   `- Remises/Avoirs : {{remises_avoirs}}\n` +
                   `- Déjà encaissé : {{deja_encaisse}}\n` +
                   `🚩 *NET À PAYER : {{reste_a_payer}}*\n\n` +
                   `📦 *Disponible pour récupération.*\n\n` +
                   `_Merci de votre confiance !_ \n*L'équipe Ivoire Couvée d'Or.*` };

                 const msg = formatWhatsAppMessage(template as any, {
                   client,
                   couvaison: { ...couv, poussinsNes: nes },
                   transactions,
                   extra: {
                     client_id_ext: client.clientIdExt || '—',
                     viables: oeufsRestants,
                     morts,
                     remises_avoirs: (remises + avoirs).toLocaleString() + ' F',
                     deja_encaisse: netEncashed.toLocaleString() + ' F'
                   }
                 });
                
                window.open(`https://wa.me/${normalizePhoneForWhatsApp(client.telephone)}?text=${encodeURIComponent(msg)}`, '_blank');
              }}
              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Envoyer Bilan WhatsApp
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-y-1 text-[11px]">
          <span className="text-slate-500">Montant dû :</span>
          <span className="text-right font-semibold">{(couv.nombreOeufs * couv.prixUnitaire).toLocaleString()} F</span>
          <span className="text-slate-500">Net encaissé :</span>
          <span className="text-right font-semibold text-emerald-600">{netPayeLot(transactions, couvaisonId).toLocaleString()} F</span>
          <span className="border-t border-slate-200 mt-1 pt-1 font-bold text-brand-orange">Reste à payer :</span>
          <span className="border-t border-slate-200 mt-1 pt-1 text-right font-bold text-brand-orange">{resteLot(transactions, couvaisonId, couv.nombreOeufs * couv.prixUnitaire).toLocaleString()} F</span>
        </div>
      </div>
      
      <form onSubmit={handleFinalSubmit} className="space-y-6">
         <div className="grid grid-cols-2 gap-4">
           <div className="bg-green-50 p-4 rounded-lg border border-green-200">
             <label className="block text-sm font-semibold text-brand-dark mb-2 text-green-900">Total Sortis (Cumul)</label>
             <input required type="number" min="0" max={oeufsRestants} value={nes} onChange={e => setNes(parseInt(e.target.value) || 0)} className="w-full rounded-md border border-green-300 p-2 text-center text-xl font-bold text-green-700 focus:ring-2 focus:ring-green-500 outline-none bg-white" />
             {deltaNes > 0 && (
               <div className="mt-2 text-xs font-semibold text-green-700 bg-green-100 p-1.5 rounded text-center">
                 +{deltaNes} nouvelle(s) sortie(s) à notifier
               </div>
             )}
           </div>
           <div className="bg-red-50 p-4 rounded-lg border border-red-200">
             <label className="block text-sm font-semibold text-brand-dark mb-2 text-red-900">Total Morts en machine</label>
             <input required type="number" min="0" max={oeufsRestants - nes} value={morts} onChange={e => setMorts(parseInt(e.target.value) || 0)} className="w-full rounded-md border border-red-300 p-2 text-center text-lg text-red-700 focus:ring-2 focus:ring-red-500 outline-none bg-white" />
             {(morts - (couv.mortsEnCoque || 0)) > 0 && (
               <div className="mt-2 text-xs font-semibold text-red-700 bg-red-100 p-1.5 rounded text-center">
                 +{(morts - (couv.mortsEnCoque || 0))} nouvelle(s) perte(s)
               </div>
             )}
           </div>
         </div>
         
         {deltaNes > 0 && client?.telephone && (
            <div className="flex items-center gap-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <input type="checkbox" id="sendWa" checked={sendWhatsApp} onChange={(e) => setSendWhatsApp(e.target.checked)} className="h-4 w-4 text-brand-orange rounded border-gray-300 focus:ring-brand-orange" />
              <label htmlFor="sendWa" className="text-sm font-medium text-yellow-800 cursor-pointer flex-1">
                Envoyer un message WhatsApp au client ({client.telephone}) pour l'informer des {deltaNes} poussins prêts.
              </label>
            </div>
         )}
         
         <div className="flex justify-between items-center text-sm px-2">
            <span className="text-brand-gray">Pertes ou Restants (Non éclos) : <strong className={nonEclos < 0 ? 'text-red-500' : ''}>{nonEclos}</strong></span>
            <span className="font-bold text-brand-dark" title={`Calculé sur base de ${maxFecondes} œufs fécondés`}>
               Efficacité Globale : <span className="text-green-600 text-lg">{successRateMachine}%</span>
            </span>
         </div>

         {(morts > 0 || nonEclos > 0) && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
               <label className="block text-sm font-semibold text-amber-900 mb-2">Cause principale des pertes à l'éclosion</label>
               <select value={cause} onChange={e => setCause(e.target.value)} className="w-full rounded-md border border-amber-300 p-2 focus:ring-2 focus:ring-amber-500 outline-none bg-white">
                 <option value="Aucune">-- Non identifié --</option>
                 <option value="Température/Humidité">Oscillation Température/Humidité (Machine)</option>
                 <option value="Coupure Électrique">Coupure de courant</option>
                 <option value="Infection">Infection / Contamination</option>
                 <option value="Manutention">Choc lors du transfert</option>
                 <option value="Autres">Autre cause</option>
               </select>
            </div>
         )}

         <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-xs text-brand-muted">
           <strong>Attention :</strong> La validation clôturera définitivement cette couvaison (Statut: Terminé).
         </div>

         <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 text-brand-gray rounded-md hover:bg-gray-50">
              Annuler
            </button>
            {canDelete && (
              <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-md hover:bg-red-100 transition-colors">
                Supprimer
              </button>
            )}
            <button type="button" onClick={handlePartialSubmit} disabled={nonEclos < 0} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50" title="Enregistrer sans clôturer">
              Enregistrer l'étape
            </button>
            <button type="submit" disabled={nonEclos < 0} className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50">
              Clôturer Définitivement
            </button>
         </div>
      </form>
    </div>
  );
};
