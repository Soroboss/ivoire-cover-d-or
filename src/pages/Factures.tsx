import { useState, useRef } from 'react';
import { useAppContext } from '../context/AppProvider';
import { InvoiceTemplate } from '../components/facturation/InvoiceTemplate';
import { Download, FileText, Printer, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Factures = () => {
  const { clients, couvaisons, transactions } = useAppContext();
  const [selectedClient, setSelectedClient] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const invoiceRef = useRef<HTMLDivElement>(null);

  const client = clients.find(c => c.id === selectedClient);
  const clientCouvaisons = couvaisons.filter(c => c.clientId === selectedClient);
  const clientTransactions = transactions.filter(t => t.clientId === selectedClient);

  const generatePDF = async () => {
    if (!invoiceRef.current || !client) return;
    setIsGenerating(true);
    setSuccess(false);
    
    try {
      // Using scale for sharp text rendering
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Facture_Ivoire_Couvee_${client.nom.replace(/\s+/g, '_')}.pdf`);
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-brand-dark">Générateur de Factures</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-brand-lightgray p-6 md:col-span-1">
          <h2 className="font-semibold text-brand-dark mb-4 flex items-center gap-2">
            <FileText size={18} className="text-brand-orange" /> Saisie des critères
          </h2>
          <div className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-brand-muted mb-1">Sélectionner un Client</label>
               <select 
                 value={selectedClient} 
                 onChange={e => setSelectedClient(e.target.value)} 
                 className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-brand-orange outline-none"
               >
                 <option value="">-- Choisir --</option>
                 {clients.map(c => (
                   <option key={c.id} value={c.id}>{c.nom} ({c.telephone})</option>
                 ))}
               </select>
             </div>
             
             {client && (
               <div className="bg-blue-50/50 p-4 rounded-md border border-blue-100 text-sm">
                  <p className="font-semibold text-brand-dark mb-2">Aperçu du dossier :</p>
                  <ul className="list-disc list-inside text-brand-muted space-y-1">
                    <li>Lots de couvaison : {clientCouvaisons.length}</li>
                    <li>Lots terminés : {clientCouvaisons.filter(c => c.statut === 'Terminé').length}</li>
                    <li>Transactions liées : {clientTransactions.length}</li>
                  </ul>
                  
                  <button 
                    onClick={generatePDF}
                    disabled={isGenerating || clientCouvaisons.length === 0}
                    className="mt-6 w-full flex items-center justify-center gap-2 bg-brand-dark text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <span className="animate-pulse">Génération...</span>
                    ) : success ? (
                      <><CheckCircle size={18} className="text-green-400" /> Téléchargé !</>
                    ) : (
                      <><Download size={18} /> Télécharger le PDF</>
                    )}
                  </button>
               </div>
             )}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 md:col-span-2 flex items-center justify-center min-h-[400px]">
          {!client ? (
            <div className="text-center text-brand-muted">
              <FileText size={48} className="mx-auto mb-3 opacity-20" />
              <p>Sélectionnez un client pour préparer la facture.</p>
            </div>
          ) : clientCouvaisons.length === 0 ? (
             <div className="text-center text-red-500">
               <p>Ce client n'a aucune couvaison enregistrée.</p>
             </div>
          ) : (
             <div className="text-center">
                <CheckCircle size={48} className="mx-auto mb-3 text-green-500 opacity-80" />
                <p className="font-semibold text-brand-dark text-lg">La facture est prête pour {client.nom}</p>
                <p className="text-sm text-brand-muted mt-2">Cliquez sur télécharger pour générer et enregistrer le document PDF professionnel.</p>
                <button 
                  onClick={generatePDF}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-2 border-2 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white rounded-full font-medium transition-colors"
                >
                  <Printer size={18} /> Imprimer / Sauvegarder
                </button>
             </div>
          )}
        </div>
      </div>

      {/* Hidden Offscreen Template */}
      {client && clientCouvaisons.length > 0 && (
        <InvoiceTemplate 
           ref={invoiceRef} 
           client={client} 
           couvaisons={clientCouvaisons} 
           transactions={clientTransactions} 
           invoiceNumber={`FC-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}-${client.id.split('-')[0].toUpperCase()}`}
        />
      )}
    </div>
  );
};

export default Factures;
