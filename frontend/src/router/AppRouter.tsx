import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/LoginPage';
import { LandingPage } from '../pages/LandingPage';
import { Dashboard } from '../pages/Dashboard';
import { FloorPlanPage } from '../pages/FloorPlanPage';
import { CalendarPage } from '../pages/CalendarPage';
import { CRMPage } from '../pages/CRMPage';
import { WaitlistPage } from '../pages/WaitlistPage';
import { SettingsPage } from '../pages/SettingsPage';
import { MenuPage } from '../pages/MenuPage';
import { 
  LayoutDashboard, Map, Calendar, Users, List, Settings, LogOut, Coffee, Utensils 
} from 'lucide-react';

// Protected route middleware guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Restableciendo sesión...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Main Admin Layout Sidebar frame
const AdminLayout: React.FC = () => {
  const { user, tenant, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Plano Visual', path: '/floor-plan', icon: Map },
    { name: 'Calendario', path: '/calendar', icon: Calendar },
    { name: 'Clientes CRM', path: '/crm', icon: Users },
    { name: 'Lista de Espera', path: '/waitlist', icon: List },
    { name: 'Carta / Menú', path: '/menu', icon: Utensils },
    { name: 'Configuración', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-slate-900/40 flex flex-col justify-between p-5">
        <div className="flex flex-col gap-6">
          
          {/* Brand header */}
          <div className="flex items-center gap-3 border-b border-slate-900 pb-5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-xl text-white shadow-md font-bold">
              🍽️
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-sm leading-tight tracking-tight">Baltium SaaS</span>
              <span className="text-[10px] text-primary uppercase font-bold tracking-wide">Panel Operativo</span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-primary text-white shadow-md shadow-primary/10' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile section */}
        <div className="border-t border-slate-900 pt-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 uppercase">
              {user?.firstName.slice(0, 2)}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-tight">{user?.firstName} {user?.lastName}</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{user?.role}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 hover:bg-red-500/10 hover:text-red-400 border border-slate-800 hover:border-red-500/25 rounded-xl text-xs font-bold text-slate-400 transition-all active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
        
        {/* Top Header navbar */}
        <header className="h-16 border-b border-slate-900 px-6 flex items-center justify-between bg-slate-900/20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            {tenant?.logo ? (
              <img src={tenant.logo} alt="Logo" className="w-6 h-6 rounded-full object-cover border border-slate-800" />
            ) : (
              <Coffee className="w-4.5 h-4.5 text-primary" />
            )}
            <span className="text-xs font-bold text-slate-350">{tenant?.name || 'Baltium Reservas'}</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
            {/* Direct public landing preview link button */}
            {tenant && (
              <a 
                href={`/restaurant/${tenant.domain.replace('.com', '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white rounded-lg transition-colors font-bold font-mono text-[10px]"
              >
                Ver Landing Pública
              </a>
            )}
            <span>En línea</span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          </div>
        </header>

        {/* View content placeholder */}
        <div className="flex-grow flex flex-col">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/floor-plan" element={<FloorPlanPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/crm" element={<CRMPage />} />
            <Route path="/waitlist" element={<WaitlistPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Paths */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Dynamic Multi-tenant Public Booking Landing Pages */}
        <Route path="/restaurant/:slug" element={<LandingPage />} />
        <Route path="/" element={<LandingPage />} /> {/* Fallback view */}

        {/* Protected Admin/Operator Paths */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
};
export default AppRouter;
