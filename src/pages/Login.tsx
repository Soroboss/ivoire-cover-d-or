import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(username, password)
    if (!ok) {
      setError('Identifiants incorrects ou compte désactivé.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-lightgray flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="bg-brand-dark p-8 text-center flex flex-col items-center">
           <img
             src={logoUrl}
             alt="Logo Ivoire Couvée d’Or"
             className="h-14 w-14 rounded-full bg-white/90 object-cover shadow-sm mb-3"
             loading="eager"
             decoding="async"
           />
           <h1 className="text-2xl font-bold text-white tracking-wide">IVOIRE COUVÉE D'OR</h1>
           <p className="text-brand-gray text-sm mt-1 uppercase tracking-widest font-semibold">Système de Gestion</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200 font-medium">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-2">Nom d'utilisateur</label>
              <input 
                required 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-brand-orange outline-none bg-gray-50 focus:bg-white transition-colors"
                placeholder="Ex: admin"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-2">Mot de passe</label>
              <input 
                required 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-brand-orange outline-none bg-gray-50 focus:bg-white transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-brand-orange text-white font-bold rounded-md hover:bg-brand-hover transition-colors shadow-sm"
            >
              Se Connecter
            </button>
          </form>
          
          <div className="mt-8 text-center">
             <p className="text-xs text-brand-muted">Utilisez <strong>admin</strong> / <strong>admin</strong> lors du premier lancement, puis sécurisez votre espace.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
