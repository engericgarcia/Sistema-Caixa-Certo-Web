import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  Settings,
  Tags,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../utils/format.js';
import Logo from './Logo.jsx';

const NAV_GROUPS = [
  {
    title: 'Visão geral',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    title: 'Movimentações',
    items: [
      { to: '/contas-a-receber', label: 'Contas a receber', icon: ArrowDownCircle, badge: 'receita' },
      { to: '/contas-a-pagar', label: 'Contas a pagar', icon: ArrowUpCircle, badge: 'despesa' },
      { to: '/lancamentos', label: 'Todos os lançamentos', icon: ListOrdered },
    ],
  },
  {
    title: 'Cadastros',
    items: [
      { to: '/contas', label: 'Contas bancárias', icon: Wallet },
      { to: '/categorias', label: 'Categorias', icon: Tags },
      { to: '/contatos', label: 'Clientes e fornecedores', icon: Users },
    ],
  },
  {
    title: 'Análise',
    items: [
      { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
      { to: '/configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
];

/**
 * Conta quantos lançamentos estão vencidos, para o menu mostrar o alerta
 * mesmo quando o usuário está em outra tela.
 */
function useOverdueCounts() {
  const [counts, setCounts] = useState({ receita: 0, despesa: 0 });
  const location = useLocation();

  const refresh = useCallback(async () => {
    try {
      const [receber, pagar] = await Promise.all([
        api.get('/transactions', { type: 'receita', status: 'atrasado', pageSize: 1 }),
        api.get('/transactions', { type: 'despesa', status: 'atrasado', pageSize: 1 }),
      ]);
      setCounts({ receita: receber.total, despesa: pagar.total });
    } catch {
      // Um erro aqui não pode quebrar a navegação — apenas não mostra o alerta.
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, location.pathname]);

  return counts;
}

function SidebarContent({ onNavigate, counts }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-500/80">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const overdue = item.badge ? counts[item.badge] : 0;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-xl py-2.5 pl-3 pr-2.5 text-sm font-medium transition ${
                          isActive
                            ? 'bg-brand-100 text-brand-800'
                            : 'text-ink-700 hover:bg-brand-50 hover:text-ink-900'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" />
                          )}
                          <item.icon size={18} className="shrink-0" />
                          <span className="flex-1 truncate">{item.label}</span>
                          {overdue > 0 && (
                            <span
                              title={`${overdue} em atraso`}
                              className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[11px] font-bold text-red-600"
                            >
                              {overdue}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-brand-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white">
            {initials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
            <p className="truncate text-xs text-ink-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sair"
            className="rounded-lg p-2 text-ink-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const counts = useOverdueCounts();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen lg:flex">
      {/* Menu lateral fixo (desktop) */}
      <aside className="hidden w-72 shrink-0 border-r border-brand-100 bg-white lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent counts={counts} />
        </div>
      </aside>

      {/* Menu lateral deslizante (mobile) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 animate-slide-in bg-white shadow-xl">
            <SidebarContent counts={counts} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-brand-100 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <Logo />
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-xl border border-brand-200 p-2 text-ink-700 transition hover:bg-brand-50"
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
