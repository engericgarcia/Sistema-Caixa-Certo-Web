import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  addMonths,
  currentMonth,
  daysUntil,
  formatDate,
  formatMoney,
  monthRange,
  todayISO,
} from '../utils/format.js';
import TransactionForm from './TransactionForm.jsx';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  MoneyInput,
  PageHeader,
  Pagination,
  SegmentedControl,
  Select,
  SkeletonTable,
  StatusBadge,
  parseMoney,
} from './ui.jsx';

const PAGE_SIZE = 15;

const PERIOD_OPTIONS = [
  { value: 'mes', label: 'Este mês' },
  { value: 'mes-passado', label: 'Mês passado' },
  { value: 'trimestre', label: 'Últimos 3 meses' },
  { value: 'ano', label: 'Este ano' },
  { value: 'tudo', label: 'Tudo' },
];

/** Traduz o atalho de período escolhido em datas concretas. */
function resolvePeriod(preset) {
  const mes = currentMonth();
  const ano = mes.slice(0, 4);

  switch (preset) {
    case 'mes':
      return monthRange(mes);
    case 'mes-passado':
      return monthRange(addMonths(mes, -1));
    case 'trimestre':
      return { start: monthRange(addMonths(mes, -2)).start, end: monthRange(mes).end };
    case 'ano':
      return { start: `${ano}-01-01`, end: `${ano}-12-31` };
    case 'tudo':
      return { start: '', end: '' };
    default:
      return null;
  }
}

