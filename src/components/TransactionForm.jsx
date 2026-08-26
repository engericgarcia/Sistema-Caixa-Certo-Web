import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatMoney, todayISO } from '../utils/format.js';
import { Button, Field, Input, Modal, MoneyInput, Select, Textarea, parseMoney } from './ui.jsx';

const EMPTY = {
  type: 'despesa',
  description: '',
  amount: '',
  dueDate: todayISO(),
  categoryId: '',
  contactId: '',
  accountId: '',
  documentNumber: '',
  notes: '',
  paid: false,
  paidAt: todayISO(),
  repeatMode: 'unica',
  repeatCount: 2,
  repeatIntervalMonths: 1,
};

/**
 * Formulário de lançamento (contas a pagar e a receber).
 * Quando recebe `transaction`, entra em modo edição — nesse caso as opções de
 * parcelamento/recorrência ficam ocultas, porque valeriam só para novos registros.
 */
export default function TransactionForm({
  open,
  onClose,
  onSaved,
  transaction,
  defaultType = 'despesa',
  lookups,
}) {
  const toast = useToast();
  const isEditing = Boolean(transaction);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (transaction) {
      setForm({
        type: transaction.type,
        description: transaction.description,
        amount: String(transaction.amount).replace('.', ','),
        dueDate: transaction.due_date,
        categoryId: transaction.category_id ?? '',
        contactId: transaction.contact_id ?? '',
        accountId: transaction.account_id ?? '',
        documentNumber: transaction.document_number ?? '',
        notes: transaction.notes ?? '',
        paid: Boolean(transaction.paid_at),
        paidAt: transaction.paid_at ?? todayISO(),
        repeatMode: 'unica',
        repeatCount: 2,
        repeatIntervalMonths: 1,
      });
    } else {
      setForm({ ...EMPTY, type: defaultType, accountId: lookups.accounts[0]?.id ?? '' });
    }
  }, [open, transaction, defaultType, lookups.accounts]);

  const set = (field) => (event) => {
    const value =
      event?.target?.type === 'checkbox' ? event.target.checked : event?.target?.value ?? event;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const categories = useMemo(
    () => lookups.categories.filter((c) => c.type === form.type),
    [lookups.categories, form.type]
  );

  const contacts = useMemo(() => {
    const wanted = form.type === 'receita' ? 'cliente' : 'fornecedor';
    return lookups.contacts.filter((c) => c.type === wanted || c.type === 'ambos');
  }, [lookups.contacts, form.type]);

  const amountNumber = parseMoney(form.amount);
  const repeats = form.repeatMode === 'unica' ? 1 : Number(form.repeatCount) || 1;
  const previewParcela =
    form.repeatMode === 'parcelada' && repeats > 1 ? amountNumber / repeats : amountNumber;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (amountNumber <= 0) {
      setError('Informe um valor maior que zero.');
      return;
    }

    const payload = {
      type: form.type,
      description: form.description.trim(),
      amount: amountNumber,
      dueDate: form.dueDate,
      categoryId: form.categoryId || null,
      contactId: form.contactId || null,
      accountId: form.accountId || null,
      documentNumber: form.documentNumber,
      notes: form.notes,
      paid: form.paid,
      paidAt: form.paid ? form.paidAt : null,
    };

    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/transactions/${transaction.id}`, payload);
        toast.success('Lançamento atualizado.');
      } else {
        const result = await api.post('/transactions', {
          ...payload,
          repeatMode: form.repeatMode,
          repeatCount: repeats,
          repeatIntervalMonths: Number(form.repeatIntervalMonths) || 1,
        });
        toast.success(
          result.created > 1
            ? `${result.created} lançamentos criados.`
            : 'Lançamento criado.'
        );
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Não foi possível salvar');
    } finally {
      setSaving(false);
    }
  }

  const tipoLabel = form.type === 'receita' ? 'recebimento' : 'pagamento';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar lançamento' : 'Novo lançamento'}
      description={
        isEditing
          ? 'Altere os dados e salve para atualizar.'
          : 'Registre uma conta a pagar ou a receber.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-brand-50 p-1">
          {[
            { value: 'receita', label: 'Conta a receber' },
            { value: 'despesa', label: 'Conta a pagar' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setForm((c) => ({ ...c, type: option.value, categoryId: '', contactId: '' }))}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                form.type === option.value
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Field label="Descrição" required>
          <Input
            placeholder={form.type === 'receita' ? 'Ex.: Venda para o cliente X' : 'Ex.: Aluguel da loja'}
            value={form.description}
            onChange={set('description')}
            required
            minLength={2}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valor" required>
            <MoneyInput
              placeholder="0,00"
              value={form.amount}
              onChange={(value) => setForm((c) => ({ ...c, amount: value }))}
              required
            />
          </Field>

          <Field label="Vencimento" required>
            <Input type="date" value={form.dueDate} onChange={set('dueDate')} required />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categoria">
            <Select value={form.categoryId} onChange={set('categoryId')}>
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={form.type === 'receita' ? 'Cliente' : 'Fornecedor'}>
            <Select value={form.contactId} onChange={set('contactId')}>
              <option value="">Não informado</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Conta" hint="Onde o dinheiro entra ou sai.">
            <Select value={form.accountId} onChange={set('accountId')}>
              <option value="">Não informada</option>
              {lookups.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Documento" hint="Nº da nota fiscal ou boleto.">
            <Input
              placeholder="NF 1234"
              value={form.documentNumber}
              onChange={set('documentNumber')}
            />
          </Field>
        </div>

        {/* Parcelamento / recorrência */}
        {!isEditing && (
          <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
            <Field label="Repetição">
              <Select value={form.repeatMode} onChange={set('repeatMode')}>
                <option value="unica">Lançamento único</option>
                <option value="parcelada">Parcelado (divide o valor)</option>
                <option value="recorrente">Recorrente (repete o valor)</option>
              </Select>
            </Field>

            {form.repeatMode !== 'unica' && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label={form.repeatMode === 'parcelada' ? 'Nº de parcelas' : 'Nº de repetições'}>
                  <Input
                    type="number"
                    min={2}
                    max={360}
                    value={form.repeatCount}
                    onChange={set('repeatCount')}
                  />
                </Field>
                <Field label="Intervalo (meses)">
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={form.repeatIntervalMonths}
                    onChange={set('repeatIntervalMonths')}
                  />
                </Field>
                {amountNumber > 0 && (
                  <p className="sm:col-span-2 text-xs text-ink-500">
                    {form.repeatMode === 'parcelada'
                      ? `Serão criadas ${repeats} parcelas de aproximadamente ${formatMoney(previewParcela)}.`
                      : `Serão criados ${repeats} lançamentos de ${formatMoney(amountNumber)} cada.`}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Baixa */}
        <div className="rounded-xl border border-brand-100 p-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.paid}
              onChange={set('paid')}
              className="h-4 w-4 rounded border-brand-300 text-brand-500 focus:ring-brand-200"
            />
            <span className="text-sm font-medium text-ink-700">
              Já houve o {tipoLabel}
            </span>
          </label>

          {form.paid && (
            <Field label={`Data do ${tipoLabel}`} className="mt-4">
              <Input type="date" value={form.paidAt} onChange={set('paidAt')} />
            </Field>
          )}
        </div>

        <Field label="Observações">
          <Textarea
            placeholder="Anotações internas sobre este lançamento..."
            value={form.notes}
            onChange={set('notes')}
          />
        </Field>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-brand-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            {isEditing ? 'Salvar alterações' : 'Criar lançamento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
