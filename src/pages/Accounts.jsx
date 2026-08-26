import { useCallback, useEffect, useState } from 'react';
import { Archive, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatMoney } from '../utils/format.js';
import {
  Badge,
  Button,
  Card,
  ColorPicker,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  MoneyInput,
  PageHeader,
  Select,
  SkeletonCards,
  parseMoney,
} from '../components/ui.jsx';

const TYPES = [
  { value: 'corrente', label: 'Conta corrente' },
  { value: 'poupanca', label: 'Poupança' },
  { value: 'caixa', label: 'Caixa / dinheiro' },
  { value: 'cartao', label: 'Cartão de crédito' },
  { value: 'investimento', label: 'Investimento' },
];

const EMPTY = {
  name: '',
  type: 'corrente',
  bank: '',
  initialBalance: '',
  color: '#3cb46c',
  archived: false,
};

export default function Accounts() {
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { editing }
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAccounts(await api.get('/accounts', { includeArchived: 'true' }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setForm(EMPTY);
    setModal({ editing: null });
  }

  function openEdit(account) {
    setForm({
      name: account.name,
      type: account.type,
      bank: account.bank ?? '',
      initialBalance: String(account.initial_balance).replace('.', ','),
      color: account.color,
      archived: Boolean(account.archived),
    });
    setModal({ editing: account });
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, initialBalance: parseMoney(form.initialBalance) };
      if (modal.editing) {
        await api.put(`/accounts/${modal.editing.id}`, payload);
        toast.success('Conta atualizada.');
      } else {
        await api.post('/accounts', payload);
        toast.success('Conta criada.');
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    try {
      await api.delete(`/accounts/${deleting.id}`);
      toast.success('Conta excluída.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const total = accounts
    .filter((a) => !a.archived)
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <div>
      <PageHeader
        title="Contas bancárias"
        subtitle="Bancos, caixa e cartões onde o dinheiro circula."
        actions={
          <Button onClick={openNew}>
            <Plus size={16} />
            Nova conta
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCards count={6} className="h-[148px]" />
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <EmptyState
            icon={Wallet}
            title="Nenhuma conta cadastrada"
            description="Cadastre a conta do banco ou o caixa da empresa para acompanhar o saldo."
            action={
              <Button onClick={openNew}>
                <Plus size={16} />
                Nova conta
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                Saldo consolidado
              </p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  total < 0 ? 'text-red-600' : 'text-brand-700'
                }`}
              >
                {formatMoney(total)}
              </p>
            </div>
            <p className="max-w-xs text-xs text-ink-500">
              Considera o saldo inicial de cada conta somado aos lançamentos já quitados.
            </p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card key={account.id} className="flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: account.color }}
                  >
                    <Wallet size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink-900">{account.name}</p>
                    <p className="truncate text-xs text-ink-500">
                      {TYPES.find((t) => t.value === account.type)?.label}
                      {account.bank ? ` • ${account.bank}` : ''}
                    </p>
                  </div>
                  {Boolean(account.archived) && (
                    <Badge tone="neutral">
                      <Archive size={12} />
                      Arquivada
                    </Badge>
                  )}
                </div>

                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-ink-500">Saldo atual</p>
                    <p
                      className={`text-xl font-bold ${
                        account.balance < 0 ? 'text-red-600' : 'text-ink-900'
                      }`}
                    >
                      {formatMoney(account.balance)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(account)}>
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Excluir"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => setDeleting(account)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        size="sm"
        title={modal?.editing ? 'Editar conta' : 'Nova conta'}
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Nome" required>
            <Input
              placeholder="Ex.: Conta Corrente"
              value={form.name}
              onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
              required
              minLength={2}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <Select
                value={form.type}
                onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Banco">
              <Input
                placeholder="Opcional"
                value={form.bank}
                onChange={(e) => setForm((c) => ({ ...c, bank: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Saldo inicial" hint="Quanto havia nesta conta antes de usar o sistema.">
            <MoneyInput
              value={form.initialBalance}
              onChange={(value) => setForm((c) => ({ ...c, initialBalance: value }))}
              placeholder="0,00"
            />
          </Field>

          <Field label="Cor">
            <ColorPicker
              value={form.color}
              onChange={(color) => setForm((c) => ({ ...c, color }))}
            />
          </Field>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.archived}
              onChange={(e) => setForm((c) => ({ ...c, archived: e.target.checked }))}
              className="h-4 w-4 rounded border-brand-300 text-brand-500 focus:ring-brand-200"
            />
            <span className="text-sm text-ink-700">
              Arquivar (some das listas, mas mantém o histórico)
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        message={`Excluir a conta "${deleting?.name}"? Os lançamentos ligados a ela ficarão sem conta.`}
      />
    </div>
  );
}
