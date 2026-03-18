import React, { useState } from 'react';
import { useAppContext } from '../../context/AppProvider';

export const EclosionForm = ({ couvaisonId, onCancel, onSuccess }: { couvaisonId: string, onCancel: () => void, onSuccess: () => void }) => {
  const { couvaisons, updateCouvaison } = useAppContext();
  const couv = couvaisons.find(c => c.id === couvaisonId);
  
  const [nes, setNes] = useState(couv?.poussinsNes || 0);
  const [morts, setMorts] = useState(couv?.mortsEnCoque || 0);
  const [cause, setCause] = useState<any>(couv?.causeEchecMajeure || 'Aucune');

  if (!couv) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCouvaison(couvaisonId, { 
      poussinsNes: nes, 
      mortsEnCoque: morts, 
      statut: 'Terminé',
      causeEchecMajeure: (morts > 0 || nonEclos > 0) && cause !== 'Aucune' ? cause : couv.causeEchecMajeure
    });
    onSuccess();
  };

  const clairs = couv.oeufsClairs || 0;
  const pourris = couv.oeufsPourris || 0;
  const oeufsRestants = couv.nombreOeufs - clairs - pourris;
  const nonEclos = oeufsRestants - nes - morts;

  const maxFecondes = oeufsRestants;
  const successRateMachine = maxFecondes > 0 ? Math.round((nes / maxFecondes) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray max-w-lg mx-auto mt-4">
      <h2 className="text-xl font-bold text-green-800 mb-2">Bilan de l'Éclosion</h2>
      <p className="text-sm text-brand-muted mb-6">Il restait {oeufsRestants} œufs dans la machine après le mirage.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
         <div className="grid grid-cols-2 gap-4">
           <div className="bg-green-50 p-4 rounded-lg border border-green-200">
             <label className="block text-sm font-semibold text-brand-dark mb-2 text-green-900">Poussins Nés Vivants</label>
             <input required type="number" min="0" max={oeufsRestants} value={nes} onChange={e => setNes(parseInt(e.target.value) || 0)} className="w-full rounded-md border border-green-300 p-2 text-center text-xl font-bold text-green-700 focus:ring-2 focus:ring-green-500 outline-none bg-white" />
           </div>
           <div className="bg-red-50 p-4 rounded-lg border border-red-200">
             <label className="block text-sm font-semibold text-brand-dark mb-2 text-red-900">Morts en coque</label>
             <input required type="number" min="0" max={oeufsRestants - nes} value={morts} onChange={e => setMorts(parseInt(e.target.value) || 0)} className="w-full rounded-md border border-red-300 p-2 text-center text-lg text-red-700 focus:ring-2 focus:ring-red-500 outline-none bg-white" />
           </div>
         </div>
         
         <div className="flex justify-between items-center text-sm px-2">
            <span className="text-brand-gray">Pertes sêches (Machine/Soin) : <strong className={nonEclos < 0 ? 'text-red-500' : ''}>{nonEclos}</strong></span>
            <span className="font-bold text-brand-dark" title={`Calculé sur base de ${maxFecondes} œufs fécondés`}>
               Efficacité Machine : <span className="text-green-600 text-lg">{successRateMachine}%</span>
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
            <button type="submit" disabled={nonEclos < 0} className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50">
              Clôturer la Couvaison
            </button>
         </div>
      </form>
    </div>
  );
};
