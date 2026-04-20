import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Couvaisons from './pages/Couvaisons';
import Finances from './pages/Finances';
import Tresorerie from './pages/Tresorerie';
import Depenses from './pages/Depenses';
import BulletinSalaire from './pages/BulletinSalaire';
import Factures from './pages/Factures';
import Machines from './pages/Machines';
import Analyses from './pages/Analyses';
import Utilisateurs from './pages/Utilisateurs';
import Historique from './pages/Historique';
import ClientsDB from './pages/ClientsDB';
import Traitement from './pages/Traitement';
import WhatsAppManagement from './pages/WhatsAppManagement';
import Login from './pages/Login';
import Landing from './pages/Landing';
import { useAuth } from './context/AuthContext';
import { hasPermission } from './lib/permissions';

function App() {
  const { currentUser, usersLoading } = useAuth();

  if (usersLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const homePath = currentUser 
    ? (hasPermission(currentUser, 'dashboard') ? '/dashboard' : '/couvaisons')
    : '/login';
  
  const fallbackPath = '/couvaisons';

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={currentUser ? <Navigate to={homePath} replace /> : <Landing />} 
        />
        <Route 
          path="/login" 
          element={currentUser ? <Navigate to={homePath} replace /> : <Login />} 
        />

        {/* Protected App Routes */}
        <Route 
          path="/" 
          element={currentUser ? <Layout /> : <Navigate to="/login" replace />}
        >
          {/* We use an index route here as a fallback if the user is somehow at path "/" but Layout is rendered */}
          {/* However, the root path "/" is already handled above by the explicit "/" route */}
          
          <Route path="dashboard" element={hasPermission(currentUser, 'dashboard') ? <Dashboard /> : <Navigate to={fallbackPath} replace />} />
          <Route path="traitement" element={hasPermission(currentUser, 'couvaisons') ? <Traitement /> : <Navigate to={homePath} replace />} />
          <Route path="couvaisons" element={hasPermission(currentUser, 'couvaisons') ? <Couvaisons /> : <Navigate to={homePath} replace />} />
          <Route path="machines" element={hasPermission(currentUser, 'machines') ? <Machines /> : <Navigate to={homePath} replace />} />
          <Route path="clients" element={hasPermission(currentUser, 'clients') ? <ClientsDB /> : <Navigate to={homePath} replace />} />
          <Route path="analyses" element={hasPermission(currentUser, 'analyses') ? <Analyses /> : <Navigate to={homePath} replace />} />
          <Route path="finances" element={hasPermission(currentUser, 'finances') ? <Finances /> : <Navigate to={homePath} replace />} />
          <Route path="tresorerie" element={hasPermission(currentUser, 'finances') ? <Tresorerie /> : <Navigate to={homePath} replace />} />
          <Route path="depenses" element={hasPermission(currentUser, 'finances') ? <Depenses /> : <Navigate to={homePath} replace />} />
          <Route path="bulletin-salaire" element={hasPermission(currentUser, 'finances') ? <BulletinSalaire /> : <Navigate to={homePath} replace />} />
          <Route path="factures" element={hasPermission(currentUser, 'factures') ? <Factures /> : <Navigate to={fallbackPath} replace />} />
          <Route path="historique" element={hasPermission(currentUser, 'historique') ? <Historique /> : <Navigate to={homePath} replace />} />
          <Route path="utilisateurs" element={hasPermission(currentUser, 'administration') ? <Utilisateurs /> : <Navigate to={fallbackPath} replace />} />
          <Route path="whatsapp" element={hasPermission(currentUser, 'whatsapp') ? <WhatsAppManagement /> : <Navigate to={fallbackPath} replace />} />
          <Route path="admin" element={hasPermission(currentUser, 'administration') ? <Navigate to="/utilisateurs" replace /> : <Navigate to={homePath} replace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

