import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Button, Input, Select, Dialog, Badge } from '../components/ui';
import { 
  Calendar as CalendarIcon, Clock, Users, Tag, AlertCircle, Plus, Copy, Ban, Trash2, Edit 
} from 'lucide-react';

interface Reservation {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  dateTime: string;
  partySize: number;
  zone: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  celebration: 'NONE' | 'BIRTHDAY' | 'ANNIVERSARY' | 'OTHER';
  notes?: string | null;
  tableId?: string | null;
  tablePurchased?: boolean;
  purchaseAmount?: number | null;
  purchasePaymentMethod?: string | null;
}

export const CalendarPage: React.FC = () => {
  const { socket } = useSocket();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(true);

  // Selected reservation details dialog
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Table selection states
  const [tables, setTables] = useState<any[]>([]);

  const fetchReservations = async () => {
    try {
      const res = await api.get('/reservations', {
        params: {
          date: selectedDate
        }
      });
      setReservations(res.data.reservations);
    } catch (e) {
      console.error('Error fetching calendar reservations:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await api.get('/tables');
      setTables(res.data.tables);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchTables();

    if (socket) {
      socket.on('reservationCreated', () => fetchReservations());
      socket.on('reservationUpdated', () => fetchReservations());
      socket.on('reservationDeleted', () => fetchReservations());
    }

    return () => {
      if (socket) {
        socket.off('reservationCreated');
        socket.off('reservationUpdated');
        socket.off('reservationDeleted');
      }
    };
  }, [selectedDate, socket]);

  const handleDuplicate = async (res: Reservation) => {
    try {
      const duplicatedPayload = {
        clientName: res.clientName,
        clientPhone: res.clientPhone,
        clientEmail: res.clientEmail,
        dateTime: new Date(new Date(res.dateTime).getTime() + 24 * 60 * 60000).toISOString(), // Duplicate for tomorrow
        partySize: res.partySize,
        zone: res.zone,
        celebration: res.celebration,
        notes: res.notes ? `${res.notes} (Duplicada)` : 'Copia duplicada'
      };

      await api.post('/reservations', duplicatedPayload);
      alert('Reserva duplicada para mañana exitosamente.');
      setIsDetailOpen(false);
      fetchReservations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al duplicar la reserva');
    }
  };

  const handleUpdateStatus = async (id: string, status: any) => {
    try {
      await api.put(`/reservations/${id}`, { status });
      setIsDetailOpen(false);
      fetchReservations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al actualizar el estado');
    }
  };

  const handleReallocateTable = async (id: string, tableId: string) => {
    try {
      await api.put(`/reservations/${id}`, { tableId: tableId === 'none' ? null : tableId });
      alert('Mesa reasignada con éxito.');
      setIsDetailOpen(false);
      fetchReservations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Conflicto de asignación de mesa');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta reserva?')) return;
    try {
      await api.delete(`/reservations/${id}`);
      setIsDetailOpen(false);
      fetchReservations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const statusBadges = {
    PENDING: 'warning',
    CONFIRMED: 'info',
    COMPLETED: 'success',
    CANCELLED: 'error',
    NO_SHOW: 'neutral'
  };

  const getTableName = (tableId?: string | null) => {
    if (!tableId) return 'Lista de Espera';
    const match = tables.find(t => t.id === tableId);
    return match ? match.name : 'Mesa asignada';
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 page-transition">
      
      {/* Calendar Header toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-border bg-panel/30 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold tracking-wider uppercase text-foreground/80">Calendario de Reservas</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Custom Date Pick Input */}
          <Input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-44 py-1 h-9 bg-panel/85 border-border"
          />

          <div className="flex rounded-lg border border-border overflow-hidden bg-background">
            <button 
              onClick={() => setViewMode('day')}
              className={`text-xs px-3 py-1.5 font-bold transition-all ${viewMode === 'day' ? 'bg-primary text-white' : 'text-foreground/60 hover:bg-panel'}`}
            >
              Día
            </button>
            <button 
              onClick={() => setViewMode('week')}
              className={`text-xs px-3 py-1.5 font-bold transition-all ${viewMode === 'week' ? 'bg-primary text-white' : 'text-foreground/60 hover:bg-panel'}`}
            >
              Semana
            </button>
            <button 
              onClick={() => setViewMode('month')}
              className={`text-xs px-3 py-1.5 font-bold transition-all ${viewMode === 'month' ? 'bg-primary text-white' : 'text-foreground/60 hover:bg-panel'}`}
            >
              Mes
            </button>
          </div>
        </div>
      </div>

      {/* Main Reservation feed/grid */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center text-foreground/50">Cargando reservas...</div>
      ) : (
        <div className="grid md:grid-cols-4 gap-6 items-start">
          
          {/* Left panel: Quick statistics list */}
          <div className="md:col-span-1 bg-panel border border-panel-border p-5 rounded-2xl flex flex-col gap-4">
            <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Resumen Diario</span>
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between font-medium"><span>Total reservas:</span><span>{reservations.length}</span></div>
              <div className="flex justify-between font-medium text-blue-400"><span>Confirmadas:</span><span>{reservations.filter(r => r.status === 'CONFIRMED').length}</span></div>
              <div className="flex justify-between font-medium text-amber-500"><span>Pendientes:</span><span>{reservations.filter(r => r.status === 'PENDING').length}</span></div>
              <div className="flex justify-between font-medium text-emerald-500"><span>Completadas:</span><span>{reservations.filter(r => r.status === 'COMPLETED').length}</span></div>
              <div className="flex justify-between font-medium text-red-500"><span>Canceladas:</span><span>{reservations.filter(r => r.status === 'CANCELLED').length}</span></div>
            </div>
          </div>

          {/* Right panel: Timeline slot cards */}
          <div className="md:col-span-3 bg-panel border border-panel-border rounded-3xl p-5 flex flex-col gap-4 shadow-sm min-h-[400px]">
            {reservations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-foreground/40 gap-1 py-16">
                <AlertCircle className="w-6 h-6 opacity-50" />
                <p className="text-xs">No hay reservas para esta fecha.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {reservations.map((res) => (
                  <div 
                    key={res.id} 
                    onClick={() => {
                      setSelectedRes(res);
                      setIsDetailOpen(true);
                    }}
                    className="flex flex-col md:flex-row md:items-center justify-between border border-border bg-background/50 hover:bg-background/80 p-4 rounded-xl shadow-sm transition-all hover:scale-[1.005] cursor-pointer gap-4 group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Booking Time slot badge */}
                      <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs font-bold font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(res.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      
                      <div className="flex flex-col gap-0.5">
                        <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{res.clientName}</h4>
                        <div className="flex items-center gap-3 text-[11px] text-foreground/45">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {res.partySize}p</span>
                          <span>•</span>
                          <span>Mesa: <strong className="text-foreground/75 font-semibold">{getTableName(res.tableId)}</strong></span>
                          <span>•</span>
                          <span className="font-semibold text-foreground/60">{res.zone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {res.tablePurchased && (
                        <Badge variant="success">💵 Prepago ${Number(res.purchaseAmount).toLocaleString('es-CO')}</Badge>
                      )}
                      {res.celebration !== 'NONE' && (
                        <Badge variant="purple">🎉 {res.celebration}</Badge>
                      )}
                      <Badge variant={statusBadges[res.status] as any}>{res.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* RESERVATION DETAIL AND CONTROL PANEL MODAL */}
      <Dialog isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalle de Reserva">
        {selectedRes && (
          <div className="flex flex-col gap-5 text-sm">
            <div className="bg-panel border border-border p-4 rounded-xl flex flex-col gap-2.5">
              <h3 className="font-extrabold text-white text-base">{selectedRes.clientName}</h3>
              <p className="text-xs text-foreground/50 border-b border-border pb-2.5">Celular: {selectedRes.clientPhone} | Email: {selectedRes.clientEmail}</p>
              
              <div className="flex justify-between text-xs mt-1">
                <span className="text-foreground/45">Fecha y Hora:</span>
                <span className="font-bold text-white">{new Date(selectedRes.dateTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-foreground/45">Comensales:</span>
                <span className="font-bold text-white">{selectedRes.partySize} personas</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-foreground/45">Mesa Asignada:</span>
                <span className="font-bold text-primary">{getTableName(selectedRes.tableId)}</span>
              </div>
              {selectedRes.tablePurchased && (
                <div className="flex justify-between text-xs text-emerald-400 font-bold border-t border-border pt-2.5 mt-1.5">
                  <span>💶 Mesa Comprada / Prepago:</span>
                  <span>${Number(selectedRes.purchaseAmount).toLocaleString('es-CO')} ({selectedRes.purchasePaymentMethod})</span>
                </div>
              )}
              {selectedRes.notes && (
                <div className="border-t border-border pt-2 mt-2 flex flex-col gap-0.5 text-xs text-foreground/60">
                  <span className="font-bold text-foreground/45">Observaciones:</span>
                  <p className="italic leading-relaxed">{selectedRes.notes}</p>
                </div>
              )}
            </div>

            {/* Quick Actions (Duplicate, Re-seat, Cancel, Delete) */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wide">Acciones Operativas:</span>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" icon={Copy} onClick={() => handleDuplicate(selectedRes)}>
                  Duplicar para Mañana
                </Button>
                <Button variant="outline" size="sm" icon={Ban} onClick={() => handleUpdateStatus(selectedRes.id, 'CANCELLED')} className="text-red-500 border-red-500/25 hover:bg-red-500/10">
                  Cancelar Reserva
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedRes.id, 'CONFIRMED')} className="text-emerald-500 border-emerald-500/25 hover:bg-emerald-500/10">
                  Confirmar Asistencia
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(selectedRes.id, 'NO_SHOW')} className="text-amber-500 border-amber-500/25 hover:bg-amber-500/10">
                  Registrar No-Show
                </Button>
              </div>

              {/* Re-seat Selector dropdown */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-xs font-semibold text-foreground/50 uppercase">Asignar Mesa Diferente:</label>
                <Select
                  value={selectedRes.tableId || 'none'}
                  onChange={(e) => handleReallocateTable(selectedRes.id, e.target.value)}
                  options={[
                    { value: 'none', label: 'Sin Asignar (Lista de Espera)' },
                    ...tables.map(t => ({ value: t.id, label: `${t.name} (Cap: ${t.capacity}p - ${t.zone}) - ${t.status}` }))
                  ]}
                  className="bg-panel border-border"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 border-t border-border pt-4">
              <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDelete(selectedRes.id)}>
                Eliminar Registro
              </Button>
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
export default CalendarPage;
