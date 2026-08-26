import { useEffect } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Botões                                                                     */
/* -------------------------------------------------------------------------- */
const VARIANTS = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 focus-visible:ring-brand-200 shadow-sm',
  secondary:
    'bg-white text-ink-700 border border-brand-200 hover:bg-brand-50 focus-visible:ring-brand-100',
  ghost: 'text-ink-700 hover:bg-brand-50 focus-visible:ring-brand-100',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-200',
  subtle: 'bg-brand-100 text-brand-800 hover:bg-brand-200 focus-visible:ring-brand-200',
};

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
  icon: 'h-9 w-9',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-medium transition
                  focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed
                  disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Campos de formulário                                                       */
/* -------------------------------------------------------------------------- */
export function Field({ label, error, hint, required, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="field-label">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function Input({ className = '', ...props }) {
  return <input className={`field ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`field appearance-none pr-9 ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`field min-h-[88px] resize-y ${className}`} {...props} />;
}

/** Campo monetário: aceita vírgula e mostra o prefixo R$. */
export function MoneyInput({ value, onChange, className = '', ...props }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-500">
        R$
      </span>
      <input
        inputMode="decimal"
        className={`field pl-10 ${className}`}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^\d.,-]/g, ''))}
        {...props}
      />
    </div>
  );
}

/** Converte '1.234,56' ou '1234.56' em número. */
export function parseMoney(input) {
  if (typeof input === 'number') return input;
  const text = String(input ?? '').trim();
  if (!text) return 0;
  const normalized = text.includes(',')
    ? text.replace(/\./g, '').replace(',', '.')
    : text;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

/* -------------------------------------------------------------------------- */
/* Estrutura                                                                  */
/* -------------------------------------------------------------------------- */
export function Card({ className = '', children }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({ tone = 'neutral', children, className = '' }) {
  const tones = {
    neutral: 'bg-slate-100 text-ink-700',
    green: 'bg-brand-100 text-brand-800',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-sky-50 text-sky-700',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const STATUS_TONES = { pago: 'green', pendente: 'amber', atrasado: 'red' };
const STATUS_LABELS = { pago: 'Pago', pendente: 'Em aberto', atrasado: 'Atrasado' };

export function StatusBadge({ status, type }) {
  const label =
    status === 'pago' && type === 'receita' ? 'Recebido' : STATUS_LABELS[status] || status;
  return <Badge tone={STATUS_TONES[status] || 'neutral'}>{label}</Badge>;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
          <Icon size={26} />
        </div>
      )}
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Carregamento                                                               */
/* -------------------------------------------------------------------------- */
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

/** Placeholder de tabela — evita o "pulo" da tela quando os dados chegam. */
export function SkeletonTable({ rows = 6, columns = 5 }) {
  return (
    <div className="divide-y divide-brand-100">
      <div className="flex gap-4 bg-brand-50/70 px-4 py-3.5">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex items-center gap-4 px-4 py-4">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton
              key={col}
              className={`h-4 flex-1 ${col === 0 ? 'max-w-[90px]' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4, className = 'h-[104px]' }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`rounded-2xl ${className}`} />
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Controle segmentado (abas curtas / atalhos de período)                     */
/* -------------------------------------------------------------------------- */
export function SegmentedControl({ value, onChange, options, className = '' }) {
  return (
    <div
      className={`inline-flex flex-wrap gap-1 rounded-xl border border-brand-200 bg-white p-1 ${className}`}
      role="tablist"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active
                ? 'bg-brand-100 text-brand-800'
                : 'text-ink-500 hover:bg-brand-50 hover:text-ink-700'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Spinner({ label = 'Carregando...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink-500">
      <Loader2 size={18} className="animate-spin text-brand-500" />
      {label}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */
export function Modal({ open, onClose, title, description, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 p-4 backdrop-blur-sm sm:p-8">
      <div
        className={`my-auto w-full ${widths[size]} animate-fade-in rounded-2xl bg-white shadow-xl`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-brand-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-500 transition hover:bg-brand-50 hover:text-ink-900"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar exclusão',
  message,
  confirmLabel = 'Excluir',
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle size={20} />
        </div>
        <p className="pt-2 text-sm text-ink-700">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Paginação                                                                  */
/* -------------------------------------------------------------------------- */
export function Pagination({ page, totalPages, total, onChange }) {
  if (totalPages <= 1) {
    return (
      <p className="px-5 py-3 text-xs text-ink-500">
        {total} {total === 1 ? 'registro' : 'registros'}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 border-t border-brand-100 px-5 py-3">
      <p className="text-xs text-ink-500">
        Página {page} de {totalPages} • {total} registros
      </p>
      <div className="flex gap-1">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Próxima página"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Seletor de cor                                                             */
/* -------------------------------------------------------------------------- */
export const PALETTE = [
  '#3cb46c', '#63cf8a', '#2a9557', '#0ea5e9', '#6366f1',
  '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308',
  '#14b8a6', '#64748b',
];

export function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          style={{ backgroundColor: color }}
          className={`h-8 w-8 rounded-lg transition ${
            value === color
              ? 'ring-2 ring-ink-900 ring-offset-2'
              : 'hover:scale-110'
          }`}
          aria-label={`Escolher a cor ${color}`}
        />
      ))}
    </div>
  );
}
