import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';
import { Lock, Mail, ChevronRight, HelpCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Success: redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error en las credenciales.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      {/* Main card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col gap-6 animate-slide-up">
        
        {/* Header */}
        <div className="flex flex-col gap-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-2xl text-white mx-auto shadow-lg">
            🍽️
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-2">Acceso a Baltium Reservas</h2>
          <p className="text-xs text-slate-400">Ingresa tus credenciales para acceder a la plataforma SaaS.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="admin@baltium.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-slate-950 border-slate-800 text-white"
          />

          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-slate-950 border-slate-800 text-white"
          />

          <div className="flex items-center justify-between text-xs font-medium mt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-primary focus:ring-primary focus:ring-offset-slate-900"
              />
              <span className="text-slate-300">Recordarme en este equipo</span>
            </label>
            <button 
              type="button" 
              onClick={() => alert('Recuperación de contraseña: Hemos simulado el envío en la consola del backend.')} 
              className="text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <Button variant="primary" type="submit" isLoading={isLoading} className="w-full py-2.5 text-sm mt-2">
            Iniciar Sesión <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        {/* Footer help note */}
        <div className="border-t border-slate-800/80 pt-4 flex flex-col gap-2.5 text-[11px] text-slate-400">
          <div className="flex gap-2 items-start bg-slate-950/40 p-3 border border-slate-850 rounded-2xl">
            <HelpCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-300">Credenciales del Demo:</span>
              <p className="mt-0.5">Admin: <span className="font-mono text-primary select-all">admin@baltium.com</span> / <span className="font-mono">password123</span></p>
              <p>Recepción: <span className="font-mono text-primary select-all">reception@baltium.com</span> / <span className="font-mono">password123</span></p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
