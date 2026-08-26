import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Plus,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { api } from '../api/client.js';
import TransactionForm from '../components/TransactionForm.jsx';
import { Badge, Button, Card, Skeleton, SkeletonCards } from '../components/ui.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  addMonths,
  currentMonth,
  daysUntil,
  formatAxis,
  formatDate,
  formatMoney,
  formatMonthLong,
  formatMonthShort,
} from '../utils/format.js';

function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-100 text-brand-700',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-slate-100 text-ink-700',
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-brand-100 bg-white px-3 py-2 text-xs shadow-card">
      <p className="mb-1 font-semibold text-ink-900">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey ?? item.name} className="flex items-center gap-2 text-ink-700">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color || item.payload?.color }}
          />
          {item.name}: <strong>{formatMoney(item.value)}</strong>
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const toast = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Formulário rápido, para lançar direto do painel
  const [lookups, setLookups] = useState({ categories: [], contacts: [], accounts: [] });
  const [quickType, setQuickType] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.get('/dashboard', { month }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [month, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const [categories, contacts, accounts] = await Promise.all([
          api.get('/categories'),
          api.get('/contacts'),
          api.get('/accounts'),
        ]);
        setLookups({ categories, contacts, accounts });
      } catch {
        // Sem os cadastros o painel continua funcionando; só o atalho fica limitado.
      }
    })();
  }, []);

  if (loading && !data) return <DashboardSkeleton />;
  if (!data) return null;

  const { totals, overdue } = data;
  const chartData = data.monthly.map((m) => ({ ...m, label: formatMonthShort(m.month) }));
  const resultadoPositivo = totals.resultadoPrevisto >= 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho com navegação de mês e atalhos */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-500">
            Resumo financeiro de {formatMonthLong(month)}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setQuickType('receita')}>
            <Plus size={16} />
            Receita
          </Button>
          <Button onClick={() => setQuickType('despesa')}>
            <Plus size={16} />
            Despesa
          </Button>

        <div className="flex items-center gap-1 rounded-xl border border-brand-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, -1))}
            className="rounded-lg p-2 text-ink-500 transition hover:bg-brand-50 hover:text-ink-900"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[132px] px-2 text-center text-sm font-semibold text-ink-900">
            {formatMonthLong(month)}
          </span>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            className="rounded-lg p-2 text-ink-500 transition hover:bg-brand-50 hover:text-ink-900"
            aria-label="Próximo mês"
          >
            <ChevronRight size={16} />
          </button>
          {month !== currentMonth() && (
            <button
              type="button"
              onClick={() => setMonth(currentMonth())}
              className="rounded-lg px-2.5 py-2 text-xs font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              Hoje
            </button>
          )}
        </div>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Saldo em contas"
          value={formatMoney(data.balance)}
          hint="Somente valores já movimentados"
          tone="brand"
        />
        <StatCard
          icon={ArrowDownCircle}
          label="A receber no mês"
          value={formatMoney(totals.aReceber)}
          hint={`${formatMoney(totals.recebido)} já recebidos`}
          tone="green"
        />
        <StatCard
          icon={ArrowUpCircle}
          label="A pagar no mês"
          value={formatMoney(totals.aPagar)}
          hint={`${formatMoney(totals.pago)} já pagos`}
          tone="red"
        />
        <StatCard
          icon={resultadoPositivo ? TrendingUp : AlertTriangle}
          label="Resultado previsto"
          value={formatMoney(totals.resultadoPrevisto)}
          hint={`Realizado: ${formatMoney(totals.resultadoRealizado)}`}
          tone={resultadoPositivo ? 'green' : 'red'}
        />
      </div>

      {/* Alerta de atrasos */}
      {overdue.quantidade > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertTriangle size={20} className="text-amber-600" />
          <p className="flex-1 text-sm text-amber-900">
            Você tem <strong>{overdue.quantidade}</strong>{' '}
            {overdue.quantidade === 1 ? 'lançamento vencido' : 'lançamentos vencidos'} —{' '}
            <strong>{formatMoney(overdue.pagar)}</strong> a pagar e{' '}
            <strong>{formatMoney(overdue.receber)}</strong> a receber.
          </p>
          <Link
            to="/contas-a-pagar?status=atrasado"
            className="text-sm font-semibold text-amber-800 underline-offset-2 hover:underline"
          >
            Ver pendências
          </Link>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-ink-900">Receitas x Despesas</h2>
              <p className="text-xs text-ink-500">Últimos 6 meses, por vencimento</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1f8e8" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#64748b" />
                <YAxis
                  tickFormatter={formatAxis}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="#64748b"
                  width={72}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f2fcf5' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="receitas" name="Receitas" fill="#3cb46c" radius={[6, 6, 0, 0]} maxBarSize={38} />
                <Bar dataKey="despesas" name="Despesas" fill="#f87171" radius={[6, 6, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-ink-900">Despesas por categoria</h2>
          <p className="mb-2 text-xs text-ink-500">{formatMonthLong(month)}</p>
          {data.byCategory.length === 0 ? (
            <p className="py-16 text-center text-sm text-ink-500">
              Nenhuma despesa registrada neste mês.
            </p>
          ) : (
            <>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.byCategory}
                      dataKey="total"
                      nameKey="name"
                      innerRadius="58%"
                      outerRadius="88%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {data.byCategory.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-2">
                {data.byCategory.slice(0, 5).map((item) => (
                  <li key={item.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="flex-1 truncate text-ink-700">{item.name}</span>
                    <span className="font-semibold text-ink-900">{formatMoney(item.total)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      {/* Evolução do resultado + próximos vencimentos */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <h2 className="font-semibold text-ink-900">Evolução do resultado</h2>
          <p className="mb-4 text-xs text-ink-500">Receitas menos despesas em cada mês</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaResultado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3cb46c" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3cb46c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1f8e8" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#64748b" />
                <YAxis
                  tickFormatter={formatAxis}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="#64748b"
                  width={72}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="resultado"
                  name="Resultado"
                  stroke="#2a9557"
                  strokeWidth={2.5}
                  fill="url(#areaResultado)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <h2 className="font-semibold text-ink-900">Contas nos próximos 30 dias</h2>
          <p className="mb-3 text-xs text-ink-500">Ordenadas por vencimento</p>

          {data.upcoming.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-500">
              Nenhuma conta em aberto por perto. Tudo em dia!
            </p>
          ) : (
            <ul className="flex-1 divide-y divide-brand-100">
              {data.upcoming.map((item) => {
                const dias = daysUntil(item.due_date);
                return (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        item.type === 'receita'
                          ? 'bg-brand-100 text-brand-700'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {item.type === 'receita' ? (
                        <ArrowDownCircle size={16} />
                      ) : (
                        <ArrowUpCircle size={16} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {item.description}
                      </p>
                      <p className="text-xs text-ink-500">
                        {formatDate(item.due_date)}
                        {item.contact_name ? ` • ${item.contact_name}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          item.type === 'receita' ? 'text-brand-700' : 'text-red-600'
                        }`}
                      >
                        {formatMoney(item.amount)}
                      </p>
                      <Badge tone={dias < 0 ? 'red' : dias <= 3 ? 'amber' : 'neutral'}>
                        {dias < 0
                          ? `${Math.abs(dias)}d atrasado`
                          : dias === 0
                            ? 'vence hoje'
                            : `em ${dias}d`}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Contas bancárias */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-ink-900">Saldo por conta</h2>
            <p className="text-xs text-ink-500">Considerando apenas lançamentos quitados</p>
          </div>
          <Link to="/contas" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Gerenciar
          </Link>
        </div>

        {data.accounts.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-500">
            Nenhuma conta cadastrada ainda.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: account.color }}
                >
                  <PiggyBank size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">{account.name}</p>
                  <p className="text-xs capitalize text-ink-500">{account.type}</p>
                </div>
                <p
                  className={`text-sm font-bold ${
                    account.balance < 0 ? 'text-red-600' : 'text-ink-900'
                  }`}
                >
                  {formatMoney(account.balance)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <TransactionForm
        open={Boolean(quickType)}
        onClose={() => setQuickType(null)}
        onSaved={load}
        defaultType={quickType || 'despesa'}
        lookups={lookups}
      />
    </div>
  );
}

/** Esqueleto exibido enquanto os números do painel são calculados. */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-11 w-48 rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonCards count={4} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-[340px] rounded-2xl xl:col-span-2" />
        <Skeleton className="h-[340px] rounded-2xl" />
      </div>
    </div>
  );
}
