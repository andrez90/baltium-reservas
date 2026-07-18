import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, Users, Calendar, DollarSign, Clock, BarChart3, AlertCircle, RefreshCw 
} from 'lucide-react';

interface DashboardStats {
  todayReservationsCount: number;
  occupancyRate: number;
  newClientsCount: number;
  frequentClientsCount: number;
  expectedRevenueToday: number;
  analytics: {
    cancellations: number;
    noShows: number;
    peakHours: { hour: string; count: number }[];
    topClients: { email: string; name: string; phone: string; bookingsCount: number }[];
    occupancyTrend: { day: string; rate: number }[];
  };
}

export const Dashboard: React.FC = () => {
  const { tenant } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (e) {
      console.error('Error fetching dashboard statistics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Listen to real-time events to auto-refresh dashboard stats
    if (socket) {
      socket.on('reservationCreated', () => {
        console.log('Real-time updates triggered on dashboard');
        fetchStats();
      });
      socket.on('reservationUpdated', () => {
        fetchStats();
      });
      socket.on('reservationDeleted', () => {
        fetchStats();
      });
    }

    return () => {
      if (socket) {
        socket.off('reservationCreated');
        socket.off('reservationUpdated');
        socket.off('reservationDeleted');
      }
    };
  }, [socket]);

  if (loading || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-foreground/50 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-primary" />
        <span>Cargando analítica en tiempo real...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 page-transition w-full min-w-0">
      
      {/* Welcome banner */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="min-w-0">
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-white truncate">{tenant?.name || 'Administración'}</h2>
          <p className="text-xs text-foreground/45 mt-0.5">Métricas de ocupación y reservas consolidadas para hoy.</p>
        </div>
        <button onClick={fetchStats} className="flex-shrink-0 p-2 hover:bg-panel border border-border rounded-lg text-foreground/60 hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-semibold">
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </button>
      </div>

      {/* Grid Cards (Expected revenue, Occupancy, Bookings, Clients) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        
        {/* Card 1: Daily occupancy */}
        <div className="bg-panel border border-panel-border rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">Ocupación de Mesas</span>
            <span className="text-3xl font-extrabold tracking-tight text-white">{stats.occupancyRate}%</span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Promedio semanal
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shadow">
            📈
          </div>
        </div>

        {/* Card 2: Bookings Count */}
        <div className="bg-panel border border-panel-border rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">Reservas Hoy</span>
            <span className="text-3xl font-extrabold tracking-tight text-white">{stats.todayReservationsCount}</span>
            <span className="text-[10px] text-foreground/50">Mesas asignadas</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xl shadow">
            📅
          </div>
        </div>

        {/* Card 3: New Clients */}
        <div className="bg-panel border border-panel-border rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">Clientes Nuevos</span>
            <span className="text-3xl font-extrabold tracking-tight text-white">{stats.newClientsCount}</span>
            <span className="text-[10px] text-primary font-semibold">Registrados esta semana</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-xl shadow">
            👥
          </div>
        </div>

        {/* Card 4: Expected Revenue */}
        <div className="bg-panel border border-panel-border rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">Ingreso Estimado</span>
            <span className="text-3xl font-extrabold tracking-tight text-white">${Number(stats.expectedRevenueToday).toLocaleString('es-CO')}</span>
            <span className="text-[10px] text-slate-400">Consumo promedio $35.000/p</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl shadow">
            💵
          </div>
        </div>

      </div>

      {/* Analytics Charts & Trends using Premium Custom Vector Layouts */}
      <div className="grid md:grid-cols-5 gap-6 items-start">
        
        {/* Left: Occupancy Trends & Peak hours charts */}
        <div className="md:col-span-3 flex flex-col gap-6">
          
          {/* Trend layout */}
          <div className="bg-panel border border-panel-border rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground/80 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Tendencia de Ocupación Semanal
            </h3>
            
            {/* Custom responsive SVG graph */}
            <div className="h-44 w-full relative pt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 150">
                {/* Horizontal guide lines */}
                <line x1="0" y1="20" x2="600" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="0" y1="75" x2="600" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="0" y1="130" x2="600" y2="130" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                
                {/* Graph line */}
                <path
                  d="M 50 110 L 130 95 L 210 80 L 290 70 L 370 45 L 450 35 L 530 65"
                  fill="none"
                  stroke="var(--primary-color)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Gradient area */}
                <path
                  d="M 50 110 L 130 95 L 210 80 L 290 70 L 370 45 L 450 35 L 530 65 L 530 130 L 50 130 Z"
                  fill="url(#grad)"
                  opacity="0.15"
                />
                
                {/* Definitions */}
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary-color)" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>

                {/* Graph dots */}
                <circle cx="50" cy="110" r="5" fill="var(--primary-color)" />
                <circle cx="130" cy="95" r="5" fill="var(--primary-color)" />
                <circle cx="210" cy="80" r="5" fill="var(--primary-color)" />
                <circle cx="290" cy="70" r="5" fill="var(--primary-color)" />
                <circle cx="370" cy="45" r="5" fill="var(--primary-color)" />
                <circle cx="450" cy="35" r="5" fill="var(--primary-color)" />
                <circle cx="530" cy="65" r="5" fill="var(--primary-color)" />
              </svg>
              
              {/* X Axis Labels */}
              <div className="flex justify-between text-[10px] text-foreground/40 font-bold px-7 mt-2">
                <span>Lun (45%)</span>
                <span>Mar (52%)</span>
                <span>Mie (60%)</span>
                <span>Jue (68%)</span>
                <span>Vie (85%)</span>
                <span>Sab (92%)</span>
                <span>Dom (70%)</span>
              </div>
            </div>
          </div>

          {/* Peak Hours card */}
          <div className="bg-panel border border-panel-border rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground/80 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Horas Pico de Mayor Afluencia
            </h3>
            <div className="flex flex-col gap-3">
              {stats.analytics.peakHours.length > 0 ? (
                stats.analytics.peakHours.map((h, i) => (
                  <div key={i} className="flex items-center gap-4 text-xs font-semibold">
                    <span className="w-12 text-slate-350">{h.hour}</span>
                    <div className="flex-1 h-3 rounded-full bg-slate-800 border border-slate-700/50 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, h.count * 20)}%` }} />
                    </div>
                    <span className="w-8 text-right text-slate-300">{h.count} res.</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-foreground/40">Sin datos de horarios registrados aún.</span>
              )}
            </div>
          </div>

        </div>

        {/* Right: Top Clients & Cancellations ratios */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Top customers */}
          <div className="bg-panel border border-panel-border rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground/80 flex items-center gap-2">
              🏆 Top Clientes Frecuentes
            </h3>
            <div className="flex flex-col gap-3">
              {stats.analytics.topClients.map((client, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">{client.name}</span>
                      <span className="text-[10px] text-foreground/45">{client.phone}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-extrabold text-primary">{client.bookingsCount} visitas</span>
                    <span className="text-[9px] uppercase font-bold text-emerald-400">VIP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cancellation & No Show Cards */}
          <div className="bg-panel border border-panel-border rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground/80 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" /> Cancelaciones e Inasistencias
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-background/40 border border-border p-4 rounded-xl flex flex-col gap-1">
                <span className="text-xs text-foreground/45">Cancelaciones</span>
                <span className="text-xl font-extrabold text-red-400">{stats.analytics.cancellations}</span>
              </div>
              <div className="bg-background/40 border border-border p-4 rounded-xl flex flex-col gap-1">
                <span className="text-xs text-foreground/45">No Show (Faltas)</span>
                <span className="text-xl font-extrabold text-amber-500">{stats.analytics.noShows}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
export default Dashboard;
