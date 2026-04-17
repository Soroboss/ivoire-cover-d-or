import { useState, useRef } from 'react';
import { useAppContext } from '../context/AppProvider';
import { useAuth } from '../context/AuthContext';
import { InvoiceTemplate } from '../components/facturation/InvoiceTemplate';
import { Download, FileText, Printer, CheckCircle, Edit2, Save, X, Trash2 } from 'lucide-react';
import { netEncaisseByClient, totalAvoirRemiseByClient } from '../lib/financeCalculations';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Factures = () => {
  const { clients, couvaisons, transactions, machines, addReceiptArchive, updateCouvaison } = useAppContext();
  const { currentUser } = useAuth();
  const [selectedClient, setSelectedClient] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCouvaisons, setEditedCouvaisons] = useState<Record<string, { nombreOeufs: number, prixUnitaire: number }>>({});
  
  const invoiceRef = useRef<HTMLDivElement>(null);

  const client = clients.find(c => c.id === selectedClient);
  const clientCouvaisons = couvaisons.filter(c => c.clientId === selectedClient);
  const clientTransactions = transactions.filter(t => t.clientId === selectedClient);

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
    setSuccess(false);
    
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const fileName = `Facture_Ivoire_Couvee_${client.nom.replace(/\s+/g, '_')}.pdf`
      
      if (shouldDownload) {
        pdf.save(fileName);
      } else {
        // Just print preview
        window.open(pdf.output('bloburl'), '_blank');
      }

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
                 <label className="block text-sm font-medium text-brand-muted mb-1">Sélectionner un Client</label>
                 <select 
                   value={selectedClient} 
                   onChange={e => { setSelectedClient(e.target.value); setIsEditing(false); }} 
                   className="w-full rounded-md border border-gray-300 p-2.5 focus:ring-2 focus:ring-brand-orange outline-none transition-all shadow-sm"
                 >
                   <option value="">-- Choisir --</option>
                   {clients.map(c => (
                     <option key={c.id} value={c.id}>{c.nom} ({c.telephone})</option>
                   ))}
                 </select>
               </div>
               
               {client && (
                 <div className="bg-brand-lightgray/30 p-4 rounded-xl border border-brand-lightgray/50 text-sm">
                    <p className="font-bold text-brand-dark mb-3 text-xs uppercase tracking-wider">Statistiques du compte</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-brand-muted">Lots totaux :</span>
                        <span className="font-semibold">{clientCouvaisons.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-muted">Lots terminés :</span>
                        <span className="font-semibold text-green-600">{clientCouvaisons.filter(c => c.statut === 'Terminé').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-muted">Transactions :</span>
                        <span className="font-semibold">{clientTransactions.length}</span>
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
                      machines={machines}
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
              machines={machines}
            />
        </div>
      )}
    </div>
  );
};

export default Factures;
