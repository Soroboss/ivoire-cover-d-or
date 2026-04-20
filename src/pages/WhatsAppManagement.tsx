import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppProvider';
import { 
  MessageSquare, 
  Save, 
  Plus, 
  Trash2, 
  Info, 
  Hash, 
  Smartphone, 
  Clock,
  CheckCircle,
  Copy,
  ChevronRight,
  Eye
} from 'lucide-react';
import type { MessageTemplate } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const WhatsAppManagement = () => {
  const { messageTemplates, addMessageTemplate, updateMessageTemplate, deleteMessageTemplate } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState<MessageTemplate['category'] | 'ALL'>('ALL');
  const [editingTemplate, setEditingTemplate] = useState<Partial<MessageTemplate> | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Variables disponibles pour le remplacement
  const availableVariables = [
    { key: '{{client_name}}', desc: 'Nom complet du client' },
    { key: '{{quantite}}', desc: 'Nombre total d\'œufs' },
    { key: '{{type_oeuf}}', desc: 'Type d\'œuf (Poule, Dinde, etc.)' },
    { key: '{{date_reception}}', desc: 'Date de réception du lot' },
    { key: '{{date_mirage}}', desc: 'Date prévue du mirage' },
    { key: '{{date_eclosion}}', desc: 'Date prévue d\'éclosion' },
    { key: '{{montant_total}}', desc: 'Montant total de la facture' },
    { key: '{{reste_a_payer}}', desc: 'Reste à payer' },
    { key: '{{taux_fecondite}}', desc: 'Taux de fécondité (Mirage)' },
    { key: '{{taux_reussite}}', desc: 'Taux d\'éclosion (Bilan)' },
  ];

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'ALL') return messageTemplates;
    return messageTemplates.filter(t => t.category === selectedCategory);
  }, [messageTemplates, selectedCategory]);

  const handleSave = async () => {
    if (!editingTemplate?.name || !editingTemplate?.content || !editingTemplate?.category) return;

    try {
      if (editingTemplate.id) {
        await updateMessageTemplate(editingTemplate.id, editingTemplate);
      } else {
        await addMessageTemplate({
          name: editingTemplate.name,
          category: editingTemplate.category,
          content: editingTemplate.content,
          description: editingTemplate.description || '',
          isActive: true
        });
      }
      setEditingTemplate(null);
    } catch (error) {
      alert('Erreur lors de l\'enregistrement du template');
    }
  };

  const insertVariable = (variable: string) => {
    if (!editingTemplate) return;
    const content = (editingTemplate.content || '') + variable;
    setEditingTemplate({ ...editingTemplate, content });
  };

  const getPreviewContent = (content: string) => {
    return content
      .replace(/{{client_name}}/g, 'Jean Dupont')
      .replace(/{{quantite}}/g, '500')
      .replace(/{{type_oeuf}}/g, 'Poules')
      .replace(/{{date_reception}}/g, format(new Date(), 'dd MMMM yyyy', { locale: fr }))
      .replace(/{{date_mirage}}/g, format(new Date(), 'dd/MM/yyyy'))
      .replace(/{{date_eclosion}}/g, format(new Date(), 'dd/MM/yyyy'))
      .replace(/{{montant_total}}/g, '25 000 FCFA')
      .replace(/{{reste_a_payer}}/g, '5 000 FCFA')
      .replace(/{{taux_fecondite}}/g, '85%')
      .replace(/{{taux_reussite}}/g, '80%');
  };

  const categories = [
    { id: 'ALL', label: 'Tous', icon: <MessageSquare size={18} /> },
    { id: 'RECEPTION', label: 'Réception', icon: <Clock size={18} /> },
    { id: 'MIRAGE', label: 'Mirage', icon: <Eye size={18} /> },
    { id: 'ECLOSION', label: 'Éclosion', icon: <CheckCircle size={18} /> },
    { id: 'FINANCE', label: 'Finance/Règlement', icon: <Hash size={18} /> },
  ];

  return (
    <div className="space-y-6 animate-login-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60">
        <div>
          <h1 className="text-2xl font-black text-brand-dark flex items-center gap-3">
            <span className="p-2.5 bg-green-100 text-green-600 rounded-2xl">
              <Smartphone size={24} />
            </span>
            Gestion des Messages WhatsApp
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Contrôlez et personnalisez les communications clients</p>
        </div>
        <button 
          onClick={() => setEditingTemplate({ category: 'RECEPTION', content: '', isActive: true })}
          className="btn-primary"
        >
          <Plus size={20} className="mr-2" />
          Nouveau Template
        </button>
        <button 
          onClick={async () => {
            if (window.confirm('Voulez-vous charger les 4 modèles de messages standards ?')) {
              const { DEFAULT_TEMPLATES } = await import('../lib/defaultTemplates');
              for (const t of DEFAULT_TEMPLATES) {
                await addMessageTemplate(t);
              }
              alert('Modèles chargés avec succès !');
            }
          }}
          className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all border border-slate-200"
        >
          Charger les modèles standards
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="space-y-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold ${
                selectedCategory === cat.id 
                  ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/25 scale-[1.02]' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-3">
                {cat.icon}
                {cat.label}
              </div>
              {selectedCategory === cat.id && <ChevronRight size={18} />}
            </button>
          ))}
          
          <div className="mt-8 p-5 bg-blue-50/50 rounded-3xl border border-blue-100/50">
            <h3 className="text-blue-900 font-bold text-sm flex items-center gap-2 mb-3">
              <Info size={16} /> Aide aux variables
            </h3>
            <p className="text-xs text-blue-700 leading-relaxed font-medium">
              Utilisez les variables à droite pour personnaliser vos messages avec les données réelles des clients et des lots.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="p-5 bg-slate-50 rounded-full text-slate-300 mb-4 font-black">
                <MessageSquare size={40} />
              </div>
              <p className="text-slate-400 font-semibold">Aucun template trouvé pour cette catégorie</p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div key={template.id} className="app-card overflow-hidden group hover:border-brand-orange/30 transition-all duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-brand-dark">{template.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          template.category === 'RECEPTION' ? 'bg-blue-100 text-blue-600' :
                          template.category === 'MIRAGE' ? 'bg-purple-100 text-purple-600' :
                          template.category === 'ECLOSION' ? 'bg-green-100 text-green-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {template.category}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 font-medium">{template.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => setEditingTemplate(template)}
                        className="p-2.5 text-slate-400 hover:text-brand-orange hover:bg-brand-orange/10 rounded-xl transition-all"
                      >
                        <Save size={18} />
                      </button>
                      <button 
                        onClick={() => deleteMessageTemplate(template.id)}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <pre className="bg-slate-50 text-slate-700 p-4 rounded-2xl text-sm whitespace-pre-wrap font-sans border border-slate-100 italic leading-relaxed">
                      {template.content}
                    </pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 animate-login-in">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-brand-dark">
                {editingTemplate.id ? 'Modifier le template' : 'Nouveau template'}
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                  className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2"
                >
                  {isPreviewOpen ? <Info size={16} /> : <Eye size={16} />}
                  {isPreviewOpen ? 'Editeur' : 'Aperçu Direct'}
                </button>
                <button 
                  onClick={() => setEditingTemplate(null)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-all"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-6 space-y-4 border-r border-slate-100">
                {!isPreviewOpen ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Nom du template</label>
                        <input 
                          type="text" 
                          value={editingTemplate.name || ''} 
                          onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                          placeholder="ex: Confirmation Mirage"
                          className="input-modern py-2.5"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Catégorie</label>
                        <select 
                          value={editingTemplate.category}
                          onChange={e => setEditingTemplate({...editingTemplate, category: e.target.value as any})}
                          className="input-modern py-2.5"
                        >
                          <option value="RECEPTION">Réception</option>
                          <option value="MIRAGE">Mirage</option>
                          <option value="ECLOSION">Éclosion</option>
                          <option value="FINANCE">Finance/Règlement</option>
                          <option value="AUTRE">Autre</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Description</label>
                      <input 
                        type="text" 
                        value={editingTemplate.description || ''} 
                        onChange={e => setEditingTemplate({...editingTemplate, description: e.target.value})}
                        placeholder="Brève explication de l'usage..."
                        className="input-modern py-2.5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Contenu du message</label>
                      <textarea 
                        rows={8}
                        value={editingTemplate.content || ''} 
                        onChange={e => setEditingTemplate({...editingTemplate, content: e.target.value})}
                        className="input-modern font-sans italic"
                        placeholder="Rédigez votre message avec les variables..."
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 h-full flex flex-col justify-center items-center bg-slate-50 rounded-2xl border border-slate-100 p-8">
                     <div className="w-full max-w-[320px] bg-[#E1FFC7] p-5 rounded-2xl rounded-tr-none shadow-md border border-green-200/50 relative">
                        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {getPreviewContent(editingTemplate.content || '')}
                        </p>
                        <span className="text-[10px] text-green-700/60 font-bold block mt-2 text-right">13:45 ✓✓</span>
                        <div className="absolute top-0 -right-2 w-0 h-0 border-t-[10px] border-t-[#E1FFC7] border-r-[10px] border-r-transparent"></div>
                     </div>
                     <p className="text-xs text-slate-400 font-bold uppercase tracking-tight flex items-center gap-2 mt-4">
                       <CheckCircle size={12} className="text-green-500" /> Aperçu Simulation WhatsApp
                     </p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50/30">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Copy size={16} /> Variables dynamiques
                </h3>
                <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[350px] pr-2">
                  {availableVariables.map((v) => (
                    <button
                      key={v.key}
                      onClick={() => insertVariable(v.key)}
                      className="group flex flex-col text-left p-3 rounded-2xl bg-white border border-slate-200 hover:border-brand-orange transition-all hover:shadow-sm"
                    >
                      <code className="text-brand-orange font-bold text-sm mb-1">{v.key}</code>
                      <span className="text-[11px] text-slate-500 font-medium">{v.desc}</span>
                    </button>
                  ))}
                </div>
                
                <div className="mt-8">
                  <button 
                    onClick={handleSave}
                    disabled={!editingTemplate.name || !editingTemplate.content}
                    className="btn-primary w-full shadow-lg shadow-brand-orange/20"
                  >
                    <Save size={20} className="mr-2" />
                    Enregistrer le template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppManagement;
