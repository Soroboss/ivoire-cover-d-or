import React, { useState, useEffect } from 'react';
import { X, User, Phone, Save, Loader2 } from 'lucide-react';
import { useAppContext } from '../../context/AppProvider';
import type { Client } from '../../types';

interface ClientEditModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedClient: Client) => void;
}

export const ClientEditModal: React.FC<ClientEditModalProps> = ({ client, isOpen, onClose, onSuccess }) => {
  const { updateClient } = useAppContext();
  const [nom, setNom] = useState(client.nom);
  const [telephone, setTelephone] = useState(client.telephone);
  const [clientIdExt, setClientIdExt] = useState(client.clientIdExt || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNom(client.nom);
      setTelephone(client.telephone);
      setClientIdExt(client.clientIdExt || '');
      setError(null);
    }
  }, [isOpen, client]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !telephone.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateClient(client.id, { nom, telephone, clientIdExt });
      if (onSuccess) onSuccess({ ...client, nom, telephone, clientIdExt });
      onClose();
    } catch (err) {
      setError("Erreur lors de la mise à jour. Veuillez réessayer.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-brand-orange px-6 py-4 flex items-center justify-between text-white">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <User size={20} />
            Infos Client
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-brand-muted flex items-center gap-2">
              <User size={14} className="text-brand-orange" />
              Nom complet
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Jean Dupont"
              className="input-modern"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-brand-muted flex items-center gap-2">
                <Phone size={14} className="text-brand-orange" />
                Téléphone
              </label>
              <input
                type="text"
                inputMode="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex: 0707070707"
                className="input-modern"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-brand-muted flex items-center gap-2">
                <span className="font-bold text-brand-orange text-xs">ID#</span>
                ID Unique
              </label>
              <input
                type="text"
                value={clientIdExt}
                onChange={(e) => setClientIdExt(e.target.value)}
                placeholder="Ex: CL-001"
                className="input-modern bg-slate-50"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-orange px-4 py-3 rounded-xl text-sm font-bold text-white shadow-md hover:bg-brand-hover shadow-brand-orange/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
