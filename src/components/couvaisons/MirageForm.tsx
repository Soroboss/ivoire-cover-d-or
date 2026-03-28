import React, { useState } from 'react';
import { useAppContext } from '../../context/AppProvider';
import { useAuth } from '../../context/AuthContext';
import { format, parseISO } from 'date-fns';

export const MirageForm = ({ couvaisonId, onCancel, onSuccess }: { couvaisonId: string, onCancel: () => void, onSuccess: () => void }) => {
  const { couvaisons, machines, updateCouvaison, deleteCouvaison } = useAppContext();
  const { currentUser } = useAuth();
  const couv = couvaisons.find(c => c.id === couvaisonId);
  
  const [clairs, setClairs] = useState(couv?.oeufsClairs || 0);
  const [pourris, setPourris] = useState(couv?.oeufsPourris || 0);
  const [cause, setCause] = useState<any>(couv?.causeEchecMajeure || 'Aucune');
  const canDelete = currentUser?.role === 'Admin';

  const oeufsRestantsInitiaux = couv ? couv.nombreOeufs - (couv.oeufsClairs || 0) - (couv.oeufsPourris || 0) : 0;
  const [emplacements, setEmplacements] = useState<{machineId: string, casierId: string, quantite: number}[]>(
    couv?.emplacementsApresMirage && couv.emplacementsApresMirage.length > 0
      ? couv.emplacementsApresMirage.map(x => ({ ...x }))
      : couv?.emplacements && couv.emplacements.length > 0
        ? couv.emplacements.map(x => ({ ...x, quantite: Math.min(x.quantite, oeufsRestantsInitiaux) }))
        : [{ machineId: '', casierId: '', quantite: oeufsRestantsInitiaux }]
  );

  const getCasierOccupation = (machineId: string, casierId: string) => {
    return couvaisons.reduce((sum, c) => {
      // Exclure la couvaison courante pour éviter le double comptage de sa propre occupation
      if (c.statut === 'En cours' && c.id !== couvaisonId) {
        const emps = c.emplacements?.filter(emp => emp.machineId === machineId && emp.casierId === casierId) || [];
        return sum + emps.reduce((acc, e) => acc + (Number(e.quantite) || 0), 0);
      }
      return sum;
    }, 0);
  };

  const handleAddEmplacement = () => {
    setEmplacements([...emplacements, { machineId: '', casierId: '', quantite: 0 }]);
  };

  const updateEmplacement = (index: number, key: string, value: any) => {
    const newEmps = [...emplacements];
    newEmps[index] = { ...newEmps[index], [key]: value };
    if (key === 'machineId') newEmps[index].casierId = ''; // reset casier
    setEmplacements(newEmps);
  };

  const totalPlaque = emplacements.reduce((sum, emp) => sum + (Number(emp.quantite) || 0), 0);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const snapEmplacementsAvant =
        couv.emplacementsAvantMirage && couv.emplacementsAvantMirage.length > 0
          ? couv.emplacementsAvantMirage.map(x => ({...x}))
          : (couv.emplacements || []).map((x) => ({ ...x }));
          
      const finalEmplacements = emplacements.filter(emp => emp.machineId && emp.casierId && emp.quantite > 0);

      await updateCouvaison(couvaisonId, {
        oeufsClairs: clairs,
        oeufsPourris: pourris,
        causeEchecMajeure:
          clairs + pourris > 0 && cause !== 'Aucune' ? cause : undefined,
        emplacementsAvantMirage: snapEmplacementsAvant,
        emplacementsApresMirage: finalEmplacements,
        emplacements: finalEmplacements, // Met à jour l'emplacement global
      });
      onSuccess();
    } catch (err) {
      alert((err as Error).message || 'Erreur lors de la validation du mirage');
    }
  };

  const oeufsRestants = couv.nombreOeufs - clairs - pourris;
  const oeufsFecondes = oeufsRestants;
  const tauxFecondite = couv.nombreOeufs > 0 ? (oeufsFecondes / couv.nombreOeufs) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray max-w-lg mx-auto mt-4">
      <h2 className="text-xl font-bold text-blue-800 mb-2">Résultat du Mirage</h2>
      <p className="text-sm text-brand-muted mb-6">Lot de {couv.nombreOeufs} œufs ({couv.typeOeuf}) mis en machine le {couv.dateMiseEnMachine ? format(parseISO(couv.dateMiseEnMachine), 'dd/MM/yyyy') : '?'}.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
         <div className="grid grid-cols-2 gap-4">
           <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
             <label className="block text-sm font-semibold text-brand-dark mb-2">Œufs Clairs (Non fécondés)</label>
             <input type="number" min="0" max={couv.nombreOeufs} value={clairs} onChange={e => setClairs(parseInt(e.target.value) || 0)} className="w-full rounded-md border border-gray-300 p-2 text-center text-lg focus:ring-2 focus:ring-blue-500 outline-none" />
           </div>
           <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
             <label className="block text-sm font-semibold text-brand-dark mb-2">Œufs Pourris (Éliminés)</label>
             <input type="number" min="0" max={couv.nombreOeufs - clairs} value={pourris} onChange={e => setPourris(parseInt(e.target.value) || 0)} className="w-full rounded-md border border-gray-300 p-2 text-center text-lg focus:ring-2 focus:ring-blue-500 outline-none" />
           </div>
         </div>
         
         {(clairs > 0 || pourris > 0) && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
               <label className="block text-sm font-semibold text-amber-900 mb-2">Cause probable de l'échec (pour analyse)</label>
               <select value={cause} onChange={e => setCause(e.target.value)} className="w-full rounded-md border border-amber-300 p-2 focus:ring-2 focus:ring-amber-500 outline-none bg-white">
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
         
         <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex justify-between items-center mb-3">
           <span className="font-semibold text-blue-900">Œufs fécondés (viables) :</span>
           <span className={`text-2xl font-bold ${oeufsFecondes < 0 ? 'text-red-500' : 'text-blue-700'}`}>{oeufsFecondes}</span>
         </div>
         <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex justify-between items-center mb-6">
           <span className="font-semibold text-green-900">Taux de Fécondité (Qualité Lot) :</span>
           <span className="text-xl font-bold text-green-700">{tauxFecondite.toFixed(1)}%</span>
         </div>

         <div className="pt-4 border-t border-brand-lightgray">
           <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-brand-dark">Transférer / Réassigner les œufs viables</h3>
              <span className={`text-sm font-bold ${totalPlaque !== oeufsFecondes ? 'text-red-500' : 'text-green-600'}`}>Assignés: {totalPlaque} / {oeufsFecondes}</span>
           </div>
           
           <div className="space-y-3">
              {emplacements.map((emp, idx) => {
                const machineSelected = machines.find(m => m.id === emp.machineId);
                return (
                  <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-2">
                     <select required value={emp.machineId} onChange={e => updateEmplacement(idx, 'machineId', e.target.value)} className="flex-1 min-w-[120px] rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-brand-orange outline-none bg-white">
                        <option value="">-- Machine --</option>
                        {machines.filter(m => m.enService).map(m => (
                          <option key={m.id} value={m.id}>{m.nom} ({m.type})</option>
                        ))}
                     </select>
                     <select required value={emp.casierId} onChange={e => updateEmplacement(idx, 'casierId', e.target.value)} disabled={!machineSelected} className="flex-1 min-w-[120px] rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-brand-orange outline-none bg-white">
                        <option value="">-- Casier / Tiroir --</option>
                        {machineSelected?.casiers?.map((c: any) => {
                          const occ = getCasierOccupation(machineSelected.id, c.id);
                          const dispo = c.capacite - occ;
                          const affecteIci = emplacements.filter((e, i) => i !== idx && e.machineId === machineSelected.id && e.casierId === c.id).reduce((s, e) => s + (Number(e.quantite) || 0), 0);
                          const dispoReelle = dispo - affecteIci;
                          return <option key={c.id} value={c.id} disabled={dispoReelle <= 0}>{c.nom} (Dispo: {dispoReelle}/{c.capacite})</option>
                        })}
                     </select>
                     <input required type="number" min="1" max={oeufsFecondes} placeholder="Qté" value={emp.quantite} onChange={e => updateEmplacement(idx, 'quantite', parseInt(e.target.value))} className="w-20 rounded-md border border-gray-300 p-2 text-sm text-center focus:ring-2 focus:ring-brand-orange outline-none" />
                     {idx > 0 ? (
                       <button type="button" onClick={() => setEmplacements(emplacements.filter((_, i) => i !== idx))} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded font-bold">✕</button>
                     ) : (
                       <div className="w-9"></div>
                     )}
                  </div>
                )
              })}
           </div>
           <button type="button" onClick={handleAddEmplacement} className="mt-3 text-xs text-brand-orange font-semibold hover:underline border-0 bg-transparent">
              + Ajouter une subdivision (dispatch sur un autre casier)
           </button>
         </div>

         <div className="flex justify-end space-x-3 pt-4 border-t border-brand-lightgray">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 text-brand-gray rounded-md hover:bg-gray-50">
              Annuler
            </button>
            {canDelete && (
              <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-md hover:bg-red-100 transition-colors">
                Supprimer
              </button>
            )}
            <button type="submit" disabled={oeufsRestants < 0 || totalPlaque !== oeufsFecondes} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">
              Valider le Mirage
            </button>
         </div>
      </form>
    </div>
  );
};
