import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
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
  PageHeader,
  Select,
  SkeletonCards,
} from '../components/ui.jsx';

const EMPTY = { name: '', type: 'despesa', color: '#3cb46c' };

function CategoryColumn({ title, tone, items, onEdit, onDelete }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-brand-100 px-5 py-4">
        <h2 className="font-semibold text-ink-900">{title}</h2>
        <Badge tone={tone}>{items.length}</Badge>
      </div>

      {items.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-ink-500">
          Nenhuma categoria nesta lista.
        </p>
      ) : (
        <ul className="divide-y divide-brand-100">
          {items.map((category) => (
            <li key={category.id} className="flex items-center gap-3 px-5 py-3">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">{category.name}</p>
                <p className="text-xs text-ink-500">
                  {category.usage_count}{' '}
                  {category.usage_count === 1 ? 'lançamento' : 'lançamentos'}
                </p>
              </div>
              <Button variant="ghost" size="icon" title="Editar" onClick={() => onEdit(category)}>
                <Pencil size={15} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Excluir"
                className="text-red-500 hover:bg-red-50"
                onClick={() => onDelete(category)}
              >
                <Trash2 size={15} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function Categories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await api.get('/categories'));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const receitas = useMemo(() => categories.filter((c) => c.type === 'receita'), [categories]);
  const despesas = useMemo(() => categories.filter((c) => c.type === 'despesa'), [categories]);

  function openNew() {
    setForm(EMPTY);
    setModal({ editing: null });
  }

  function openEdit(category) {
    setForm({ name: category.name, type: category.type, color: category.color });
    setModal({ editing: category });
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      if (modal.editing) {
        await api.put(`/categories/${modal.editing.id}`, form);
        toast.success('Categoria atualizada.');
      } else {
        await api.post('/categories', form);
        toast.success('Categoria criada.');
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
      await api.delete(`/categories/${deleting.id}`);
      toast.success('Categoria excluída.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Categorias"
        subtitle="Organize as receitas e despesas para os relatórios ficarem úteis."
        actions={
          <Button onClick={openNew}>
            <Plus size={16} />
            Nova categoria
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCards count={2} className="h-[320px]" />
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={Tags}
            title="Nenhuma categoria cadastrada"
            description="Categorias ajudam a responder para onde o dinheiro está indo."
            action={
              <Button onClick={openNew}>
                <Plus size={16} />
                Nova categoria
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <CategoryColumn
            title="Receitas"
            tone="green"
            items={receitas}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
          <CategoryColumn
            title="Despesas"
            tone="red"
            items={despesas}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
        </div>
      )}

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        size="sm"
        title={modal?.editing ? 'Editar categoria' : 'Nova categoria'}
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Nome" required>
            <Input
              placeholder="Ex.: Aluguel"
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
              <option value="despesa">Despesa</option>
              <option value="receita">Receita</option>
            </Select>
          </Field>

          <Field label="Cor" hint="Usada nos gráficos e nas listagens.">
            <ColorPicker value={form.color} onChange={(color) => setForm((c) => ({ ...c, color }))} />
          </Field>

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
        message={`Excluir a categoria "${deleting?.name}"? Os lançamentos existentes ficarão sem categoria.`}
      />
    </div>
  );
}
