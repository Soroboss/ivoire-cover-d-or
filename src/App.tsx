import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Couvaisons from './pages/Couvaisons';
import Finances from './pages/Finances';
import Tresorerie from './pages/Tresorerie';
import Factures from './pages/Factures';
import Machines from './pages/Machines';
import Analyses from './pages/Analyses';
import Utilisateurs from './pages/Utilisateurs';
import Historique from './pages/Historique';
import ClientsDB from './pages/ClientsDB';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import { hasPermission } from './lib/permissions';

function App() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  const homePath = hasPermission(currentUser, 'dashboard') ? '/dashboard' : '/couvaisons';
  const fallbackPath = '/couvaisons';

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to={homePath} replace />} />
          <Route
            path="dashboard"
            element={
              hasPermission(currentUser, 'dashboard') ? <Dashboard /> : <Navigate to={fallbackPath} replace />
            }
          />
          <Route
            path="couvaisons"
            element={
              hasPermission(currentUser, 'couvaisons') ? <Couvaisons /> : <Navigate to={homePath} replace />
            }
          />
          <Route
            path="machines"
            element={
              hasPermission(currentUser, 'machines') ? <Machines /> : <Navigate to={homePath} replace />
            }
          />
          <Route
            path="clients"
            element={
              hasPermission(currentUser, 'clients') ? <ClientsDB /> : <Navigate to={homePath} replace />
            }
          />
          <Route
            path="analyses"
            element={
              hasPermission(currentUser, 'analyses') ? <Analyses /> : <Navigate to={homePath} replace />
            }
          />
          <Route
            path="finances"
            element={
              hasPermission(currentUser, 'finances') ? <Finances /> : <Navigate to={homePath} replace />
            }
          />
          <Route
            path="tresorerie"
            element={
              hasPermission(currentUser, 'finances') ? <Tresorerie /> : <Navigate to={homePath} replace />
            }
          />
          <Route
            path="factures"
            element={
              hasPermission(currentUser, 'factures') ? <Factures /> : <Navigate to={fallbackPath} replace />
            }
          />
          <Route
            path="historique"
            element={
              hasPermission(currentUser, 'historique') ? <Historique /> : <Navigate to={homePath} replace />
            }
          />
          <Route
            path="utilisateurs"
            element={
              hasPermission(currentUser, 'administration') ? (
                <Utilisateurs />
              ) : (
                <Navigate to={fallbackPath} replace />
              )
            }
          />
          <Route
            path="admin"
            element={
              hasPermission(currentUser, 'administration') ? (
                <Navigate to="/utilisateurs" replace />
              ) : (
                <Navigate to={homePath} replace />
              )
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