function SummaryTile({ label, value, tone = 'default' }) {
  const tones = {
    default: 'text-ink-900',
    green: 'text-brand-700',
    amber: 'text-amber-600',
    red: 'text-red-600',
  };
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${tones[tone]}`}>
        {formatMoney(value)}
      </p>
    </div>
  );
}

/** Cabeçalho de coluna que ordena a listagem ao ser clicado. */
function SortHeader({ field, children, sort, order, onSort, className = '' }) {
  const active = sort === field;
  return (
    <th className={`px-4 py-3 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 uppercase tracking-wide transition hover:text-brand-700 ${
          active ? 'text-brand-700' : ''
        }`}
      >
        {children}
        {active &&
          (order === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    </th>
  );
}

/**
 * Tela de listagem usada por "Contas a pagar", "Contas a receber" e
 * "Todos os lançamentos" — muda apenas o `type` e os textos.
 */
export default function TransactionsView({ type, title, subtitle }) {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [period, setPeriod] = useState('mes');
  const [filters, setFilters] = useState(() => ({
    status: searchParams.get('status') || '',
    ...monthRange(currentMonth()),
    categoryId: '',
    contactId: '',
    accountId: '',
    search: '',
  }));
  const [sorting, setSorting] = useState({ sort: 'due_date', order: 'asc' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [lookups, setLookups] = useState({ categories: [], contacts: [], accounts: [] });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [paying, setPaying] = useState(null);

  // Cadastros auxiliares (uma vez por tela)
  useEffect(() => {
    (async () => {
      try {
        const [categories, contacts, accounts] = await Promise.all([
          api.get('/categories'),
          api.get('/contacts'),
          api.get('/accounts'),
        ]);
        setLookups({ categories, contacts, accounts });
      } catch (err) {
        toast.error(err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/transactions', {
        type,
        status: filters.status,
        // O estado guarda start/end; a API espera from/to.
        from: filters.start,
        to: filters.end,
        categoryId: filters.categoryId,
        contactId: filters.contactId,
        accountId: filters.accountId,
        search: filters.search,
        ...sorting,
        page,
        pageSize: PAGE_SIZE,
      });
      setResult(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [type, filters, sorting, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Mantém o filtro de situação na URL (permite compartilhar e voltar).
  useEffect(() => {
    const next = new URLSearchParams();
    if (filters.status) next.set('status', filters.status);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status]);

  const updateFilter = (field) => (event) => {
    const value = event?.target?.value ?? event;
    setPage(1);
    setFilters((current) => ({ ...current, [field]: value }));
    if (field === 'start' || field === 'end') setPeriod('personalizado');
  };

  function changePeriod(preset) {
    const range = resolvePeriod(preset);
    setPeriod(preset);
    setPage(1);
    if (range) setFilters((current) => ({ ...current, ...range }));
  }

  function toggleSort(field) {
    setPage(1);
    setSorting((current) =>
      current.sort === field
        ? { sort: field, order: current.order === 'asc' ? 'desc' : 'asc' }
        : { sort: field, order: 'asc' }
    );
  }

  const clearFilters = () => {
    setPage(1);
    setPeriod('mes');
    setFilters({
      status: '',
      ...monthRange(currentMonth()),
      categoryId: '',
      contactId: '',
      accountId: '',
      search: '',
    });
  };

  const activeFilterCount = useMemo(
    () =>
      [filters.categoryId, filters.contactId, filters.accountId].filter(Boolean).length,
    [filters]
  );

  async function handleDelete(scope) {
    setDeleteLoading(true);
    try {
      const { deleted } = await api.delete(
        `/transactions/${deleting.id}`,
        scope === 'group' ? { scope: 'group' } : undefined
      );
      toast.success(deleted > 1 ? `${deleted} lançamentos excluídos.` : 'Lançamento excluído.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleUnpay(transaction) {
    try {
      await api.post(`/transactions/${transaction.id}/unpay`);
      toast.info('Baixa estornada.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function exportCsv() {
    try {
      const response = await api.download('/reports/export.csv', {
        type,
        from: filters.start,
        to: filters.end,
        status: filters.status === 'pago' ? 'pago' : filters.status ? 'em_aberto' : '',
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'lancamentos.csv';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Arquivo CSV gerado.');
    } catch (err) {
      toast.error(err.message);
    }
  }

  const summary = result?.summary;
  const rows = result?.data ?? [];
  const isReceita = type === 'receita';

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv}>
              <Download size={16} />
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button onClick={openNew}>
              <Plus size={16} />
              Novo lançamento
            </Button>
          </>
        }
      />

      {/* Atalhos de período */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedControl value={period} onChange={changePeriod} options={PERIOD_OPTIONS} />
        {period === 'personalizado' && (
          <Badge tone="green">
            {filters.start ? formatDate(filters.start) : 'início'} até{' '}
            {filters.end ? formatDate(filters.end) : 'hoje'}
          </Badge>
        )}
      </div>

      {/* Resumo do período filtrado */}
      <Card className="mb-4 grid grid-cols-2 divide-brand-100 sm:grid-cols-4 sm:divide-x">
        {summary ? (
          <>
            <SummaryTile label="Total do período" value={summary.total} />
            <SummaryTile
              label={isReceita ? 'Recebido' : 'Pago'}
              value={summary.paid}
              tone="green"
            />
            <SummaryTile label="Em aberto" value={summary.open} tone="amber" />
            <SummaryTile label="Vencido" value={summary.overdue} tone="red" />
          </>
        ) : (
          <div className="col-span-full h-[76px]" />
        )}
      </Card>

      {/* Busca e filtros */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <Input
              className="pl-10"
              placeholder="Buscar por descrição, documento ou observação..."
              value={filters.search}
              onChange={updateFilter('search')}
            />
          </div>

          <Select
            className="w-auto min-w-[150px]"
            value={filters.status}
            onChange={updateFilter('status')}
          >
            <option value="">Todas as situações</option>
            <option value="em_aberto">Em aberto</option>
            <option value="pendente">A vencer</option>
            <option value="atrasado">Atrasadas</option>
            <option value="pago">{isReceita ? 'Recebidas' : 'Pagas'}</option>
          </Select>

          <Button
            variant={showFilters ? 'subtle' : 'secondary'}
            onClick={() => setShowFilters((open) => !open)}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="grid gap-4 border-t border-brand-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="De">
              <Input type="date" value={filters.start} onChange={updateFilter('start')} />
            </Field>
            <Field label="Até">
              <Input type="date" value={filters.end} onChange={updateFilter('end')} />
            </Field>
            <Field label="Categoria">
              <Select value={filters.categoryId} onChange={updateFilter('categoryId')}>
                <option value="">Todas</option>
                {lookups.categories
                  .filter((c) => !type || c.type === type)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label={isReceita ? 'Cliente' : 'Contato'}>
              <Select value={filters.contactId} onChange={updateFilter('contactId')}>
                <option value="">Todos</option>
                {lookups.contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Conta">
              <Select value={filters.accountId} onChange={updateFilter('accountId')}>
                <option value="">Todas</option>
                {lookups.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="lg:col-span-5">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X size={14} />
                Limpar filtros
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Listagem */}
      <Card className="overflow-hidden">
        {loading && !result ? (
          <SkeletonTable rows={6} columns={5} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum lançamento encontrado"
            description="Ajuste o período ou os filtros — ou registre um novo lançamento para começar."
            action={
              <Button onClick={openNew}>
                <Plus size={16} />
                Novo lançamento
              </Button>
            }
          />
        ) : (
          <>
            {/* Tabela (telas médias para cima) */}
            <div className="hidden md:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="table-head">
                    <SortHeader
                      field="due_date"
                      sort={sorting.sort}
                      order={sorting.order}
                      onSort={toggleSort}
                    >
                      Vencimento
                    </SortHeader>
                    <SortHeader
                      field="description"
                      sort={sorting.sort}
                      order={sorting.order}
                      onSort={toggleSort}
                    >
                      Descrição
                    </SortHeader>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="hidden px-4 py-3 xl:table-cell">
                      {isReceita ? 'Cliente' : 'Contato'}
                    </th>
                    <th className="px-4 py-3">Situação</th>
                    <SortHeader
                      field="amount"
                      sort={sorting.sort}
                      order={sorting.order}
                      onSort={toggleSort}
                      className="text-right [&>button]:flex-row-reverse"
                    >
                      Valor
                    </SortHeader>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {rows.map((row) => (
                    <tr key={row.id} className="group transition hover:bg-brand-50/50">
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-ink-700">
                        {formatDate(row.due_date)}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-ink-900">{row.description}</p>
                        <p className="text-xs text-ink-500">
                          {row.installment_total
                            ? `Parcela ${row.installment_no}/${row.installment_total}`
                            : row.document_number || row.account_name || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-ink-700">
                        {row.category_name ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: row.category_color }}
                            />
                            {row.category_name}
                          </span>
                        ) : (
                          <span className="text-ink-500">—</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3.5 text-sm text-ink-700 xl:table-cell">
                        {row.contact_name || <span className="text-ink-500">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={row.status} type={row.type} />
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold tabular-nums ${
                          row.type === 'receita' ? 'text-brand-700' : 'text-red-600'
                        }`}
                      >
                        {row.type === 'receita' ? '+' : '−'} {formatMoney(row.amount)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {row.status === 'pago' ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Estornar baixa"
                              onClick={() => handleUnpay(row)}
                            >
                              <RotateCcw size={16} />
                            </Button>
                          ) : (
                            <Button variant="subtle" size="sm" onClick={() => setPaying(row)}>
                              <CheckCircle2 size={15} />
                              {row.type === 'receita' ? 'Receber' : 'Pagar'}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar"
                            onClick={() => openEdit(row)}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => setDeleting(row)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards (celular) */}
            <ul className="divide-y divide-brand-100 md:hidden">
              {rows.map((row) => {
                const dias = daysUntil(row.due_date);
                return (
                  <li key={row.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink-900">{row.description}</p>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {formatDate(row.due_date)}
                          {row.contact_name ? ` • ${row.contact_name}` : ''}
                          {row.installment_total
                            ? ` • ${row.installment_no}/${row.installment_total}`
                            : ''}
                        </p>
                      </div>
                      <p
                        className={`shrink-0 text-sm font-bold tabular-nums ${
                          row.type === 'receita' ? 'text-brand-700' : 'text-red-600'
                        }`}
                      >
                        {row.type === 'receita' ? '+' : '−'} {formatMoney(row.amount)}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status={row.status} type={row.type} />
                      {row.status !== 'pago' && (
                        <Badge tone={dias < 0 ? 'red' : dias <= 3 ? 'amber' : 'neutral'}>
                          {dias < 0
                            ? `${Math.abs(dias)}d em atraso`
                            : dias === 0
                              ? 'vence hoje'
                              : `em ${dias}d`}
                        </Badge>
                      )}
                      {row.category_name && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: row.category_color }}
                          />
                          {row.category_name}
                        </span>
                      )}

                      <div className="ml-auto flex items-center gap-1">
                        {row.status === 'pago' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Estornar baixa"
                            onClick={() => handleUnpay(row)}
                          >
                            <RotateCcw size={16} />
                          </Button>
                        ) : (
                          <Button variant="subtle" size="sm" onClick={() => setPaying(row)}>
                            <CheckCircle2 size={15} />
                            {row.type === 'receita' ? 'Receber' : 'Pagar'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => setDeleting(row)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              onChange={setPage}
            />
          </>
        )}
      </Card>

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        transaction={editing}
        defaultType={type || 'despesa'}
        lookups={lookups}
      />

      <PayModal
        transaction={paying}
        accounts={lookups.accounts}
        onClose={() => setPaying(null)}
        onDone={() => {
          setPaying(null);
          load();
        }}
      />

      <DeleteDialog
        transaction={deleting}
        loading={deleteLoading}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

/** Exclusão: quando o lançamento é parcelado, oferece remover o grupo inteiro. */
function DeleteDialog({ transaction, loading, onClose, onConfirm }) {
  if (!transaction) return null;
  const isGroup = Boolean(transaction.group_id);

  return (
    <Modal open onClose={onClose} size="sm" title="Excluir lançamento">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Trash2 size={18} />
        </div>
        <div className="pt-1.5">
          <p className="text-sm text-ink-700">
            Excluir <strong>{transaction.description}</strong>?
          </p>
          {isGroup && (
            <p className="mt-1 text-xs text-ink-500">
              Este lançamento é a parcela {transaction.installment_no} de{' '}
              {transaction.installment_total}.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Button variant="danger" onClick={() => onConfirm('single')} loading={loading}>
          Excluir só este lançamento
        </Button>
        {isGroup && (
          <Button variant="secondary" onClick={() => onConfirm('group')} loading={loading}>
            Excluir também as parcelas em aberto
          </Button>
        )}
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Modal>
  );
}

/** Modal de baixa: confirma data, valor e conta. */
function PayModal({ transaction, accounts, onClose, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ paidAt: todayISO(), paidAmount: '', accountId: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setForm({
        paidAt: todayISO(),
        paidAmount: String(transaction.amount).replace('.', ','),
        accountId: transaction.account_id ?? accounts[0]?.id ?? '',
      });
    }
  }, [transaction, accounts]);

  if (!transaction) return null;
  const isReceita = transaction.type === 'receita';

  async function confirm(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post(`/transactions/${transaction.id}/pay`, {
        paidAt: form.paidAt,
        paidAmount: parseMoney(form.paidAmount) || transaction.amount,
        accountId: form.accountId || null,
      });
      toast.success(isReceita ? 'Recebimento registrado.' : 'Pagamento registrado.');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={isReceita ? 'Registrar recebimento' : 'Registrar pagamento'}
      description={transaction.description}
    >
      <form onSubmit={confirm} className="space-y-4">
        <Field label={isReceita ? 'Data do recebimento' : 'Data do pagamento'} required>
          <Input
            type="date"
            value={form.paidAt}
            onChange={(e) => setForm((c) => ({ ...c, paidAt: e.target.value }))}
            required
          />
        </Field>

        <Field
          label="Valor"
          hint="Pode ser alterado caso o valor pago tenha sido diferente (juros, desconto)."
        >
          <MoneyInput
            value={form.paidAmount}
            onChange={(value) => setForm((c) => ({ ...c, paidAmount: value }))}
          />
        </Field>

        <Field label="Conta">
          <Select
            value={form.accountId}
            onChange={(e) => setForm((c) => ({ ...c, accountId: e.target.value }))}
          >
            <option value="">Não informada</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            <CheckCircle2 size={16} />
            Confirmar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
