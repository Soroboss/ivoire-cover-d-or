import React, { useState } from 'react';
import { useAppContext } from '../../context/AppProvider';
import { format } from 'date-fns';
import { OEUF_CONFIG } from '../../types';
import type { TypeOeuf } from '../../types';

export const CouvaisonForm = ({ onCancel, onSuccess }: { onCancel: () => void, onSuccess: () => void }) => {
  const { addCouvaison } = useAppContext();
  
  const [clientNom, setClientNom] = useState('');
  const [clientTel, setClientTel] = useState('');
  const [typeOeuf, setTypeOeuf] = useState<TypeOeuf>('Poule');
  const [nombreOeufs, setNombreOeufs] = useState(0);
  const [prixUnitaire, setPrixUnitaire] = useState(OEUF_CONFIG['Poule'].prix);
  const [dateReception, setDateReception] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNom || !clientTel || nombreOeufs <= 0) return;

    addCouvaison({
      typeOeuf,
      nombreOeufs,
      prixUnitaire,
      dateReception: new Date(dateReception).toISOString(),
      statut: 'En attente',
      emplacements: []
    }, {
      nom: clientNom,
      telephone: clientTel
    });
    
    onSuccess();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray">
      <h2 className="text-xl font-bold text-brand-dark mb-6">Réception de Lots (Bordereau)</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-brand-gray border-b pb-2">Informations Client</h3>
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Nom du client</label>
              <input required type="text" value={clientNom} onChange={e => setClientNom(e.target.value)} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Téléphone Whatsapp (+225...)</label>
              <input required type="text" value={clientTel} onChange={e => setClientTel(e.target.value)} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-brand-gray border-b pb-2">Détails des Oeufs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-muted mb-1">Type d'œuf</label>
                <select value={typeOeuf} onChange={e => {
                  const val = e.target.value as TypeOeuf;
                  setTypeOeuf(val);
                  setPrixUnitaire(OEUF_CONFIG[val].prix);
                }} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none">
                  {Object.keys(OEUF_CONFIG).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-muted mb-1">Quantité (Total)</label>
                <input required type="number" min="1" value={nombreOeufs} onChange={e => setNombreOeufs(parseInt(e.target.value))} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Prix Unitaire Incubation (FCFA)</label>
              <input required type="number" min="0" value={prixUnitaire} onChange={e => setPrixUnitaire(parseInt(e.target.value))} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none" />
            </div>
          </div>

          <div className="space-y-4 md:col-span-2">
            <h3 className="font-semibold text-brand-gray border-b pb-2">Planification d'Entrée</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-brand-muted mb-1">Date Réception Client</label>
                  <input type="date" value={dateReception} onChange={e => setDateReception(e.target.value)} className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none" />
               </div>
               <div className="bg-brand-lightgray p-4 flex items-center justify-center rounded-lg border border-gray-200">
                  <p className="text-sm text-brand-muted italic">La mise en machine (et le dispatching en casiers) se fera dans l'étape suivante par l'équipe spécialisée.</p>
               </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-brand-lightgray">
          <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 text-brand-gray rounded-md hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button type="submit" className="px-6 py-2 bg-brand-orange text-white font-medium rounded-md hover:bg-brand-hover shadow-sm transition-colors">
            Émettre bordereau (Mettre en attente)
          </button>
        </div>
      </form>
    </div>
  );
};
