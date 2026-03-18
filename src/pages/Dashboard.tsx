import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppProvider';
import { useAuth } from '../context/AuthContext';
import { Egg, CheckCircle, TrendingUp, AlertTriangle, CalendarDays } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { isToday, isThisWeek, isThisMonth, isThisYear, isPast, parseISO } from 'date-fns';

const StatCard = ({ title, value, icon, colorClass }: { title: string, value: string | number, icon: React.ReactNode, colorClass: string }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-brand-muted mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-brand-dark">{value}</h3>
    </div>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
      {icon}
    </div>
  </div>
);

const Dashboard = () => {
  const { couvaisons, transactions } = useAppContext();
  const { currentUser } = useAuth();
  const isCaisse = currentUser?.role === 'Réception/Caisse';

  const activeCouvaisons = couvaisons.filter(c => c.statut === 'En cours').length;
  const totalEggs = couvaisons.filter(c => c.statut === 'En cours').reduce((acc, c) => acc + c.nombreOeufs, 0);

  const completed = couvaisons.filter(c => c.statut === 'Terminé');
  const totalCompletedEggs = completed.reduce((acc, c) => acc + c.nombreOeufs, 0);
  const totalChicks = completed.reduce((acc, c) => acc + (c.poussinsNes || 0), 0);
  const successRate = totalCompletedEggs > 0 ? Math.round((totalChicks / totalCompletedEggs) * 100) : 0;

  const totalRevenue = transactions.reduce((acc, t) => acc + t.montantTotal, 0); // Assuming transaction total includes all sales
  const todayRevenue = transactions.filter(t => isToday(parseISO(t.dateTransaction))).reduce((acc, t) => acc + t.montantTotal, 0);
  const weekRevenue = transactions.filter(t => isThisWeek(parseISO(t.dateTransaction), { weekStartsOn: 1 })).reduce((acc, t) => acc + t.montantTotal, 0);
  const monthRevenue = transactions.filter(t => isThisMonth(parseISO(t.dateTransaction))).reduce((acc, t) => acc + t.montantTotal, 0);
  const yearRevenue = transactions.filter(t => isThisYear(parseISO(t.dateTransaction))).reduce((acc, t) => acc + t.montantTotal, 0);

  const eggsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    couvaisons.forEach(c => {
      counts[c.typeOeuf] = (counts[c.typeOeuf] || 0) + c.nombreOeufs;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [couvaisons]);

  const todayAlerts = couvaisons.filter(c => c.statut === 'En cours').map(c => {
    if (!c.dateMiragePrevue || !c.dateEclosionPrevue) return null;
    try {
      const isMirageDay = isToday(parseISO(c.dateMiragePrevue)) || (isPast(parseISO(c.dateMiragePrevue)) && c.oeufsClairs === undefined);
      const isEclosionDay = isToday(parseISO(c.dateEclosionPrevue)) || (isPast(parseISO(c.dateEclosionPrevue)) && c.poussinsNes === undefined);
      
      if (isMirageDay) return { id: c.id, type: 'Mirage', client: c.clientId, date: c.dateMiragePrevue, couvais: c };
      if (isEclosionDay) return { id: c.id, type: 'Eclosion', client: c.clientId, date: c.dateEclosionPrevue, couvais: c };
    } catch(e) { /* ignore invalid dates */ }
    return null;
  }).filter(Boolean);

  const mockRevenueData = [
    { name: 'Jan', value: 120000 },
    { name: 'Fév', value: 150000 },
    { name: 'Mar', value: 200000 },
    { name: 'Avr', value: 180000 },
    { name: 'Mai', value: 250000 },
  ];

  const failureCauses = useMemo(() => {
    const counts: Record<string, number> = {};
    couvaisons.forEach(c => {
      if (c.causeEchecMajeure && c.causeEchecMajeure !== 'Aucune') {
        counts[c.causeEchecMajeure] = (counts[c.causeEchecMajeure] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [couvaisons]);
  
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#3b82f6', '#64748b'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-dark">Tableau de Bord</h1>
      </div>

      {isCaisse ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard title="Caisse Aujourd'hui" value={`${todayRevenue.toLocaleString()} F`} icon={<TrendingUp size={24} className="text-green-600" />} colorClass="bg-green-100" />
           <StatCard title="Caisse Semaine" value={`${weekRevenue.toLocaleString()} F`} icon={<TrendingUp size={24} className="text-blue-600" />} colorClass="bg-blue-100" />
           <StatCard title="Caisse Mois" value={`${monthRevenue.toLocaleString()} F`} icon={<TrendingUp size={24} className="text-purple-600" />} colorClass="bg-purple-100" />
           <StatCard title="Caisse Année" value={`${yearRevenue.toLocaleString()} F`} icon={<TrendingUp size={24} className="text-orange-600" />} colorClass="bg-orange-100" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Couvaisons Actives" value={activeCouvaisons} icon={<CalendarDays size={24} className="text-blue-600" />} colorClass="bg-blue-100" />
            <StatCard title="Œufs en machine" value={totalEggs} icon={<Egg size={24} className="text-brand-orange" />} colorClass="bg-brand-orange/20" />
            <StatCard title="Taux de réussite" value={`${successRate}%`} icon={<CheckCircle size={24} className="text-green-600" />} colorClass="bg-green-100" />
            <StatCard title="Chiffre d'Affaires Global" value={`${totalRevenue.toLocaleString()} FCFA`} icon={<TrendingUp size={24} className="text-purple-600" />} colorClass="bg-purple-100" />
          </div>
          {currentUser?.role === 'Admin' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 border-t border-brand-lightgray pt-6">
               <StatCard title="Recettes du Jour" value={`${todayRevenue.toLocaleString()} F`} icon={<TrendingUp size={20} className="text-green-600" />} colorClass="bg-green-100" />
               <StatCard title="Recettes Semaine" value={`${weekRevenue.toLocaleString()} F`} icon={<TrendingUp size={20} className="text-blue-600" />} colorClass="bg-blue-100" />
               <StatCard title="Recettes Mois" value={`${monthRevenue.toLocaleString()} F`} icon={<TrendingUp size={20} className="text-purple-600" />} colorClass="bg-purple-100" />
               <StatCard title="Recettes Année" value={`${yearRevenue.toLocaleString()} F`} icon={<TrendingUp size={20} className="text-orange-600" />} colorClass="bg-orange-100" />
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {!isCaisse && (
            <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray hover:shadow-md transition-shadow">
               <h2 className="text-lg font-semibold text-brand-dark mb-4">Types d'œufs incubés (Lots)</h2>
               <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    {eggsByType.length > 0 ? (
                     <BarChart data={eggsByType}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                       <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                       <Bar dataKey="value" fill="#374151" radius={[4, 4, 0, 0]} />
                     </BarChart>
                    ) : (
                      <div className="flex bg-brand-lightgray/50 rounded-lg h-full items-center justify-center text-brand-muted">Aucune donnée</div>
                    )}
                  </ResponsiveContainer>
               </div>
             </div>

             <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray hover:shadow-md transition-shadow">
               <h2 className="text-lg font-semibold text-brand-dark mb-4">Analyse des Échecs Majeurs</h2>
               <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    {failureCauses.length > 0 ? (
                      <PieChart>
                        <Pie data={failureCauses} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" labelLine={false}>
                          {failureCauses.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    ) : (
                      <div className="flex flex-col bg-green-50/50 rounded-lg h-full items-center justify-center text-green-600">
                        <CheckCircle size={32} className="mb-2 opacity-50" />
                        <span className="text-sm font-medium">Aucun échec majeur recensé</span>
                      </div>
                    )}
                  </ResponsiveContainer>
               </div>
             </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-brand-lightgray hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-brand-dark mb-4">Évolution des Revenus (FCFA)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} width={80} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#EA580C" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          </>
          )}


        </div>

        <div className="bg-white rounded-xl shadow-sm border border-brand-lightgray flex flex-col h-[calc(100vh-250px)] lg:h-auto min-h-[500px]">
          <div className="p-6 border-b border-brand-lightgray">
            <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              Alertes du Jour
            </h2>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
             {todayAlerts.length === 0 ? (
               <div className="text-center text-brand-muted py-12 flex flex-col items-center">
                 <CheckCircle size={40} className="mb-3 opacity-30" />
                 <p className="font-medium">Aucune action requise aujourd'hui.</p>
                 <p className="text-xs mt-1">Les alertes de mirage et d'éclosion apparaîtront ici.</p>
               </div>
             ) : (
               <div className="space-y-3">
                 {todayAlerts.map((alert, i) => (
                   <div key={i} className={`p-4 rounded-lg border ${alert?.type === 'Mirage' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${alert?.type === 'Mirage' ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`}>
                          {alert?.type} Prévu
                        </span>
                        <span className="text-xs text-brand-dark/70 font-semibold">{alert?.couvais.nombreOeufs} œufs</span>
                      </div>
                      <p className="text-sm font-semibold text-brand-dark mt-2">ID Client: {alert?.client}</p>
                      <p className="text-xs text-brand-gray mt-1">Type: {alert?.couvais.typeOeuf}</p>
                      <button className="mt-3 w-full py-1.5 rounded-md bg-white border border-brand-lightgray text-xs font-medium text-brand-dark hover:bg-gray-50 transition-colors">
                        Traiter
                      </button>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
