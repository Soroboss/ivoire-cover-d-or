import { useState } from 'react';
import { useAppContext } from '../../context/AppProvider';
import { EclosionForm } from './EclosionForm';
import EclosionStartForm from './EclosionStartForm';

type Tab = 'start' | 'close';

/**
 * Regroupe les deux étapes éclosion avec onglets distincts (demande métier).
 */
export function EclosionHub({
  couvaisonId,
  onCancel,
  onSuccess,
}: {
  couvaisonId: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const { couvaisons } = useAppContext();
  const couv = couvaisons.find((c) => c.id === couvaisonId);
  const [tab, setTab] = useState<Tab>(() => (couv?.dateEclosionDemarrage ? 'close' : 'start'));

  if (!couv) return null;

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-300 max-w-2xl mx-auto mt-4">
      <div className="flex flex-wrap gap-2 border-b border-brand-lightgray pb-3 mb-4">
        <button
          type="button"
          onClick={() => setTab('start')}
          className={`px-4 py-2 rounded-t-md text-sm font-semibold transition-colors ${
            tab === 'start'
              ? 'bg-amber-100 text-amber-900 border border-b-0 border-brand-lightgray -mb-px'
              : 'bg-gray-50 text-brand-muted hover:bg-gray-100'
          }`}
        >
          Étape 1: Démarrage (Info Client)
        </button>
        <button
          type="button"
          onClick={() => setTab('close')}
          className={`px-4 py-2 rounded-t-md text-sm font-semibold transition-colors ${
            tab === 'close'
              ? 'bg-amber-100 text-amber-900 border border-b-0 border-brand-lightgray -mb-px'
              : 'bg-gray-50 text-brand-muted hover:bg-gray-100'
          }`}
        >
          Étape 2: Saisie des Sorties & Clôture
        </button>
      </div>

      {tab === 'start' ? (
        <EclosionStartForm couvaisonId={couvaisonId} onCancel={onCancel} onSuccess={onSuccess} />
      ) : (
        <EclosionForm couvaisonId={couvaisonId} onCancel={onCancel} onSuccess={onSuccess} />
      )}
    </div>
  );
}
