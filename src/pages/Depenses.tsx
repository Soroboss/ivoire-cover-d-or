import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Download,
  Landmark,
  PieChart,
  CalendarRange,
  X,
  Sparkles,
} from 'lucide-react';
import { useAppContext } from '../context/AppProvider';
import type { CategorieDepense, Depense } from '../types';
import { CATEGORIE_DEPENSE_LABELS, CATEGORIES_DEPENSE_ORDER } from '../types';

function startOfDayIso(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

function endOfDayIso(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

function dateInputToIso(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString();
}

function isoToDateInput(iso: string): string {
  try {
    return format(parseISO(iso), 'yyyy-MM-dd');
  } catch {
    return format(new Date(), 'yyyy-MM-dd');
  }
}

const emptyForm = (): {
  dateYmd: string;
  categorie: CategorieDepense;
  libelle: string;
  montant: string;
  notes: string;
} => ({
  dateYmd: format(new Date(), 'yyyy-MM-dd'),
  categorie: 'Autre',
  libelle: '',
  montant: '',
  notes: '',
});

const Depenses = () => {
  const { depenses, addDepense, updateDepense, deleteDepense } = useAppContext();

  const defaultTo = format(new Date(), 'yyyy-MM-dd');
  const defaultFrom = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [filterCategorie, setFilterCategorie] = useState<string>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const t0 = new Date(startOfDayIso(dateFrom)).getTime();
    const t1 = new Date(endOfDayIso(dateTo)).getTime();
    return depenses.filter((d) => {
      const t = new Date(d.dateDepense).getTime();
      if (t < t0 || t > t1) return false;
      if (filterCategorie && d.categorie !== filterCategorie) return false;
      return true;
    });
  }, [depenses, dateFrom, dateTo, filterCategorie]);

  const totalPeriode = useMemo(() => filtered.reduce((s, d) => s + d.montant, 0), [filtered]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of filtered) {
      const k = d.categorie;
      map.set(k, (map.get(k) ?? 0) + d.montant);
    }
    return map;
  }, [filtered]);

  const sortedRows = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.dateDepense).getTime() - new Date(a.dateDepense).getTime()),
    [filtered],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (d: Depense) => {
    setEditingId(d.id);
    setForm({
      dateYmd: isoToDateInput(d.dateDepense),
      categorie: (CATEGORIES_DEPENSE_ORDER.includes(d.categorie as CategorieDepense)
        ? d.categorie
        : 'Autre') as CategorieDepense,
      libelle: d.libelle,
      montant: String(d.montant),
      notes: d.notes ?? '',
    });
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const montant = Number(String(form.montant).replace(/\s/g, '').replace(',', '.'));
    if (!form.libelle.trim() || Number.isNaN(montant) || montant < 0) return;
    setSaving(true);
    try {
      const payload = {
        dateDepense: dateInputToIso(form.dateYmd),
        categorie: form.categorie,
        libelle: form.libelle.trim(),
        montant,
        notes: form.notes.trim() || undefined,
      };
      if (editingId) {
        await updateDepense(editingId, payload);
      } else {
        await addDepense(payload);
      }
      setModalOpen(false);
      setForm(emptyForm());
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (d: Depense) => {
    if (!confirm(`Supprimer « ${d.libelle} » (${d.montant.toLocaleString()} F) ?`)) return;
    await deleteDepense(d.id);
  };

  const exportCsv = () => {
    const sep = ';';
    const header = ['Date', 'Catégorie', 'Libellé', 'Montant (FCFA)', 'Notes'];
    const rows: string[][] = [header];
    for (const d of sortedRows) {
      rows.push([
        format(parseISO(d.dateDepense), 'dd/MM/yyyy', { locale: fr }),
        CATEGORIE_DEPENSE_LABELS[d.categorie as CategorieDepense] ?? d.categorie,
        d.libelle,
        String(d.montant),
        (d.notes ?? '').replace(/\r?\n/g, ' '),
      ]);
    }
    const bom = '\uFEFF';
    const csv = bom + rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(sep)).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `depenses_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const maxCat = Math.max(...Array.from(byCategory.values()), 1);

  return (
    <div className="space-y-8 pb-10">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-amber-50/40 to-brand-orange/[0.07] p-6 shadow-soft sm:p-8">
        <div className="pointer-events-none absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 to-brand-orange text-white shadow-md">
              <Wallet size={28} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Charges d&apos;exploitation</p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
                Dépenses & charges
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Enregistrez tout ce qui <strong>sort</strong> de la caisse sans passer par un client : loyer, énergie,
                salaires, entretien, achats du quotidien. Cela complète la{' '}
                <Link to="/tresorerie" className="font-semibold text-brand-orange underline-offset-2 hover:underline">
                  trésorerie client
                </Link>{' '}
                pour une vision <strong>résultat</strong> (encaissements − charges) sur une période.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/tresorerie"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-brand-dark shadow-sm hover:bg-slate-50"
            >
              <Landmark size={18} className="text-brand-orange" />
              Voir la trésorerie
            </Link>
            <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2 py-2.5">
              <Plus size={18} />
              Nouvelle dépense
            </button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="app-card flex flex-col gap-4 p-5 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <CalendarRange className="h-4 w-4 text-brand-orange" />
          Période & catégorie
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-orange/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Au</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-orange/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Catégorie</label>
            <select
              value={filterCategorie}
              onChange={(e) => setFilterCategorie(e.target.value)}
              className="min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-orange/20"
            >
              <option value="">Toutes</option>
              {CATEGORIES_DEPENSE_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIE_DEPENSE_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-dark shadow-sm hover:bg-slate-50 sm:ml-auto"
        >
          <Download size={18} className="text-emerald-600" />
          Export CSV
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total période</p>
            <Sparkles className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-brand-dark">{totalPeriode.toLocaleString()} FCFA</p>
          <p className="text-xs text-slate-500">{filtered.length} ligne(s) — charges enregistrées</p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-soft sm:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-brand-orange" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Répartition par catégorie</p>
          </div>
          {byCategory.size === 0 ? (
            <p className="text-sm text-slate-500">Aucune dépense sur cette période.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {CATEGORIES_DEPENSE_ORDER.filter((c) => (byCategory.get(c) ?? 0) > 0).map((c) => {
                const v = byCategory.get(c) ?? 0;
                const pct = Math.round((v / maxCat) * 100);
                return (
                  <div key={c} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span className="truncate pr-2">{CATEGORIE_DEPENSE_LABELS[c]}</span>
                      <span className="shrink-0 text-brand-dark">{v.toLocaleString()} F</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-brand-orange"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="app-card overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50/90 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-brand-dark">Journal des dépenses</h2>
          <p className="text-xs text-slate-500">Les montants sont des sorties de trésorerie (FCFA)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-0 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white text-xs uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">Date</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="min-w-[160px] px-4 py-3">Libellé</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Montant</th>
                <th className="hidden px-4 py-3 md:table-cell">Notes</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    Aucune dépense sur cette période. Cliquez sur « Nouvelle dépense » pour commencer.
                  </td>
                </tr>
              ) : (
                sortedRows.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 hover:bg-amber-50/40">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {format(parseISO(d.dateDepense), 'dd/MM/yyyy', { locale: fr })}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium">
                        {CATEGORIE_DEPENSE_LABELS[d.categorie as CategorieDepense] ?? d.categorie}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-brand-dark">{d.libelle}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-red-800">
                      −{d.montant.toLocaleString()}
                    </td>
                    <td className="hidden max-w-[220px] truncate px-4 py-3 text-slate-600 md:table-cell">
                      {d.notes ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(d)}
                        className="mr-1 inline-flex rounded-lg p-2 text-slate-500 hover:bg-white hover:text-brand-orange"
                        title="Modifier"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(d)}
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
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
              <h3 className="font-display text-lg font-bold text-brand-dark">
                {editingId ? 'Modifier la dépense' : 'Nouvelle dépense'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-red-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => void submit(e)} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-semibold text-brand-dark">Date</label>
                <input
                  type="date"
                  required
                  value={form.dateYmd}
                  onChange={(e) => setForm((f) => ({ ...f, dateYmd: e.target.value }))}
                  className="input-modern w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-brand-dark">Catégorie</label>
                <select
                  value={form.categorie}
                  onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value as CategorieDepense }))}
                  className="input-modern w-full"
                >
                  {CATEGORIES_DEPENSE_ORDER.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORIE_DEPENSE_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-brand-dark">Libellé</label>
                <input
                  type="text"
                  required
                  placeholder="Ex. Loyer janvier, Facture CIE, Salaire équipe…"
                  value={form.libelle}
                  onChange={(e) => setForm((f) => ({ ...f, libelle: e.target.value }))}
                  className="input-modern w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-brand-dark">Montant (FCFA)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="0"
                  value={form.montant}
                  onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
                  className="input-modern w-full"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-brand-dark">Notes (optionnel)</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="input-modern w-full resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 py-2.5">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5">
                  {saving ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Depenses;
