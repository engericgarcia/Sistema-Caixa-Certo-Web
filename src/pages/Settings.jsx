import { useState } from 'react';
import { KeyRound, LogOut, UserRound } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Card, Field, Input, PageHeader } from '../components/ui.jsx';

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState({ name: user.name, email: user.email });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirm: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const { user: updated } = await api.put('/auth/me', profile);
      setUser(updated);
      toast.success('Dados atualizados.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();

    if (passwords.newPassword !== passwords.confirm) {
      toast.error('A confirmação não confere com a nova senha.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/auth/me/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Senha alterada.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Seus dados de acesso ao sistema." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <UserRound size={20} />
            </span>
            <div>
              <h2 className="font-semibold text-ink-900">Perfil</h2>
              <p className="text-xs text-ink-500">Nome e e-mail usados para entrar.</p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="Nome" required>
              <Input
                value={profile.name}
                onChange={(e) => setProfile((c) => ({ ...c, name: e.target.value }))}
                required
                minLength={2}
              />
            </Field>
            <Field label="E-mail" required>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((c) => ({ ...c, email: e.target.value }))}
                required
              />
            </Field>
            <Button type="submit" loading={savingProfile}>
              Salvar alterações
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <KeyRound size={20} />
            </span>
            <div>
              <h2 className="font-semibold text-ink-900">Senha</h2>
              <p className="text-xs text-ink-500">Recomendamos trocar periodicamente.</p>
            </div>
          </div>

          <form onSubmit={savePassword} className="space-y-4">
            <Field label="Senha atual" required>
              <Input
                type="password"
                autoComplete="current-password"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords((c) => ({ ...c, currentPassword: e.target.value }))
                }
                required
              />
            </Field>
            <Field label="Nova senha" required hint="Mínimo de 6 caracteres.">
              <Input
                type="password"
                autoComplete="new-password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((c) => ({ ...c, newPassword: e.target.value }))}
                minLength={6}
                required
              />
            </Field>
            <Field label="Confirmar nova senha" required>
              <Input
                type="password"
                autoComplete="new-password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((c) => ({ ...c, confirm: e.target.value }))}
                minLength={6}
                required
              />
            </Field>
            <Button type="submit" loading={savingPassword}>
              Alterar senha
            </Button>
          </form>
        </Card>
      </div>

      <Card className="mt-4 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="font-semibold text-ink-900">Encerrar sessão</h2>
          <p className="text-xs text-ink-500">
            Você precisará entrar novamente com e-mail e senha.
          </p>
        </div>
        <Button variant="danger" onClick={logout}>
          <LogOut size={16} />
          Sair da conta
        </Button>
      </Card>

      <p className="mt-6 text-center text-xs text-ink-500">
        Caixa Certo • projeto open source em React, Node.js e SQLite
      </p>
    </div>
  );
}
