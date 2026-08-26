import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { Spinner } from './components/ui.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Payables from './pages/Payables.jsx';
import Receivables from './pages/Receivables.jsx';
import AllTransactions from './pages/AllTransactions.jsx';
import Accounts from './pages/Accounts.jsx';
import Categories from './pages/Categories.jsx';
import Contacts from './pages/Contacts.jsx';
import Reports from './pages/Reports.jsx';
import SettingsPage from './pages/Settings.jsx';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Carregando o sistema..." />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/entrar" element={<Login />} />
        <Route path="/criar-conta" element={<Register />} />
        <Route path="*" element={<Navigate to="/entrar" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/contas-a-pagar" element={<Payables />} />
        <Route path="/contas-a-receber" element={<Receivables />} />
        <Route path="/lancamentos" element={<AllTransactions />} />
        <Route path="/contas" element={<Accounts />} />
        <Route path="/categorias" element={<Categories />} />
        <Route path="/contatos" element={<Contacts />} />
        <Route path="/relatorios" element={<Reports />} />
        <Route path="/configuracoes" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
