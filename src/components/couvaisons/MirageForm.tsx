import React, { useState } from 'react';
import { useAppContext } from '../../context/AppProvider';
import { useAuth } from '../../context/AuthContext';
import { format, parseISO } from 'date-fns';

export const MirageForm = ({ couvaisonId, onCancel, onSuccess }: { couvaisonId: string, onCancel: () => void, onSuccess: () => void }) => {
  const { couvaisons, updateCouvaison, deleteCouvaison } = useAppContext();
  const { currentUser } = useAuth();
  const couv = couvaisons.find(c => c.id === couvaisonId);
  
  const [clairs, setClairs] = useState(couv?.oeufsClairs || 0);
  const [pourris, setPourris] = useState(couv?.oeufsPourris || 0);
  const [cause, setCause] = useState<any>(couv?.causeEchecMajeure || 'Aucune');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCouvaison(couvaisonId, { 
       oeufsClairs: clairs, 
       oeufsPourris: pourris,
       causeEchecMajeure: (clairs + pourris > 0) && cause !== 'Aucune' ? cause : undefined
    });
    onSuccess();
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
         <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex justify-between items-center">
           <span className="font-semibold text-green-900">Taux de Fécondité (Qualité Lot) :</span>
           <span className="text-xl font-bold text-green-700">{tauxFecondite.toFixed(1)}%</span>
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
            <button type="submit" disabled={oeufsRestants < 0} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">
              Valider le Mirage
            </button>
         </div>
      </form>
    </div>
  );
};
