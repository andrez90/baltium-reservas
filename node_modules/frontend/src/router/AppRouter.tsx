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
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Plano Visual', path: '/floor-plan', icon: Map },
    { name: 'Calendario', path: '/calendar', icon: Calendar },
    { name: 'Clientes CRM', path: '/crm', icon: Users },
    { name: 'Lista de Espera', path: '/waitlist', icon: List },
    { name: 'Carta / Menú', path: '/menu', icon: Utensils },
    { name: 'Configuración', path: '/settings', icon: Settings },
  ];

  // Close sidebar on route change (mobile)
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const SidebarContent = () => (
    <div className="flex flex-col justify-between h-full p-5">
      <div className="flex flex-col gap-6">
        {/* Brand header */}
        <div className="flex items-center gap-3 border-b border-slate-900 pb-5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-xl text-white shadow-md font-bold flex-shrink-0">
            🍽️
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold text-white text-sm leading-tight tracking-tight truncate">Baltium SaaS</span>
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
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile section */}
      <div className="border-t border-slate-900 pt-5 flex flex-col gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 uppercase flex-shrink-0">
            {user?.firstName.slice(0, 2)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white leading-tight truncate">{user?.firstName} {user?.lastName}</span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{user?.role}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 hover:bg-red-500/10 hover:text-red-400 border border-slate-800 hover:border-red-500/25 rounded-xl text-xs font-bold text-slate-400 transition-all active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" /> Cerrar Sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">

      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on mobile, static on desktop */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-40 bg-slate-900 border-r border-slate-800
          transform transition-transform duration-300 ease-in-out flex-shrink-0
          lg:static lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-slate-950 min-w-0 overflow-hidden">

        {/* Top Header navbar */}
        <header className="h-14 md:h-16 border-b border-slate-900 px-3 md:px-6 flex items-center justify-between bg-slate-900/20 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {/* Hamburger button — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex-shrink-0"
              aria-label="Abrir menú"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {tenant?.logo ? (
              <img src={tenant.logo} alt="Logo" className="w-6 h-6 rounded-full object-cover border border-slate-800 flex-shrink-0" />
            ) : (
              <Coffee className="w-4 h-4 text-primary flex-shrink-0" />
            )}
            <span className="text-xs font-bold text-slate-350 truncate max-w-[120px] md:max-w-none">{tenant?.name || 'Baltium Reservas'}</span>
          </div>

          <div className="flex items-center gap-2 md:gap-3 text-xs font-semibold text-slate-400 flex-shrink-0">
            {tenant && (
              <a
                href={`/restaurant/${tenant.domain.replace('.com', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:block px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white rounded-lg transition-colors font-bold font-mono text-[10px] whitespace-nowrap"
              >
                Ver Landing
              </a>
            )}
            <span className="hidden md:inline whitespace-nowrap">En línea</span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping flex-shrink-0"></span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
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
