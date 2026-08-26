import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, TrendingDown, TrendingUp } from 'lucide-react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  currentMonth,
  formatAxis,
  formatMoney,
  formatMonthShort,
  monthRange,
} from '../utils/format.js';
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
} from '../components/ui.jsx';

const TABS = [
  { id: 'fluxo', label: 'Fluxo de caixa' },
  { id: 'dre', label: 'Resultado (DRE)' },
  { id: 'categorias', label: 'Por categoria' },
];

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

export default function Reports() {
  const toast = useToast();
  const [tab, setTab] = useState('fluxo');
  const [regime, setRegime] = useState('caixa');

  const startOfYear = `${currentMonth().slice(0, 4)}-01-01`;
  const [period, setPeriod] = useState({
    from: startOfYear,
    to: monthRange(currentMonth()).end,
  });
  const [months, setMonths] = useState(12);
  const [categoryType, setCategoryType] = useState('despesa');

  const [cashflow, setCashflow] = useState(null);
  const [dre, setDre] = useState(null);
  const [byCategory, setByCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'fluxo') {
        setCashflow(await api.get('/reports/cashflow', { months, regime }));
      } else if (tab === 'dre') {
        setDre(await api.get('/reports/dre', { ...period, regime }));
      } else {
        setByCategory(
          await api.get('/reports/by-category', { ...period, regime, type: categoryType })
        );
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab, regime, period, months, categoryType, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function exportCsv() {
    try {
      const response = await api.download('/reports/export.csv', period);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'relatorio-lancamentos.csv';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Arquivo CSV gerado.');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Relatórios"
        subtitle="Fluxo de caixa, resultado do período e composição por categoria."
        actions={
          <Button variant="secondary" onClick={exportCsv}>
            <Download size={16} />
            Exportar CSV
          </Button>
        }
      />

      {/* Abas */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-brand-200 bg-white p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === item.id ? 'bg-brand-100 text-brand-800' : 'text-ink-500 hover:bg-brand-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <Card className="mb-4 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Regime" hint="Caixa = pela data do pagamento.">
          <Select value={regime} onChange={(e) => setRegime(e.target.value)}>
            <option value="caixa">Caixa (realizado)</option>
            <option value="competencia">Competência (vencimento)</option>
          </Select>
        </Field>

        {tab === 'fluxo' ? (
          <Field label="Período">
            <Select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Últimos 12 meses</option>
              <option value={24}>Últimos 24 meses</option>
            </Select>
          </Field>
        ) : (
          <>
            <Field label="De">
              <Input
                type="date"
                value={period.from}
                onChange={(e) => setPeriod((c) => ({ ...c, from: e.target.value }))}
              />
            </Field>
            <Field label="Até">
              <Input
                type="date"
                value={period.to}
                onChange={(e) => setPeriod((c) => ({ ...c, to: e.target.value }))}
              />
            </Field>
          </>
        )}

        {tab === 'categorias' && (
          <Field label="Tipo">
            <Select value={categoryType} onChange={(e) => setCategoryType(e.target.value)}>
              <option value="despesa">Despesas</option>
              <option value="receita">Receitas</option>
            </Select>
          </Field>
        )}
      </Card>

      {loading ? (
        <Spinner label="Calculando..." />
      ) : tab === 'fluxo' ? (
        <CashflowReport data={cashflow} />
      ) : tab === 'dre' ? (
        <DreReport data={dre} />
      ) : (
        <CategoryReport data={byCategory} />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
function CashflowReport({ data }) {
  if (!data) return null;
  const chartData = data.data.map((row) => ({ ...row, label: formatMonthShort(row.month) }));
  const ultimo = data.data[data.data.length - 1];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-ink-500">Saldo no início do período</p>
          <p className="mt-1 text-xl font-bold text-ink-900">{formatMoney(data.opening)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-500">Saldo projetado no fim</p>
          <p
            className={`mt-1 text-xl font-bold ${
              (ultimo?.saldoFinal ?? 0) < 0 ? 'text-red-600' : 'text-brand-700'
            }`}
          >
            {formatMoney(ultimo?.saldoFinal ?? 0)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-500">Variação no período</p>
          <p className="mt-1 text-xl font-bold text-ink-900">
            {formatMoney((ultimo?.saldoFinal ?? 0) - data.opening)}
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-ink-900">Entradas, saídas e saldo acumulado</h2>
        <p className="mb-4 text-xs text-ink-500">
          As barras mostram o movimento do mês; a linha mostra o saldo acumulado.
        </p>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
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
              <Bar dataKey="entradas" name="Entradas" fill="#3cb46c" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar dataKey="saidas" name="Saídas" fill="#f87171" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Line
                type="monotone"
                dataKey="saldoFinal"
                name="Saldo acumulado"
                stroke="#1f5d3b"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="table-head">
                <th className="px-5 py-3">Mês</th>
                <th className="px-5 py-3 text-right">Saldo inicial</th>
                <th className="px-5 py-3 text-right">Entradas</th>
                <th className="px-5 py-3 text-right">Saídas</th>
                <th className="px-5 py-3 text-right">Resultado</th>
                <th className="px-5 py-3 text-right">Saldo final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100 text-sm">
              {data.data.map((row) => (
                <tr key={row.month} className="hover:bg-brand-50/50">
                  <td className="px-5 py-3 font-medium text-ink-900">
                    {formatMonthShort(row.month)}
                  </td>
                  <td className="px-5 py-3 text-right text-ink-700">
                    {formatMoney(row.saldoInicial)}
                  </td>
                  <td className="px-5 py-3 text-right text-brand-700">
                    {formatMoney(row.entradas)}
                  </td>
                  <td className="px-5 py-3 text-right text-red-600">{formatMoney(row.saidas)}</td>
                  <td
                    className={`px-5 py-3 text-right font-semibold ${
                      row.resultado < 0 ? 'text-red-600' : 'text-brand-700'
                    }`}
                  >
                    {formatMoney(row.resultado)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-ink-900">
                    {formatMoney(row.saldoFinal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
function DreLines({ title, items, total, tone }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-brand-100 px-5 py-4">
        <h3 className="font-semibold text-ink-900">{title}</h3>
        <span className={`font-bold ${tone === 'green' ? 'text-brand-700' : 'text-red-600'}`}>
          {formatMoney(total)}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink-500">Nada registrado no período.</p>
      ) : (
        <ul className="divide-y divide-brand-100 text-sm">
          {items.map((item) => {
            const percent = total > 0 ? (item.total / total) * 100 : 0;
            return (
              <li key={item.name} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-ink-700">{item.name}</span>
                  <span className="shrink-0 font-medium text-ink-900">
                    {formatMoney(item.total)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-brand-50">
                  <div
                    className={`h-full rounded-full ${
                      tone === 'green' ? 'bg-brand-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function DreReport({ data }) {
  if (!data) return null;
  const positivo = data.resultado >= 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-ink-500">Total de receitas</p>
          <p className="mt-1 text-xl font-bold text-brand-700">
            {formatMoney(data.totalReceitas)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-500">Total de despesas</p>
          <p className="mt-1 text-xl font-bold text-red-600">{formatMoney(data.totalDespesas)}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-500">Resultado do período</p>
              <p
                className={`mt-1 text-xl font-bold ${
                  positivo ? 'text-brand-700' : 'text-red-600'
                }`}
              >
                {formatMoney(data.resultado)}
              </p>
              <p className="mt-1 text-xs text-ink-500">Margem de {data.margem}%</p>
            </div>
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                positivo ? 'bg-brand-100 text-brand-700' : 'bg-red-50 text-red-600'
              }`}
            >
              {positivo ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </span>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DreLines
          title="Receitas por categoria"
          items={data.receitas}
          total={data.totalReceitas}
          tone="green"
        />
        <DreLines
          title="Despesas por categoria"
          items={data.despesas}
          total={data.totalDespesas}
          tone="red"
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
function CategoryReport({ data }) {
  if (!data) return null;

  if (data.data.length === 0) {
    return (
      <Card>
        <p className="px-5 py-16 text-center text-sm text-ink-500">
          Nenhum lançamento no período selecionado.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h3 className="font-semibold text-ink-900">
          Composição das {data.type === 'receita' ? 'receitas' : 'despesas'}
        </h3>
        <p className="mb-2 text-xs text-ink-500">Total de {formatMoney(data.total)}</p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.data}
                dataKey="total"
                nameKey="name"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
                stroke="none"
              >
                {data.data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="table-head">
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3 text-right">Lançamentos</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100 text-sm">
              {data.data.map((row) => (
                <tr key={row.name} className="hover:bg-brand-50/50">
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="text-ink-700">{row.name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-ink-500">{row.quantidade}</td>
                  <td className="px-5 py-3 text-right font-semibold text-ink-900">
                    {formatMoney(row.total)}
                  </td>
                  <td className="px-5 py-3 text-right text-ink-700">{row.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
