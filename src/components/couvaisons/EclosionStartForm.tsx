import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppProvider';
import { useAuth } from '../../context/AuthContext';
import type { Client } from '../../types';
import { format } from 'date-fns';

const normalizePhoneForWhatsApp = (phone?: string) => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
  // Pour les saisies locales (10 chiffres)
  if (cleaned.length === 10) return '225' + cleaned;
  return cleaned;
};

const EclosionStartForm = ({
  couvaisonId,
  onCancel,
  onSuccess,
}: {
  couvaisonId: string;
  onCancel: () => void;
  onSuccess: () => void;
}) => {
  const { couvaisons, clients, updateCouvaison } = useAppContext();
  const { currentUser } = useAuth();

  const couv = useMemo(
    () => couvaisons.find(c => c.id === couvaisonId) || null,
    [couvaisons, couvaisonId],
  );
  const client = useMemo(
    () => clients.find((cl: Client) => cl.id === couv?.clientId) || null,
    [clients, couv],
  );

  const canStart = currentUser?.role === 'Admin' || currentUser?.role === 'Technicien';
  const [nomDepart, setNomDepart] = useState('');
  const startedDate = useMemo(() => new Date(), []);

  const whatsAppText = useMemo(() => {
    const base = "votre eclosion a demarré venez chercher demain dans l'apres midi";
    const greeting = `Bonjour ${client?.nom || ''}`;
    return `${greeting},\n\n${base}\n\nMerci pour votre confiance !\nL'équipe Ivoire Couvée d'Or.`;
  }, [client?.nom]);

  const whatsAppUrl = useMemo(() => {
    const phone = normalizePhoneForWhatsApp(client?.telephone);
    if (!phone) return '';
    return `https://wa.me/${phone}?text=${encodeURIComponent(whatsAppText)}`;
  }, [client?.telephone, whatsAppText]);

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
      });
      if (whatsAppUrl) {
        window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1">Nom de départ</label>
          <input
            required
            type="text"
            value={nomDepart}
            onChange={(e) => setNomDepart(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none"
            disabled={!canStart}
          />
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
          {whatsAppUrl && (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-yellow-50 text-yellow-700 font-medium rounded-md hover:bg-yellow-100 transition-colors inline-flex items-center justify-center"
              title="Ouvrir WhatsApp avec le message pré-rempli"
            >
              Envoyer WhatsApp
            </a>
          )}
          <button
            type="submit"
            disabled={!canStart || !nomDepart.trim()}
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

