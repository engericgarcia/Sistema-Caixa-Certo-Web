import { Link } from 'react-router-dom';
import { BarChart3, CalendarClock, ShieldCheck } from 'lucide-react';
import Logo, { LogoMark } from '../components/Logo.jsx';

const HIGHLIGHTS = [
  { icon: CalendarClock, title: 'Contas a pagar e a receber', text: 'Vencimentos, parcelas e baixas em poucos cliques.' },
  { icon: BarChart3, title: 'Fluxo de caixa e DRE', text: 'Acompanhe entradas, saídas e o resultado do período.' },
  { icon: ShieldCheck, title: 'Seus dados no seu computador', text: 'Banco SQLite local e senha protegida com bcrypt.' },
];

/** Moldura compartilhada pelas telas de login e cadastro. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Coluna de apresentação */}
      <div className="relative hidden overflow-hidden bg-brand-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, #63cf8a 0, transparent 45%), radial-gradient(circle at 80% 70%, #96e3b0 0, transparent 40%)',
          }}
        />
        <div className="relative">
          <div className="mb-10">
            <Logo tone="light" />
          </div>
          <h1 className="max-w-md text-4xl font-bold leading-tight">
            O controle financeiro do seu negócio, sem planilha.
          </h1>
          <p className="mt-4 max-w-md text-brand-100">
            Registre contas a pagar e a receber, dê baixa nos pagamentos e veja em segundos
            para onde o seu dinheiro está indo.
          </p>
        </div>

        <ul className="relative mt-12 space-y-5">
          {HIGHLIGHTS.map((item) => (
            <li key={item.title} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <item.icon size={20} />
              </div>
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-brand-100">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Coluna do formulário */}
      <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white">
              <LogoMark size={24} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-ink-900">{title}</h2>
          <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>}

          <p className="mt-10 text-center text-xs text-ink-500/70">
            Caixa Certo •{' '}
            <Link to="/entrar" className="hover:text-brand-600">
              projeto open source
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
