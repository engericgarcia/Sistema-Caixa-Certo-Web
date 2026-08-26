import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Field, Input } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AuthShell from './AuthShell.jsx';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.message || 'Não foi possível entrar');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setForm({ email: 'demo@caixacerto.app', password: 'demo1234' });
    setError('');
  }

  return (
    <AuthShell
      title="Entrar na sua conta"
      subtitle="Informe seus dados para acessar o painel financeiro."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/criar-conta" className="font-semibold text-brand-600 hover:text-brand-700">
            Criar conta grátis
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="E-mail" required>
          <Input
            type="email"
            autoComplete="email"
            placeholder="voce@empresa.com.br"
            value={form.email}
            onChange={update('email')}
            required
          />
        </Field>

        <Field label="Senha" required>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={update('password')}
            required
          />
        </Field>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Entrar
        </Button>

        <button
          type="button"
          onClick={fillDemo}
          className="w-full rounded-xl border border-dashed border-brand-300 px-3 py-2.5 text-sm text-ink-500 transition hover:bg-brand-50 hover:text-brand-700"
        >
          Usar a conta de demonstração
        </button>
      </form>
    </AuthShell>
  );
}
