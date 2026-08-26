import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Field, Input } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AuthShell from './AuthShell.jsx';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('As senhas não são iguais');
      return;
    }

    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
    } catch (err) {
      setError(err.message || 'Não foi possível criar a conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Criar sua conta"
      subtitle="Leva menos de um minuto — e já vem com categorias prontas."
      footer={
        <>
          Já tem uma conta?{' '}
          <Link to="/entrar" className="font-semibold text-brand-600 hover:text-brand-700">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome" required>
          <Input
            placeholder="Como podemos te chamar?"
            value={form.name}
            onChange={update('name')}
            required
          />
        </Field>

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

        <Field label="Senha" required hint="Mínimo de 6 caracteres.">
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.password}
            onChange={update('password')}
            minLength={6}
            required
          />
        </Field>

        <Field label="Confirmar senha" required>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={update('confirm')}
            minLength={6}
            required
          />
        </Field>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Criar conta
        </Button>
      </form>
    </AuthShell>
  );
}
