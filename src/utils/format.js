const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const compactFormatter = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatMoney = (value) => currencyFormatter.format(Number(value || 0));

/** Versão curta usada nos eixos dos gráficos (sem o prefixo R$). */
export const formatAxis = (value) => compactFormatter.format(Number(value || 0));

export const formatNumber = (value, digits = 2) =>
  Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

/** '2026-08-15' -> '15/08/2026' (sem passar por Date, evitando erro de fuso). */
export const formatDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

const MONTH_NAMES = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

/** '2026-08' -> 'ago/26' */
export const formatMonthShort = (month) => {
  const [y, m] = String(month).split('-');
  return `${MONTH_NAMES[Number(m) - 1]}/${y.slice(2)}`;
};

/** '2026-08' -> 'Agosto de 2026' */
export const formatMonthLong = (month) => {
  const [y, m] = String(month).split('-');
  const full = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(
    new Date(Number(y), Number(m) - 1, 1)
  );
  return `${full.charAt(0).toUpperCase()}${full.slice(1)} de ${y}`;
};

export const todayISO = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export const currentMonth = () => todayISO().slice(0, 7);

export const addMonths = (month, delta) => {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
};

export const monthRange = (month) => {
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
};

/** Quantos dias faltam (positivo) ou se passaram (negativo) até a data. */
export const daysUntil = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  const target = Date.UTC(y, m - 1, d);
  const [ty, tm, td] = todayISO().split('-').map(Number);
  const today = Date.UTC(ty, tm - 1, td);
  return Math.round((target - today) / 86400000);
};

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
