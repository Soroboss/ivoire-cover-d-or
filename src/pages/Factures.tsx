import { useState, useRef } from 'react';
import { useAppContext } from '../context/AppProvider';
import { useAuth } from '../context/AuthContext';
import { InvoiceTemplate } from '../components/facturation/InvoiceTemplate';
import { Download, FileText, Printer, CheckCircle, Edit2, Save, X, Trash2 } from 'lucide-react';
import { netEncaisseByClient, totalAvoirRemiseByClient } from '../lib/financeCalculations';
import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';

const ADRESSE_ETABLISSEMENT = "Korhogo-Natio près de l'usine de coton SICO SA";

const Factures = () => {
  const { clients, couvaisons, transactions, addReceiptArchive, updateCouvaison } = useAppContext();
  const { currentUser } = useAuth();
  const [selectedClient, setSelectedClient] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCouvaisons, setEditedCouvaisons] = useState<Record<string, { nombreOeufs: number, prixUnitaire: number }>>({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const invoiceRef = useRef<HTMLDivElement>(null);

  const client = clients.find(c => c.id === selectedClient);
  
  // All-time data for general balance
  const clientCouvaisonsTotal = couvaisons.filter(c => c.clientId === selectedClient);
  const clientTransactionsTotal = transactions.filter(t => t.clientId === selectedClient);

  // Filtered data for the specific invoice/period
  const clientCouvaisons = clientCouvaisonsTotal.filter(c => {
    if (!startDate && !endDate) return true;
    const date = c.dateReception.substring(0, 10);
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  }).sort((a, b) => new Date(b.dateReception).getTime() - new Date(a.dateReception).getTime());

  const clientTransactions = clientTransactionsTotal.filter(t => {
    if (!startDate && !endDate) return true;
    const date = t.dateTransaction.substring(0, 10);
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  });

  // General Balance Calculations
  const totalAmountGen = clientCouvaisonsTotal.reduce((acc, c) => acc + (c.nombreOeufs * c.prixUnitaire), 0);
  const totalPaidGen = netEncaisseByClient(clientTransactionsTotal, selectedClient);
  const totalCreditsGen = totalAvoirRemiseByClient(clientTransactionsTotal, selectedClient);
  const dueAmountGen = totalAmountGen - totalPaidGen - totalCreditsGen;

  const invoiceNumber = client ? `FC-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}-${client.id.split('-')[0].toUpperCase()}` : ''

  const startEditing = () => {
    const initial: Record<string, { nombreOeufs: number, prixUnitaire: number }> = {};
    clientCouvaisons.forEach(c => {
      initial[c.id] = { nombreOeufs: c.nombreOeufs, prixUnitaire: c.prixUnitaire };
    });
    setEditedCouvaisons(initial);
    setIsEditing(true);
  };

  const handleEditChange = (id: string, field: 'nombreOeufs' | 'prixUnitaire', value: number) => {
    setEditedCouvaisons(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const saveEdits = async () => {
    try {
      for (const id in editedCouvaisons) {
        const original = clientCouvaisons.find(c => c.id === id);
        if (original && (original.nombreOeufs !== editedCouvaisons[id].nombreOeufs || original.prixUnitaire !== editedCouvaisons[id].prixUnitaire)) {
          await updateCouvaison(id, editedCouvaisons[id]);
        }
      }
      setIsEditing(false);
    } catch (error) {
      alert("Erreur lors de la mise à jour des données");
    }
  };

  const generatePDF = async (shouldDownload = true) => {
    if (!invoiceRef.current || !client) return;
    setIsGenerating(true);
    try {
      // Configure PDF
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const fileName = `Facture_Ivoire_Couvee_${client.nom.replace(/\s+/g, '_')}.pdf`;

      // Use the built-in HTML handler for better multi-page support and margins
      await doc.html(invoiceRef.current as HTMLElement, {
        callback: function (doc) {
          const totalPages = doc.getNumberOfPages();
          
          for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            
            // --- REPEATED HEADER ---
            // Orange accent line at the very top
            doc.setDrawColor(241, 146, 33); // brand-orange
            doc.setLineWidth(1.5);
            doc.line(10, 10, 200, 10);
            
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`IVOIRE COUVÉE D'OR - FACTURE N° ${invoiceNumber}`, 10, 15);
            doc.text(`Client : ${client.nom}`, 10, 19);

            // --- REPEATED FOOTER ---
            doc.setDrawColor(230, 230, 230);
            doc.setLineWidth(0.5);
            doc.line(10, 285, 200, 285);
            
            doc.setFontSize(7);
            doc.text(`${ADRESSE_ETABLISSEMENT} | Tél: 01 03 03 64 62`, 10, 290);
            doc.text(`Page ${i} sur ${totalPages}`, 200, 290, { align: 'right' });
          }

          if (shouldDownload) {
            doc.save(fileName);
          } else {
            window.open(doc.output('bloburl'), '_blank');
          }
        },
        x: 10,
        y: 20, 
        width: 190, 
        windowWidth: 800, 
        autoPaging: 'text',
      });

      const totalAmount = clientCouvaisons.reduce((acc, c) => acc + (c.nombreOeufs * c.prixUnitaire), 0)
      const totalPaid = netEncaisseByClient(clientTransactions, client.id)
      const totalCredits = totalAvoirRemiseByClient(clientTransactions, client.id)
      const dueAmount = Math.max(0, totalAmount - totalPaid - totalCredits)

      await addReceiptArchive({
        clientId: client.id,
        invoiceNumber,
        fileName,
        totalAmount,
        totalPaid,
        totalCredits,
        dueAmount,
        couvaisonsCount: clientCouvaisons.length,
        transactionsCount: clientTransactions.length,
        generatedByUserId: currentUser?.id,
        generatedByName: currentUser?.nom,
        payload: {
          clientNom: client.nom,
          clientTelephone: client.telephone,
        },
      })

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('PDF Generation failed', error);
      alert('Erreur lors de la génération du PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-brand-dark">Facturation & Devis</h1>
        {client && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => isEditing ? saveEdits() : startEditing()}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all shadow-sm ${
                isEditing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              {isEditing ? <><Save size={18} /> Sauvegarder les corrections</> : <><Edit2 size={18} /> Corriger les erreurs</>}
            </button>
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-md font-medium hover:bg-gray-200 transition-all"
              >
                <X size={18} /> Annuler
              </button>
            )}
            <button
              onClick={() => generatePDF(false)}
              disabled={isGenerating || clientCouvaisons.length === 0}
              className="flex items-center gap-2 bg-brand-dark text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 transition-all disabled:opacity-50 shadow-sm"
            >
              <Printer size={18} /> Imprimer
            </button>
            <button
              onClick={() => generatePDF(true)}
              disabled={isGenerating || clientCouvaisons.length === 0}
              className="flex items-center gap-2 bg-brand-orange text-white px-4 py-2 rounded-md font-medium hover:bg-brand-hover transition-all disabled:opacity-50 shadow-sm"
            >
              <Download size={18} /> Télécharger PDF
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-brand-lightgray p-6">
            <h2 className="font-semibold text-brand-dark mb-4 flex items-center gap-2 underline decoration-brand-orange/30">
              <FileText size={18} className="text-brand-orange" /> Dossier Client
            </h2>
            <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-muted mb-1">Rechercher / Sélectionner un Client</label>
                  <div className="space-y-2">
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Chercher par nom ou tél..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full rounded-md border border-gray-200 p-2 text-sm focus:ring-1 focus:ring-brand-orange outline-none bg-gray-50/50"
                      />
                    </div>
                    <select 
                      value={selectedClient} 
                      onChange={e => { setSelectedClient(e.target.value); setIsEditing(false); }} 
                      className="w-full rounded-md border border-gray-300 p-2.5 focus:ring-2 focus:ring-brand-orange outline-none transition-all shadow-sm cursor-pointer"
                    >
                      <option value="">-- {searchTerm ? 'Résultats de recherche' : 'Choisir un client'} --</option>
                      {clients
                        .filter(c => 
                          c.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.telephone.includes(searchTerm)
                        )
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.nom} ({c.telephone})</option>
                        ))
                      }
                    </select>
                  </div>
                </div>
               
               {client && (
                 <div className="space-y-4">
                   <div className="bg-brand-orange/5 p-4 rounded-xl border border-brand-orange/20">
                      <p className="font-bold text-brand-orange mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle size={14} /> Bilan Général (Tout temps)
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-brand-muted">Total Dû :</span>
                          <span className="font-semibold text-brand-dark">{totalAmountGen.toLocaleString()} F</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-brand-muted">Total Payé :</span>
                          <span className="font-semibold text-green-600">{totalPaidGen.toLocaleString()} F</span>
                        </div>
                        <div className="flex justify-between border-t border-brand-orange/10 pt-2 mt-1">
                          <span className="font-bold text-brand-dark">Reste Global :</span>
                          <span className={`${dueAmountGen > 0 ? 'text-brand-orange' : 'text-green-600'} font-bold`}>
                            {Math.max(0, dueAmountGen).toLocaleString()} F
                          </span>
                        </div>
                      </div>
                   </div>

                   <div className="bg-brand-lightgray/30 p-4 rounded-xl border border-brand-lightgray/50 text-sm">
                      <p className="font-bold text-brand-dark mb-3 text-xs uppercase tracking-wider">Filtrer par période</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] text-brand-muted mb-1 uppercase font-semibold">Date Début</label>
                          <input 
                            type="date" 
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2 text-xs focus:ring-1 focus:ring-brand-orange outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-brand-muted mb-1 uppercase font-semibold">Date Fin</label>
                          <input 
                            type="date" 
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2 text-xs focus:ring-1 focus:ring-brand-orange outline-none"
                          />
                        </div>
                        {(startDate || endDate) && (
                          <button 
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            className="w-full py-1 text-[10px] text-brand-orange font-bold hover:underline"
                          >
                            Réinitialiser les filtres
                          </button>
                        )}
                      </div>
                   </div>

                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-[11px]">
                      <p className="font-bold text-brand-dark mb-2 uppercase tracking-wider">Stats de la sélection</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-brand-muted">Lots dans la période :</span>
                          <span className="font-semibold">{clientCouvaisons.length} / {clientCouvaisonsTotal.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-brand-muted">Transactions :</span>
                          <span className="font-semibold">{clientTransactions.length}</span>
                        </div>
                      </div>
                   </div>
                 </div>
               )}
            </div>
          </div>

          {isEditing && (
            <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-100 p-6 animate-in slide-in-from-left duration-300">
              <h3 className="font-bold text-amber-800 text-sm mb-4 uppercase flex items-center gap-2">
                <Edit2 size={14} /> Correction des lots
              </h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {clientCouvaisons.map(c => (
                  <div key={c.id} className="p-3 bg-white rounded-lg border border-amber-200 shadow-sm space-y-2 text-xs">
                    <p className="font-semibold text-brand-dark">Lot: {c.typeOeuf} ({format(parseISO(c.dateReception), 'dd/MM/yy')})</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-brand-muted mb-0.5">Nombre d'œufs</label>
                        <input 
                          type="number"
                          value={editedCouvaisons[c.id]?.nombreOeufs}
                          onChange={(e) => handleEditChange(c.id, 'nombreOeufs', parseInt(e.target.value) || 0)}
                          className="w-full p-1.5 border rounded border-gray-200 focus:ring-1 focus:ring-brand-orange outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-brand-muted mb-0.5">Prix Unitaire</label>
                        <input 
                          type="number"
                          value={editedCouvaisons[c.id]?.prixUnitaire}
                          onChange={(e) => handleEditChange(c.id, 'prixUnitaire', parseInt(e.target.value) || 0)}
                          className="w-full p-1.5 border rounded border-gray-200 focus:ring-1 focus:ring-brand-orange outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={saveEdits}
                className="w-full mt-4 bg-amber-600 text-white py-2 rounded-md text-sm font-bold hover:bg-amber-700 transition-colors"
              >
                Mettre à jour la facture
              </button>
            </div>
          )}
        </div>
        
        {/* Main Content (Invoice Preview) */}
        <div className="lg:col-span-9">
          {!client ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center text-center min-h-[600px]">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <FileText size={40} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-brand-dark mb-2">Prêt à facturer ?</h3>
              <p className="max-w-md text-brand-muted">
                Sélectionnez un client dans la liste pour générer automatiquement son aperçu de facture basé sur ses lots et ses paiements.
              </p>
            </div>
          ) : clientCouvaisons.length === 0 ? (
             <div className="bg-white rounded-xl border border-red-100 p-12 flex flex-col items-center justify-center text-center min-h-[600px]">
               <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-400">
                 <Trash2 size={32} />
               </div>
               <h3 className="text-xl font-semibold text-red-600">Aucune donnée</h3>
               <p className="max-w-sm text-brand-muted mt-2">
                 Ce client n'a pas encore de lots (couvaisons) enregistrés dans le système. Veuillez d'abord enregistrer une réception d'œufs.
               </p>
             </div>
          ) : (
             <div className="relative">
                {isGenerating && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-lg">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-bold text-brand-dark">Génération du document...</p>
                    </div>
                  </div>
                )}
                
                <div className="mb-4 flex items-center justify-between text-xs text-brand-muted bg-white p-2 rounded-md border border-brand-lightgray">
                  <span>Aperçu interactif - Les prix et quantités peuvent être modifiés via le menu de gauche</span>
                  {success && <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={14} /> Action réussie !</span>}
                </div>

                <div className="overflow-auto bg-gray-100/50 p-4 sm:p-8 rounded-xl border border-brand-lightgray shadow-inner">
                   <InvoiceTemplate
                      preview
                      client={client}
                      couvaisons={clientCouvaisons}
                      transactions={clientTransactions}
                      invoiceNumber={invoiceNumber}
                      totalGlobalRemaining={dueAmountGen}
                    />
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Template utilisé uniquement pour la génération PDF (hors écran) */}
      {client && clientCouvaisons.length > 0 && (
        <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', pointerEvents: 'none' }}>
             <InvoiceTemplate
              ref={invoiceRef}
              client={client}
              couvaisons={clientCouvaisons}
              transactions={clientTransactions}
              invoiceNumber={invoiceNumber}
              totalGlobalRemaining={dueAmountGen}
            />
        </div>
      )}
    </div>
  );
};

export default Factures;
