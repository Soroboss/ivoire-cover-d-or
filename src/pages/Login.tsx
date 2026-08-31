import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, UserRound, KeyRound, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { callBackendFunction } from '../lib/insforgeApi';

export const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // État Réinitialisation Mot de Passe
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    try {
      const ok = await login(username, password);
      if (!ok) {
        setError('Identifiants incorrects ou compte désactivé.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetUsername.trim()) {
      setResetError('Veuillez entrer votre nom d’utilisateur ou numéro de téléphone.');
      return;
    }

    if (newPassword.length < 3) {
      setResetError('Le nouveau mot de passe doit contenir au moins 3 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmittingReset(true);
    try {
      const res = await callBackendFunction<{ success?: boolean; error?: string; message?: string }>(
        'users_reset_password',
        { usernameOrPhone: resetUsername, newPassword }
      );

      if (res.error) {
        setResetError(res.error);
      } else {
        setResetSuccess('Mot de passe réinitialisé avec succès ! Redirection vers la connexion...');
        setTimeout(() => {
          setUsername(resetUsername);
          setPassword('');
          setIsResetMode(false);
          setResetSuccess('');
          setResetError('');
        }, 2200);
      }
    } catch (err) {
      setResetError((err as Error).message || 'Erreur lors de la réinitialisation.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-mesh-dark">
      {/* Halos décoratifs (orange logo) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-brand-orange/15 blur-3xl" />
        <div className="absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-brand-orange-glow/10 blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="animate-login-in w-full max-w-[440px]">
          {/* Carte glass */}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07] shadow-glow-orange backdrop-blur-xl">
            <div className="border-b border-white/10 px-8 pb-8 pt-10 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-soft ring-4 ring-brand-orange/20">
                <img
                  src={logoUrl}
                  alt="Logo Ivoire Couvée d’Or"
                  className="h-16 w-16 rounded-xl object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]">
                Ivoire Couvée d&apos;Or
              </h1>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-white/55">
                {isResetMode ? 'Réinitialisation mot de passe' : 'Espace professionnel'}
              </p>
            </div>

            <div className="bg-white/95 px-8 py-8 backdrop-blur-sm sm:px-10">
              {!isResetMode ? (
                /* Mode Connexion Standard */
                <>
                  <p className="mb-6 text-center text-sm text-slate-600">
                    Connectez-vous pour accéder à la gestion du couvoir.
                  </p>

                  <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                      <div
                        role="alert"
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                      >
                        {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <UserRound className="h-4 w-4 text-brand-orange" aria-hidden />
                        Identifiant ou téléphone
                      </label>
                      <input
                        required
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="input-modern"
                        placeholder="Nom d’utilisateur ou +225…"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <Lock className="h-4 w-4 text-brand-orange" aria-hidden />
                          Mot de passe
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsResetMode(true);
                            setResetUsername(username);
                            setError('');
                          }}
                          className="text-xs font-semibold text-brand-orange hover:underline focus:outline-none"
                        >
                          Mot de passe oublié ?
                        </button>
                      </div>
                      <input
                        required
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-modern"
                        placeholder="Votre mot de passe"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="btn-primary mt-2 w-full py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoggingIn && <Loader2 className="h-4 w-4 animate-spin" />}
                      Se connecter
                    </button>
                  </form>
                </>
              ) : (
                /* Mode Réinitialisation de Mot de Passe */
                <>
                  <div className="mb-6 text-center">
                    <p className="text-sm text-slate-600">
                      Entrez votre identifiant et choisissez votre nouveau mot de passe.
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    {resetError && (
                      <div
                        role="alert"
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                      >
                        {resetError}
                      </div>
                    )}

                    {resetSuccess && (
                      <div
                        role="alert"
                        className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                        {resetSuccess}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <UserRound className="h-4 w-4 text-brand-orange" aria-hidden />
                        Identifiant ou Téléphone
                      </label>
                      <input
                        required
                        type="text"
                        value={resetUsername}
                        onChange={(e) => setResetUsername(e.target.value)}
                        className="input-modern"
                        placeholder="Nom d’utilisateur ou numéro..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <KeyRound className="h-4 w-4 text-brand-orange" aria-hidden />
                        Nouveau mot de passe
                      </label>
                      <input
                        required
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-modern"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Lock className="h-4 w-4 text-brand-orange" aria-hidden />
                        Confirmer le mot de passe
                      </label>
                      <input
                        required
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-modern"
                        placeholder="••••••••"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReset}
                      className="btn-primary mt-3 w-full py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmittingReset && <Loader2 className="h-4 w-4 animate-spin" />}
                      Valider et réinitialiser
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(false);
                        setResetError('');
                        setResetSuccess('');
                      }}
                      className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Retour à la connexion
                    </button>
                  </form>
                </>
              )}

              <p className="mt-8 text-center text-xs leading-relaxed text-slate-500">
                Connexion sécurisée · Données hébergées pour votre activité
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-white/40">
            © {new Date().getFullYear()} Ivoire Couvée d&apos;Or
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
