import React, { useState } from 'react';
import { useAppContext } from '../../context/AppProvider';
import { useAuth } from '../../context/AuthContext';
import { addDays, format, parseISO } from 'date-fns';
import { OEUF_CONFIG } from '../../types';

export const PlacementForm = ({ couvaisonId, onCancel, onSuccess }: { couvaisonId: string, onCancel: () => void, onSuccess: () => void }) => {
  const { couvaisons, machines, updateCouvaison, deleteCouvaison } = useAppContext();
  const { currentUser } = useAuth();

  const getCasierOccupation = (machineId: string, casierId: string) => {
    return couvaisons.reduce((sum, c) => {
      if (c.statut === 'En cours') {
        const emps = c.emplacements?.filter(emp => emp.machineId === machineId && emp.casierId === casierId) || [];
        return sum + emps.reduce((acc, e) => acc + (Number(e.quantite) || 0), 0);
      }
      return sum;
    }, 0);
  };

  const couv = couvaisons.find(c => c.id === couvaisonId);
  const canDelete = currentUser?.role === 'Admin';
  
  const [dateMiseEnMachine, setDateMiseEnMachine] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [emplacements, setEmplacements] = useState<{machineId: string, casierId: string, quantite: number}[]>([
    { machineId: '', casierId: '', quantite: couv?.nombreOeufs || 0 }
  ]);

  if (!couv) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const baseDate = parseISO(dateMiseEnMachine);
    const dateMirage = format(addDays(baseDate, 7), 'yyyy-MM-dd');
    const dateEclosion = format(addDays(baseDate, OEUF_CONFIG[couv.typeOeuf].jours), 'yyyy-MM-dd');

    updateCouvaison(couvaisonId, {
      dateMiseEnMachine: new Date(dateMiseEnMachine).toISOString(),
      dateMiragePrevue: new Date(dateMirage).toISOString(),
      dateEclosionPrevue: new Date(dateEclosion).toISOString(),
      statut: 'En cours',
      emplacements: emplacements.filter(emp => emp.machineId && emp.casierId && emp.quantite > 0)
    });
    
    onSuccess();
  };

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

  const handleAddEmplacement = () => {
    setEmplacements([...emplacements, { machineId: '', casierId: '', quantite: 0 }]);
  };

  const updateEmplacement = (index: number, key: string, value: any) => {
    const newEmps = [...emplacements];
    newEmps[index] = { ...newEmps[index], [key]: value };
    if (key === 'machineId') newEmps[index].casierId = ''; // reset casier si machine change
    setEmplacements(newEmps);
  };

  const totalPlaque = emplacements.reduce((sum, emp) => sum + (Number(emp.quantite) || 0), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray max-w-2xl mx-auto mt-4">
      <h2 className="text-xl font-bold text-brand-dark mb-2">Mise en Machine (Placement)</h2>
      <p className="text-sm text-brand-muted mb-6">Lot de {couv.nombreOeufs} œufs ({couv.typeOeuf}).</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded border border-gray-200">
           <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Date d'Entrée en Machine</label>
              <input type="date" value={dateMiseEnMachine} onChange={e => setDateMiseEnMachine(e.target.value)} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none" />
           </div>
           <div className="flex flex-col justify-center">
              <span className="text-xs text-blue-600 font-semibold mb-1">Mirage Prévu</span>
              <span className="text-sm font-medium text-blue-900">{format(addDays(parseISO(dateMiseEnMachine), 7), 'dd/MM/yyyy')}</span>
           </div>
           <div className="flex flex-col justify-center">
              <span className="text-xs text-green-600 font-semibold mb-1">Éclosion Prévue</span>
              <span className="text-sm font-medium text-green-900">{format(addDays(parseISO(dateMiseEnMachine), OEUF_CONFIG[couv.typeOeuf].jours), 'dd/MM/yyyy')}</span>
           </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
             <h3 className="font-semibold text-brand-dark">Assignation aux Casiers</h3>
             <span className={`text-sm font-bold ${totalPlaque !== couv.nombreOeufs ? 'text-red-500' : 'text-green-600'}`}>Assignés: {totalPlaque} / {couv.nombreOeufs}</span>
          </div>
          
          <div className="space-y-3">
             {emplacements.map((emp, idx) => {
               const machineSelected = machines.find(m => m.id === emp.machineId);
               return (
                 <div key={idx} className="flex items-center gap-2">
                    <select required value={emp.machineId} onChange={e => updateEmplacement(idx, 'machineId', e.target.value)} className="flex-1 rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-brand-orange outline-none">
                       <option value="">-- Machine --</option>
                       {machines.filter(m => m.enService).map(m => (
                         <option key={m.id} value={m.id}>{m.nom} ({m.type})</option>
                       ))}
                    </select>
                    <select required value={emp.casierId} onChange={e => updateEmplacement(idx, 'casierId', e.target.value)} disabled={!machineSelected} className="flex-1 rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-brand-orange outline-none bg-white">
                       <option value="">-- Casier --</option>
                       {machineSelected?.casiers?.map((c: any) => {
                         const occ = getCasierOccupation(machineSelected.id, c.id);
                         const dispo = c.capacite - occ;
                         // On gère dynamiquement les affectations en direct dans le même formulaire !
                         const affecteIci = emplacements.filter((e, i) => i !== idx && e.machineId === machineSelected.id && e.casierId === c.id).reduce((s, e) => s + (Number(e.quantite) || 0), 0);
                         const dispoReelle = dispo - affecteIci;
                         
                         return <option key={c.id} value={c.id} disabled={dispoReelle <= 0}>{c.nom} (Dispo: {dispoReelle}/{c.capacite})</option>
                       })}
                    </select>
                    <input required type="number" min="1" max={couv.nombreOeufs} placeholder="Qté" value={emp.quantite} onChange={e => updateEmplacement(idx, 'quantite', parseInt(e.target.value))} className="w-24 rounded-md border border-gray-300 p-2 text-sm text-center focus:ring-2 focus:ring-brand-orange outline-none" />
                    {idx > 0 ? (
                      <button type="button" onClick={() => setEmplacements(emplacements.filter((_, i) => i !== idx))} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded font-bold">✕</button>
                    ) : (
                      <div className="w-9"></div>
                    )}
                 </div>
               )
             })}
          </div>
          <button type="button" onClick={handleAddEmplacement} className="mt-3 text-xs text-brand-orange font-semibold hover:underline">
             + Ajouter une subdivision (dispatch sur un autre casier)
          </button>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-brand-lightgray">
          <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 text-brand-gray rounded-md hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          {canDelete && (
            <button type="button" onClick={handleDelete} className="px-6 py-2 bg-red-50 text-red-600 font-medium rounded-md hover:bg-red-100 transition-colors">
              Supprimer
            </button>
          )}
          <button type="submit" disabled={totalPlaque !== couv.nombreOeufs || emplacements.some(emp => {
             if(!emp.machineId || !emp.casierId) return false;
             const machine = machines.find(m => m.id === emp.machineId);
             const casier = machine?.casiers?.find((c: any) => c.id === emp.casierId);
             if(!casier) return false;
             const occ = getCasierOccupation(emp.machineId, emp.casierId);
             // S'assure que tout ce qui est mis dans le casier ne dépasse pas
             const affecteTotal = emplacements.filter(e => e.machineId === emp.machineId && e.casierId === emp.casierId).reduce((s, e) => s + (Number(e.quantite) || 0), 0);
             return affecteTotal > (casier.capacite - occ);
          })} className="px-6 py-2 bg-brand-dark text-white font-medium rounded-md hover:bg-gray-800 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Valider le Placement
          </button>
        </div>
      </form>
    </div>
  );
};
