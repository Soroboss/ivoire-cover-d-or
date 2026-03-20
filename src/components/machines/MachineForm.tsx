import React, { useState } from 'react';
import { useAppContext } from '../../context/AppProvider';
import type { TypeMachine, Casier } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export const MachineForm = ({ machineId, onCancel, onSuccess }: { machineId?: string, onCancel: () => void, onSuccess: () => void }) => {
  const { machines, addMachine, updateMachine } = useAppContext();
  const machine = machineId ? machines.find(m => m.id === machineId) : undefined;
  
  const [nom, setNom] = useState(machine?.nom || '');
  const [type, setType] = useState<TypeMachine>(machine?.type || 'Couveuse');
  const [enService, setEnService] = useState(machine ? machine.enService : true);
  const [casiers, setCasiers] = useState<Casier[]>(machine?.casiers || [{ id: uuidv4(), nom: 'Palier 1', capacite: 100 }]);

  const updateCasier = (id: string, field: keyof Casier, value: any) => {
    setCasiers(casiers.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCasier = (id: string) => {
    if (casiers.length > 1) {
      setCasiers(casiers.filter(c => c.id !== id));
    }
  };

  const handleAddCasier = () => {
    setCasiers([...casiers, { id: uuidv4(), nom: `Palier ${casiers.length + 1}`, capacite: 100 }]);
  };

  const capaciteTotale = casiers.reduce((sum, c) => sum + (Number(c.capacite) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (machine) {
      await updateMachine(machine.id, { nom, type, enService, casiers, capacite: capaciteTotale })
    } else {
      await addMachine({ nom, type, enService, casiers, capacite: capaciteTotale })
    }
    onSuccess();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray w-[600px] max-w-full mx-auto">
      <h2 className="text-xl font-bold text-brand-dark mb-6">{machine ? 'Modifier la Machine' : 'Nouvelle Machine'}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-semibold text-brand-dark mb-2">Nom / Référence</label>
             <input required type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex: Incubateur P-3000" className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none" />
           </div>
           <div>
             <label className="block text-sm font-semibold text-brand-dark mb-2">Type d'équipement</label>
             <select value={type} onChange={e => setType(e.target.value as TypeMachine)} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none bg-white">
               <option value="Couveuse">Couveuse (Incubateur)</option>
               <option value="Éclosoir">Éclosoir</option>
               <option value="Mixte">Machine Mixte</option>
             </select>
           </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-md border border-gray-200">
           <input type="checkbox" id="enService" checked={enService} onChange={e => setEnService(e.target.checked)} className="w-5 h-5 text-brand-orange focus:ring-brand-orange border-gray-300 rounded" />
           <label htmlFor="enService" className="text-sm font-medium text-brand-dark cursor-pointer">Machine actuellement en service (disponible pour les couvaisons)</label>
        </div>

        <div>
           <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-brand-dark border-b pb-1 w-full flex justify-between">
                <span>Casiers & Tiroirs internes</span>
                <span className="text-brand-orange">Capacité globale: {capaciteTotale}</span>
              </h3>
           </div>
           
           <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {casiers.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-gray-400 font-medium w-6 text-right">{i+1}.</span>
                  <input required type="text" value={c.nom} onChange={e => updateCasier(c.id, 'nom', e.target.value)} placeholder="Nom du casier" className="flex-1 rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-brand-orange outline-none" />
                  <input required type="number" min="1" value={c.capacite} onChange={e => updateCasier(c.id, 'capacite', parseInt(e.target.value))} placeholder="Capacité" className="w-32 rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-brand-orange outline-none" />
                  <button type="button" onClick={() => removeCasier(c.id)} disabled={casiers.length === 1} className="p-2 text-red-500 hover:bg-red-50 rounded-md disabled:opacity-30">✕</button>
                </div>
              ))}
           </div>
           <button type="button" onClick={handleAddCasier} className="mt-3 text-sm text-brand-orange font-semibold hover:underline">
             + Ajouter un casier/tiroir à cette machine
           </button>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-brand-lightgray">
          <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 text-brand-gray rounded-md hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button type="submit" className="px-6 py-2 bg-brand-dark text-white font-medium rounded-md hover:bg-gray-800 shadow-sm transition-colors">
            Enregistrer Machine
          </button>
        </div>
      </form>
    </div>
  );
};
