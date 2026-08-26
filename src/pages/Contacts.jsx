import { useCallback, useEffect, useState } from 'react';
import { Mail, Pencil, Phone, Plus, Search, Trash2, Users } from 'lucide-react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatMoney } from '../utils/format.js';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  SkeletonTable,
  Textarea,
} from '../components/ui.jsx';

const EMPTY = {
  name: '',
  type: 'cliente',
  document: '',
  email: '',
  phone: '',
  notes: '',
};

const TYPE_LABELS = { cliente: 'Cliente', fornecedor: 'Fornecedor', ambos: 'Cliente e fornecedor' };
const TYPE_TONES = { cliente: 'green', fornecedor: 'blue', ambos: 'neutral' };

export default function Contacts() {
  const toast = useToast();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', search: '' });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setContacts(await api.get('/contacts', filters));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setForm(EMPTY);
    setModal({ editing: null });
  }

  function openEdit(contact) {
    setForm({
      name: contact.name,
      type: contact.type,
      document: contact.document ?? '',
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      notes: contact.notes ?? '',
    });
    setModal({ editing: contact });
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      if (modal.editing) {
        await api.put(`/contacts/${modal.editing.id}`, form);
        toast.success('Contato atualizado.');
      } else {
        await api.post('/contacts', form);
        toast.success('Contato criado.');
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
      await api.delete(`/contacts/${deleting.id}`);
      toast.success('Contato excluído.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Clientes e fornecedores"
        subtitle="Quem paga e quem recebe de você."
        actions={
          <Button onClick={openNew}>
            <Plus size={16} />
            Novo contato
          </Button>
        }
      />

      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
          <Input
            className="pl-10"
            placeholder="Buscar por nome ou CPF/CNPJ..."
            value={filters.search}
            onChange={(e) => setFilters((c) => ({ ...c, search: e.target.value }))}
          />
        </div>
        <Select
          className="w-auto min-w-[170px]"
          value={filters.type}
          onChange={(e) => setFilters((c) => ({ ...c, type: e.target.value }))}
        >
          <option value="">Todos os tipos</option>
          <option value="cliente">Clientes</option>
          <option value="fornecedor">Fornecedores</option>
        </Select>
      </Card>

      {loading ? (
        <Card className="overflow-hidden">
          <SkeletonTable rows={5} columns={4} />
        </Card>
      ) : contacts.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Nenhum contato encontrado"
            description="Cadastre seus clientes e fornecedores para vincular aos lançamentos."
            action={
              <Button onClick={openNew}>
                <Plus size={16} />
                Novo contato
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="table-head">
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Contato</th>
                  <th className="px-5 py-3 text-right">Em aberto</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="transition hover:bg-brand-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink-900">{contact.name}</p>
                      <p className="text-xs text-ink-500">{contact.document || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={TYPE_TONES[contact.type]}>{TYPE_LABELS[contact.type]}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-ink-700">
                      {contact.email && (
                        <p className="flex items-center gap-1.5">
                          <Mail size={13} className="text-ink-500" />
                          {contact.email}
                        </p>
                      )}
                      {contact.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone size={13} className="text-ink-500" />
                          {contact.phone}
                        </p>
                      )}
                      {!contact.email && !contact.phone && (
                        <span className="text-ink-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <p className="text-sm font-semibold text-ink-900">
                        {formatMoney(contact.open_amount)}
                      </p>
                      <p className="text-xs text-ink-500">
                        {contact.transactions_count}{' '}
                        {contact.transactions_count === 1 ? 'lançamento' : 'lançamentos'}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Editar"
                          onClick={() => openEdit(contact)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir"
                          className="text-red-500 hover:bg-red-50"
                          onClick={() => setDeleting(contact)}
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
        </Card>
      )}

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal?.editing ? 'Editar contato' : 'Novo contato'}
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome / Razão social" required className="sm:col-span-2">
              <Input
                placeholder="Ex.: Distribuidora Central"
                value={form.name}
                onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                required
                minLength={2}
              />
            </Field>

            <Field label="Tipo">
              <Select
                value={form.type}
                onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))}
              >
                <option value="cliente">Cliente</option>
                <option value="fornecedor">Fornecedor</option>
                <option value="ambos">Cliente e fornecedor</option>
              </Select>
            </Field>

            <Field label="CPF / CNPJ">
              <Input
                placeholder="00.000.000/0000-00"
                value={form.document}
                onChange={(e) => setForm((c) => ({ ...c, document: e.target.value }))}
              />
            </Field>

            <Field label="E-mail">
              <Input
                type="email"
                placeholder="contato@empresa.com.br"
                value={form.email}
                onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
              />
            </Field>

            <Field label="Telefone">
              <Input
                placeholder="(11) 99999-0000"
                value={form.phone}
                onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Observações">
            <Textarea
              placeholder="Condições de pagamento, contato responsável..."
              value={form.notes}
              onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
            />
          </Field>

          <div className="flex justify-end gap-2 border-t border-brand-100 pt-4">
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
        message={`Excluir "${deleting?.name}"? Os lançamentos continuam, mas ficam sem contato.`}
      />
    </div>
  );
}
