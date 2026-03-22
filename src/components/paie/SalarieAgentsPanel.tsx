import { useState } from 'react';
import { Users, Plus, Pencil, Trash2, ArrowRightCircle, X } from 'lucide-react';
import { useAppContext } from '../../context/AppProvider';
import type { SalarieAgent } from '../../types';

type Props = {
  /** Injecte la fiche dans le formulaire bulletin (conserve employeur & période) */
  onApplyToBulletin: (agent: SalarieAgent) => void;
};

const emptyForm = (): Omit<SalarieAgent, 'id' | 'createdAt'> => ({
  nom: '',
  fonction: '',
  matricule: '',
  numeroCnps: '',
  salaireMensuelBrut: 0,
  primesDefaut: 0,
  autresGainsDefaut: 0,
  retenuesDiversesDefaut: 0,
  reductionChargesFamilleDefaut: 0,
  notes: '',
});

export function SalarieAgentsPanel({ onApplyToBulletin }: Props) {
  const { salaireAgents, addSalaireAgent, updateSalaireAgent, deleteSalaireAgent } = useAppContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const num = (v: string) => {
    const n = Number(String(v).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (a: SalarieAgent) => {
    setEditingId(a.id);
    setForm({
      nom: a.nom,
      fonction: a.fonction ?? '',
      matricule: a.matricule ?? '',
      numeroCnps: a.numeroCnps ?? '',
      salaireMensuelBrut: a.salaireMensuelBrut,
      primesDefaut: a.primesDefaut,
      autresGainsDefaut: a.autresGainsDefaut,
      retenuesDiversesDefaut: a.retenuesDiversesDefaut,
      reductionChargesFamilleDefaut: a.reductionChargesFamilleDefaut,
      notes: a.notes ?? '',
    });
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) return;
    if (form.salaireMensuelBrut < 0) return;
    setSaving(true);
    try {
      const payload: Omit<SalarieAgent, 'id' | 'createdAt'> = {
        nom: form.nom.trim(),
        fonction: form.fonction?.trim() || undefined,
        matricule: form.matricule?.trim() || undefined,
        numeroCnps: form.numeroCnps?.trim() || undefined,
        salaireMensuelBrut: form.salaireMensuelBrut,
        primesDefaut: form.primesDefaut,
        autresGainsDefaut: form.autresGainsDefaut,
        retenuesDiversesDefaut: form.retenuesDiversesDefaut,
        reductionChargesFamilleDefaut: form.reductionChargesFamilleDefaut,
        notes: form.notes?.trim() || undefined,
      };
      if (editingId) {
        await updateSalaireAgent(editingId, payload);
      } else {
        await addSalaireAgent(payload);
      }
      setModalOpen(false);
      setForm(emptyForm());
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: SalarieAgent) => {
    if (!confirm(`Supprimer la fiche de ${a.nom} ?`)) return;
    await deleteSalaireAgent(a.id);
  };

  return (
    <div className="app-card overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-brand-cream/30 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange">
              <Users size={22} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-brand-dark">Mes salariés & rémunération</h2>
              <p className="text-xs text-slate-600">
                Vous fixez le <strong>salaire brut mensuel</strong> et les montants par défaut (primes, retenues…).
                Ensuite, un clic sur <strong>« Charger dans le bulletin »</strong> préremplit le bulletin de paie ci‑dessous
                pour cet agent.
              </p>
            </div>
          </div>
          <button type="button" onClick={openCreate} className="btn-primary inline-flex shrink-0 items-center gap-2 py-2.5">
            <Plus size={18} />
            Ajouter un salarié
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-white text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Fonction</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">Salaire brut convenu</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">Primes déf.</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {salaireAgents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  Aucune fiche salarié. Ajoutez une personne et le montant que vous versez chaque mois.
                </td>
              </tr>
            ) : (
              salaireAgents.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-brand-cream/30">
                  <td className="px-4 py-3 font-medium text-brand-dark">{a.nom}</td>
                  <td className="px-4 py-3 text-slate-600">{a.fonction ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-brand-dark">
                    {a.salaireMensuelBrut.toLocaleString()} F
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                    {a.primesDefaut ? `${a.primesDefaut.toLocaleString()} F` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onApplyToBulletin(a)}
                      className="mr-1 inline-flex items-center gap-1 rounded-lg border border-brand-orange/40 bg-brand-orange/10 px-2 py-1.5 text-xs font-semibold text-brand-orange hover:bg-brand-orange/20"
                      title="Préremplir le bulletin de salaire"
                    >
                      <ArrowRightCircle size={14} />
                      Bulletin
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      className="mr-1 inline-flex rounded-lg p-2 text-slate-500 hover:bg-white hover:text-brand-orange"
                      title="Modifier"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(a)}
                      className="inline-flex rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <h3 className="font-display text-lg font-bold text-brand-dark">
                {editingId ? 'Modifier la fiche' : 'Nouvelle fiche salarié'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-red-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => void submit(e)} className="space-y-3 p-6">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Nom & prénom *</label>
                <input
                  className="input-modern w-full"
                  required
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex. Kouassi Jean"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Fonction</label>
                <input
                  className="input-modern w-full"
                  value={form.fonction}
                  onChange={(e) => setForm((f) => ({ ...f, fonction: e.target.value }))}
                  placeholder="Ex. Technicien couvoir"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Matricule</label>
                  <input
                    className="input-modern w-full"
                    value={form.matricule}
                    onChange={(e) => setForm((f) => ({ ...f, matricule: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">N° CNPS</label>
                  <input
                    className="input-modern w-full"
                    value={form.numeroCnps}
                    onChange={(e) => setForm((f) => ({ ...f, numeroCnps: e.target.value }))}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3">
                <label className="mb-1 block text-xs font-semibold text-emerald-900">
                  Salaire brut mensuel convenu (FCFA) *
                </label>
                <input
                  className="input-modern w-full"
                  required
                  inputMode="numeric"
                  value={form.salaireMensuelBrut || ''}
                  onChange={(e) => setForm((f) => ({ ...f, salaireMensuelBrut: num(e.target.value) }))}
                  placeholder="Montant que vous décidez de payer (brut)"
                />
                <p className="mt-1 text-[11px] text-emerald-900/80">
                  C’est la base du bulletin ; vous pouvez l’ajuster ensuite mois par mois dans le formulaire.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Primes & indemnités (défaut)</label>
                  <input
                    className="input-modern w-full"
                    inputMode="numeric"
                    value={form.primesDefaut || ''}
                    onChange={(e) => setForm((f) => ({ ...f, primesDefaut: num(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Autres gains (défaut)</label>
                  <input
                    className="input-modern w-full"
                    inputMode="numeric"
                    value={form.autresGainsDefaut || ''}
                    onChange={(e) => setForm((f) => ({ ...f, autresGainsDefaut: num(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Retenues diverses (défaut)</label>
                  <input
                    className="input-modern w-full"
                    inputMode="numeric"
                    value={form.retenuesDiversesDefaut || ''}
                    onChange={(e) => setForm((f) => ({ ...f, retenuesDiversesDefaut: num(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">RICF (défaut)</label>
                  <input
                    className="input-modern w-full"
                    inputMode="numeric"
                    value={form.reductionChargesFamilleDefaut || ''}
                    onChange={(e) => setForm((f) => ({ ...f, reductionChargesFamilleDefaut: num(e.target.value) }))}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Notes internes</label>
                <textarea
                  className="input-modern w-full resize-none"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 py-2.5">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5">
                  {saving ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Créer la fiche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
