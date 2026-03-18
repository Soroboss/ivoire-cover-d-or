import { useState } from 'react';
import { useAppContext } from '../context/AppProvider';
import { Server, Activity, Thermometer, Edit2 } from 'lucide-react';
import type { Couvaison, Machine } from '../types';
import { MachineForm } from '../components/machines/MachineForm';

const MachineCard = ({ machine, activeBatches, onEdit }: { machine: Machine, activeBatches: Couvaison[], onEdit: (id: string) => void }) => {
  const currentEggs = activeBatches.reduce((sum, c) => sum + c.nombreOeufs, 0);
  const occupancyRate = machine.capacite > 0 ? (currentEggs / machine.capacite) * 100 : 0;
  
  const isCouveuse = machine.type === 'Couveuse';

  return (
    <div className={`rounded-xl shadow-sm p-6 border ${machine.enService ? 'bg-white border-brand-lightgray hover:shadow-md' : 'bg-gray-100 border-gray-300 opacity-70'} transition-all`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${isCouveuse ? 'bg-orange-100 text-brand-orange' : 'bg-blue-100 text-blue-600'}`}>
             {isCouveuse ? <Thermometer size={24} /> : <Server size={24} />}
          </div>
          <div>
            <h3 className="font-bold text-lg text-brand-dark">{machine.nom}</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isCouveuse ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
              {machine.type}
            </span>
          </div>
        </div>
        <div>
           {machine.enService ? (
             <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">
               <Activity size={14} className="animate-pulse" /> En ligne
             </span>
           ) : (
             <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded-md">Hors Service</span>
           )}
           <button onClick={() => onEdit(machine.id)} className="ml-3 p-1 text-gray-400 hover:text-brand-orange transition-colors" title="Modifier la machine">
             <Edit2 size={16} />
           </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-brand-gray font-medium">Occupation</span>
          <span className="text-brand-dark font-bold">{currentEggs} / {machine.capacite} œufs</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div 
             className={`h-2.5 rounded-full ${occupancyRate > 90 ? 'bg-red-500' : occupancyRate > 70 ? 'bg-amber-500' : 'bg-green-500'}`} 
             style={{ width: `${Math.min(100, Math.max(0, occupancyRate))}%` }}
          ></div>
        </div>
        <p className="text-xs text-brand-muted mt-2 text-right">{occupancyRate.toFixed(1)}%</p>
      </div>

      {activeBatches.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
           <p className="text-xs font-semibold text-brand-muted uppercase mb-2">Lots Actuels ({activeBatches.length})</p>
           <ul className="space-y-2 max-h-32 overflow-y-auto pr-2">
             {activeBatches.map(b => (
               <li key={b.id} className="text-xs flex justify-between p-2 rounded bg-gray-50 border border-gray-100">
                 <span className="font-medium">{b.nombreOeufs} {b.typeOeuf}s</span>
                 <span className="text-brand-muted">{b.dateMiseEnMachine?.substring(0,10) || 'En attente'}</span>
               </li>
             ))}
           </ul>
        </div>
      )}
    </div>
  );
};

export const Machines = () => {
  const { machines, couvaisons } = useAppContext();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [activeMachineId, setActiveMachineId] = useState<string | null>(null);

  if (view === 'form') {
    return (
      <div className="animate-in slide-in-from-bottom-4 duration-300">
        <MachineForm 
           machineId={activeMachineId || undefined} 
           onCancel={() => { setView('list'); setActiveMachineId(null); }} 
           onSuccess={() => { setView('list'); setActiveMachineId(null); }} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-dark">Parc Machines</h1>
        <button onClick={() => { setActiveMachineId(null); setView('form'); }} className="bg-brand-dark text-white px-4 py-2 rounded-md font-medium shadow-sm hover:bg-gray-800 transition-colors">
          + Nouvelle Machine
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machines.map(m => {
          const activeBatches = couvaisons.filter(c => 
            c.statut === 'En cours' && c.emplacements?.some(emp => emp.machineId === m.id)
          );
          return <MachineCard key={m.id} machine={m} activeBatches={activeBatches} onEdit={(id) => { setActiveMachineId(id); setView('form'); }} />;
        })}
      </div>
    </div>
  );
};

export default Machines;
