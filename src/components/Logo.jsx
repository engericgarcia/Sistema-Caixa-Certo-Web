/**
 * Marca do Caixa Certo: uma caixa (o caixa da empresa) com um "certo" dentro.
 * `mark` desenha só o símbolo; `Logo` monta símbolo + nome.
 */
export function LogoMark({ size = 20, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5.5" width="18" height="14.5" rx="3.2" />
      <path d="M3 10.2h18" />
      <path d="M8.4 14.9l2.6 2.6 4.6-5.1" />
    </svg>
  );
}

export default function Logo({ compact = false, tone = 'brand' }) {
  const badge =
    tone === 'light'
      ? 'bg-white/15 text-white'
      : 'bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-sm';

  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${badge}`}>
        <LogoMark size={20} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p
            className={`text-[15px] font-bold tracking-tight ${
              tone === 'light' ? 'text-white' : 'text-ink-900'
            }`}
          >
            Caixa Certo
          </p>
          <p
            className={`text-[11px] ${
              tone === 'light' ? 'text-brand-100' : 'text-ink-500'
            }`}
          >
            Controle financeiro
          </p>
        </div>
      )}
    </div>
  );
}
