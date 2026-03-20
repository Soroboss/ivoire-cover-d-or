import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Couvaisons from './pages/Couvaisons';
import Finances from './pages/Finances';
import Factures from './pages/Factures';
import Machines from './pages/Machines';
import Analyses from './pages/Analyses';
import Utilisateurs from './pages/Utilisateurs';
import Historique from './pages/Historique';
import ClientsDB from './pages/ClientsDB';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';

function App() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to={currentUser.role === 'Technicien' ? "/couvaisons" : "/dashboard"} replace />} />
          <Route path="dashboard" element={['Admin', 'Réception/Caisse'].includes(currentUser.role) ? <Dashboard /> : <Navigate to="/couvaisons" replace />} />
          <Route path="couvaisons" element={<Couvaisons />} />
          <Route path="machines" element={['Admin', 'Technicien'].includes(currentUser.role) ? <Machines /> : <Navigate to="/dashboard" replace />} />
          <Route path="clients" element={['Admin', 'Technicien', 'Réception/Caisse'].includes(currentUser.role) ? <ClientsDB /> : <Navigate to="/dashboard" replace />} />
          <Route path="analyses" element={['Admin', 'Technicien'].includes(currentUser.role) ? <Analyses /> : <Navigate to="/dashboard" replace />} />
          <Route path="finances" element={currentUser.role === 'Admin' ? <Finances /> : <Navigate to="/dashboard" replace />} />
          <Route path="factures" element={['Admin', 'Réception/Caisse'].includes(currentUser.role) ? <Factures /> : <Navigate to="/couvaisons" replace />} />
          <Route path="historique" element={currentUser.role === 'Admin' ? <Historique /> : <Navigate to="/dashboard" replace />} />
          <Route path="utilisateurs" element={currentUser.role === 'Admin' ? <Utilisateurs /> : <Navigate to="/couvaisons" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
