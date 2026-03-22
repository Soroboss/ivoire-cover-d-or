import React, { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppProvider';
import { format } from 'date-fns';
import { OEUF_CONFIG } from '../../types';
import type { TypeOeuf } from '../../types';

type LotLine = {
  id: string;
  typeOeuf: TypeOeuf;
  nombreOeufs: number;
  prixUnitaire: number;
};

const emptyLine = (): LotLine => ({
  id: uuidv4(),
  typeOeuf: 'Poule',
  nombreOeufs: 0,
  prixUnitaire: OEUF_CONFIG.Poule.prix,
});

export const CouvaisonForm = ({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) => {
  const { addCouvaisonsBatch, clients } = useAppContext();

  const normalizeTelephone = (phone?: string) => {
    if (!phone) return '';
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
    if (cleaned.length === 10) return '225' + cleaned;
    return cleaned;
  };

  const [clientNom, setClientNom] = useState('');
  const [clientTel, setClientTel] = useState('');
  const [isClientRegistered, setIsClientRegistered] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [lines, setLines] = useState<LotLine[]>(() => [emptyLine()]);
  const [dateReception, setDateReception] = useState(format(new Date(), 'yyyy-MM-dd'));

  const matchingClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return [];
    return clients
      .filter((c) => {
        const nom = c.nom.toLowerCase();
        const tel = normalizeTelephone(c.telephone);
        const qTel = normalizeTelephone(q);
        return nom.includes(q) || tel.includes(qTel);
      })
      .slice(0, 8);
  }, [clientSearch, clients]);

  useEffect(() => {
    const normalizedInput = normalizeTelephone(clientTel);
    if (!normalizedInput) {
      setIsClientRegistered(false);
      return;
    }

    const found = clients.find((c) => normalizeTelephone(c.telephone) === normalizedInput);
    if (found) {
      setClientNom(found.nom);
      setIsClientRegistered(true);
    } else {
      setIsClientRegistered(false);
    }
  }, [clientTel, clients]);

  const handleSelectClient = (nom: string, telephone: string) => {
    setClientNom(nom);
    setClientTel(telephone);
    setClientSearch(`${nom} - ${telephone}`);
    setIsClientRegistered(true);
  };

  const updateLine = (id: string, patch: Partial<LotLine>) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const next = { ...l, ...patch };
        if (patch.typeOeuf !== undefined) {
          next.prixUnitaire = OEUF_CONFIG[patch.typeOeuf].prix;
        }
        return next;
      }),
    );
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (id: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  };

  const totalOeufs = useMemo(() => lines.reduce((s, l) => s + (l.nombreOeufs > 0 ? l.nombreOeufs : 0), 0), [lines]);
  const validLines = useMemo(() => lines.filter((l) => l.nombreOeufs > 0), [lines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNom || !clientTel || validLines.length === 0) return;

    try {
      await addCouvaisonsBatch(
        validLines.map((l) => ({
          typeOeuf: l.typeOeuf,
          nombreOeufs: l.nombreOeufs,
          prixUnitaire: l.prixUnitaire,
          dateReception: new Date(dateReception).toISOString(),
          statut: 'En attente' as const,
          emplacements: [],
        })),
        {
          nom: clientNom,
          telephone: clientTel,
        },
      );

      onSuccess();
    } catch (err) {
      alert((err as Error).message || 'Erreur lors de la création de la réception');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray">
      <h2 className="text-xl font-bold text-brand-dark mb-2">Réception de lots (bordereau)</h2>
      <p className="text-sm text-brand-muted mb-6">
        Un seul client et une date de réception : ajoutez <strong>plusieurs lignes</strong> (poules, pintades, cailles…)
        sans resaisir le client.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-brand-gray border-b pb-2">Informations client</h3>
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">
                Recherche client existant (optionnel)
              </label>
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Nom ou téléphone..."
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all"
              />
              {matchingClients.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-md overflow-hidden max-h-44 overflow-y-auto">
                  {matchingClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectClient(c.nom, c.telephone)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-brand-lightgray/50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <span className="font-medium text-brand-dark">{c.nom}</span>
                      <span className="ml-2 text-brand-muted">{c.telephone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Nom du client</label>
              <input
                required
                type="text"
                value={clientNom}
                onChange={(e) => setClientNom(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Téléphone WhatsApp (+225…)</label>
              <input
                required
                type="text"
                value={clientTel}
                onChange={(e) => setClientTel(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange focus:border-transparent outline-none transition-all"
              />
              <p className={`mt-1 text-xs ${isClientRegistered ? 'text-green-700' : 'text-brand-muted'}`}>
                {isClientRegistered
                  ? 'Client existant détecté : les lots seront liés à ce client.'
                  : 'Nouveau client : il sera créé à l’enregistrement.'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-brand-gray border-b pb-2">Date de réception</h3>
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1">Date réception (tous les lots)</label>
              <input
                type="date"
                value={dateReception}
                onChange={(e) => setDateReception(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none"
              />
            </div>
            <div className="bg-brand-lightgray p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-brand-muted italic">
                La mise en machine et le dispatch en casiers se font à l’étape suivante pour chaque lot.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-2">
            <h3 className="font-semibold text-brand-gray">Détail des lots (plusieurs types)</h3>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-orange hover:underline"
            >
              <Plus size={16} /> Ajouter un type d&apos;œufs
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-brand-lightgray">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-50 text-brand-gray font-semibold">
                <tr>
                  <th className="px-3 py-2 text-left">Type d&apos;œuf</th>
                  <th className="px-3 py-2 text-right">Quantité</th>
                  <th className="px-3 py-2 text-right">Prix unitaire (FCFA)</th>
                  <th className="px-3 py-2 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-lightgray">
                {lines.map((line) => (
                  <tr key={line.id} className="bg-white">
                    <td className="px-3 py-2">
                      <select
                        value={line.typeOeuf}
                        onChange={(e) => updateLine(line.id, { typeOeuf: e.target.value as TypeOeuf })}
                        className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none"
                      >
                        {Object.keys(OEUF_CONFIG).map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={line.nombreOeufs || ''}
                        onChange={(e) =>
                          updateLine(line.id, {
                            nombreOeufs: e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-full rounded-md border border-gray-300 p-2 text-right focus:ring-2 focus:ring-brand-orange outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={line.prixUnitaire}
                        onChange={(e) =>
                          updateLine(line.id, { prixUnitaire: parseInt(e.target.value, 10) || 0 })
                        }
                        className="w-full rounded-md border border-gray-300 p-2 text-right focus:ring-2 focus:ring-brand-orange outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length <= 1}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Retirer cette ligne"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-brand-muted">
            <strong>{validLines.length}</strong> lot(s) avec quantité &gt; 0 · <strong>{totalOeufs}</strong> œufs au total
          </p>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-brand-lightgray">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-brand-gray rounded-md hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!clientNom || !clientTel || validLines.length === 0}
            className="px-6 py-2 bg-brand-orange text-white font-medium rounded-md hover:bg-brand-hover shadow-sm transition-colors disabled:opacity-50"
          >
            Émettre le bordereau ({validLines.length} lot{validLines.length > 1 ? 's' : ''})
          </button>
        </div>
      </form>
    </div>
  );
};
