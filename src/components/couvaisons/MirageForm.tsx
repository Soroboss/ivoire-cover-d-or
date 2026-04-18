import React, { useState } from 'react';
import { useAppContext } from '../../context/AppProvider';
import { useAuth } from '../../context/AuthContext';
import { format, parseISO } from 'date-fns';

export const MirageForm = ({ couvaisonId, onCancel, onSuccess }: { couvaisonId: string, onCancel: () => void, onSuccess: () => void }) => {
  const { couvaisons, machines, clients, updateCouvaison, addClientMessage } = useAppContext();
  const { currentUser } = useAuth();
  const couv = couvaisons.find(c => c.id === couvaisonId);
  
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const client = clients.find(cl => cl.id === couv?.clientId);

  const [clairs, setClairs] = useState(couv?.oeufsClairs || 0);
  const [pourris, setPourris] = useState(couv?.oeufsPourris || 0);
  const [cause, setCause] = useState<any>(couv?.causeEchecMajeure || 'Aucune');

  const initialViables = couv ? couv.nombreOeufs - (couv.oeufsClairs || 0) - (couv.oeufsPourris || 0) : 0;
  
  const [emplacements, setEmplacements] = useState<{machineId: string, casierId: string, quantite: number}[]>(
    couv?.emplacementsApresMirage && couv.emplacementsApresMirage.length > 0
      ? couv.emplacementsApresMirage.map(x => ({ ...x }))
      : couv?.emplacements && couv.emplacements.length > 0
        ? couv.emplacements.map(x => ({ ...x, quantite: Math.min(x.quantite, initialViables) }))
        : [{ machineId: '', casierId: '', quantite: initialViables }]
  );

  if (!couv) return null;

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

  const normalizePhoneForWhatsApp = (phone?: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) return cleaned.substring(1);
    if (cleaned.length === 10) return '225' + cleaned;
    return cleaned;
  };

  const oeufsRestants = couv.nombreOeufs - clairs - pourris;
  const oeufsFecondes = oeufsRestants;
  const tauxFecondite = couv.nombreOeufs > 0 ? (oeufsFecondes / couv.nombreOeufs) * 100 : 0;
  // Validation : pas de valeur négative, et si viables > 0 alors tous assignés
  const canSubmit = oeufsRestants >= 0 && (oeufsFecondes === 0 || totalPlaque === oeufsFecondes);

  const handleMirageWhatsApp = async () => {
    if (!client?.telephone || !couv) return;

    const message = `🕯️ *BILAN DU MIRAGE (TRANSPARENCE)*\n\n` +
      `👤 Client : *${client.nom}*\n` +
      `🐣 Lot : *${couv.nombreOeufs} ${couv.typeOeuf}s*\n\n` +
      `📊 *RÉSULTATS TECHNIQUES* :\n` +
      `- ✅ Œufs fertiles (viables) : *${oeufsFecondes}*\n` +
      `- ⚪ Œufs clairs (inféconds) : ${clairs}\n` +
      `- ❌ Œufs pourris / morts : ${pourris}\n` +
      `- 🧬 Taux de fécondité : *${tauxFecondite.toFixed(1)}%*\n\n` +
      `📅 *Étape suivante* : Éclosion prévue le *${couv.dateEclosionPrevue ? format(parseISO(couv.dateEclosionPrevue), 'dd/MM/yyyy') : '?'}*.\n\n` +
      `_Merci de votre confiance !_ \n*L'équipe Ivoire Couvée d'Or.*`;

    try {
      await addClientMessage({
        clientId: client.id,
        couvaisonId: couv.id,
        canal: 'WhatsApp',
        statut: 'Envoye',
        template: 'bilan_mirage',
        message,
        sentByUserId: currentUser?.id,
        sentByName: currentUser?.nom,
      });
    } catch { /* no-op */ }

    window.open(`https://wa.me/${normalizePhoneForWhatsApp(client.telephone)}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const snapEmplacementsAvant =
        couv.emplacementsAvantMirage && couv.emplacementsAvantMirage.length > 0
          ? couv.emplacementsAvantMirage.map(x => ({...x}))
          : (couv.emplacements || []).map((x) => ({ ...x }));
          
      // Si 0 viables, on ne transfère rien
      const finalEmplacements = oeufsFecondes > 0
        ? emplacements.filter(emp => emp.machineId && emp.casierId && emp.quantite > 0)
        : [];

      await updateCouvaison(couvaisonId, {
        oeufsClairs: clairs,
        oeufsPourris: pourris,
        causeEchecMajeure:
          clairs + pourris > 0 && cause !== 'Aucune' ? cause : undefined,
        emplacementsAvantMirage: snapEmplacementsAvant,
        emplacementsApresMirage: finalEmplacements,
        emplacements: finalEmplacements,
      });
      
      if (sendWhatsApp) {
        await handleMirageWhatsApp();
      }

      onSuccess();
    } catch (err) {
      alert((err as Error).message || 'Erreur lors de la validation du mirage');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray max-w-lg mx-auto mt-4 overflow-hidden relative">
      {/* Badge expert */}
      <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest rounded-bl-lg">
        Audit Technique J+14
      </div>

      <h2 className="text-xl font-bold text-blue-800 mb-2">Résultat du Mirage</h2>
      <p className="text-sm text-brand-muted mb-4">Lot de {couv.nombreOeufs} œufs ({couv.typeOeuf}) – {client?.nom}</p>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-6 text-xs text-blue-800 italic">
        💡 **Conseil Expert** : Pour un second mirage, cumulez les nouvelles pertes détectées avec les chiffres déjà saisis ci-dessous.
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
         <div className="grid grid-cols-2 gap-4">
           <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
             <label className="block text-sm font-semibold text-brand-dark mb-2">Œufs Clairs (Inféconds)</label>
             <input type="number" min="0" max={couv.nombreOeufs} value={clairs} onChange={e => setClairs(parseInt(e.target.value) || 0)} className="w-full rounded-md border border-gray-300 p-2 text-center text-lg font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none" />
           </div>
           <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
             <label className="block text-sm font-semibold text-brand-dark mb-2">Morts-Embryons / Pourris</label>
             <input type="number" min="0" max={couv.nombreOeufs - clairs} value={pourris} onChange={e => setPourris(parseInt(e.target.value) || 0)} className="w-full rounded-md border border-gray-300 p-2 text-center text-lg font-bold text-red-600 focus:ring-2 focus:ring-blue-500 outline-none" />
           </div>
         </div>
         
         <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex justify-between items-center mb-1">
           <span className="font-semibold text-blue-900 uppercase text-xs tracking-wider">Potentiel (Viables) :</span>
           <span className={`text-2xl font-black ${oeufsFecondes < 0 ? 'text-red-500' : 'text-blue-700'}`}>{Math.max(0, oeufsFecondes)}</span>
         </div>
         <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex justify-between items-center mb-4">
           <span className="font-semibold text-green-900 uppercase text-xs tracking-wider">Taux de Fécondité :</span>
           <span className="text-xl font-black text-green-700">{Math.max(0, tauxFecondite).toFixed(1)}%</span>
         </div>

         {/* Checkbox WhatsApp */}
         {client?.telephone && (
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <input type="checkbox" id="sendMirageWa" checked={sendWhatsApp} onChange={(e) => setSendWhatsApp(e.target.checked)} className="h-4 w-4 text-brand-orange rounded border-gray-300 focus:ring-brand-orange" />
              <label htmlFor="sendMirageWa" className="text-xs font-bold text-slate-700 cursor-pointer flex-1">
                notifier le client par WhatsApp des résultats de ce mirage.
              </label>
            </div>
         )}

         {(clairs > 0 || pourris > 0) && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
               <label className="block text-sm font-semibold text-amber-900 mb-2">Cause de l'échec (Analyse de performance)</label>
               <select value={cause} onChange={e => setCause(e.target.value)} className="w-full rounded-md border border-amber-300 p-2 focus:ring-2 focus:ring-amber-500 outline-none bg-white font-medium">
                 <option value="Aucune">-- Non qualifié --</option>
                 <option value="Infertilité">Infertilité (Problème reproducteur)</option>
                 <option value="Coupure Électrique">Coupure de courant</option>
                 <option value="Température/Humidité">Problème Température/Humidité</option>
                 <option value="Infection">Infection / Bactérie</option>
                 <option value="Manutention">Choc / Mauvaise manutention</option>
                 <option value="Autre">Autre cause</option>
               </select>
            </div>
         )}
         
         {oeufsFecondes > 0 ? (
          <div className="pt-4 border-t border-brand-lightgray">
            <div className="flex justify-between items-center mb-2">
               <h3 className="font-bold text-slate-700 text-sm uppercase">Réassignation des viables (Tiroirs)</h3>
               <span className={`text-xs font-black p-1 rounded ${totalPlaque !== oeufsFecondes ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>Assignés: {totalPlaque} / {oeufsFecondes}</span>
            </div>
            
            <div className="space-y-3">
               {emplacements.map((emp, idx) => {
                 const machineSelected = machines.find(m => m.id === emp.machineId);
                 return (
                   <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <select value={emp.machineId} onChange={e => updateEmplacement(idx, 'machineId', e.target.value)} className="flex-1 min-w-[120px] rounded-md border border-gray-300 p-2 text-xs focus:ring-2 focus:ring-brand-orange outline-none bg-white">
                         <option value="">-- Machine --</option>
                         {machines.filter(m => m.enService).map(m => (
                           <option key={m.id} value={m.id}>{m.nom} ({m.type})</option>
                         ))}
                      </select>
                      <select value={emp.casierId} onChange={e => updateEmplacement(idx, 'casierId', e.target.value)} disabled={!machineSelected} className="flex-1 min-w-[120px] rounded-md border border-gray-300 p-2 text-xs focus:ring-2 focus:ring-brand-orange outline-none bg-white">
                         <option value="">-- Casier / Tiroir --</option>
                         {machineSelected?.casiers?.map((c: any) => {
                           const occ = getCasierOccupation(machineSelected.id, c.id);
                           const dispo = c.capacite - occ;
                           const affecteIci = emplacements.filter((e, i) => i !== idx && e.machineId === machineSelected.id && e.casierId === c.id).reduce((s, e) => s + (Number(e.quantite) || 0), 0);
                           const dispoReelle = dispo - affecteIci;
                           return <option key={c.id} value={c.id} disabled={dispoReelle <= 0}>{c.nom} (Dispo: {dispoReelle})</option>
                         })}
                      </select>
                      <input type="number" min="1" max={oeufsFecondes} placeholder="Qté" value={emp.quantite} onChange={e => updateEmplacement(idx, 'quantite', parseInt(e.target.value))} className="w-16 rounded-md border border-gray-300 p-2 text-xs text-center focus:ring-2 focus:ring-brand-orange outline-none font-bold" />
                      {idx > 0 && (
                        <button type="button" onClick={() => setEmplacements(emplacements.filter((_, i) => i !== idx))} className="text-red-500 font-bold p-1">✕</button>
                      )}
                   </div>
                 )
               })}
            </div>
          </div>
         ) : null}

         <div className="flex justify-end space-x-3 pt-4 border-t border-brand-lightgray">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-blue-200 text-blue-600 rounded-md hover:bg-blue-50 font-bold text-sm transition-all">
              Annuler
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-6 py-2 bg-blue-600 text-white font-black rounded-md hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 text-sm uppercase tracking-widest"
            >
              Valider le Mirage
            </button>
         </div>
      </form>
    </div>
  );
};
