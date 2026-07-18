import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Button, Input, Dialog, Select } from '../components/ui';
import { Users, Clock, Plus, HelpCircle, Trash2, ArrowUpRight } from 'lucide-react';

interface WaitlistItem {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  partySize: number;
  zone: string;
  notes?: string | null;
  createdAt: string;
}

export const WaitlistPage: React.FC = () => {
  const { socket } = useSocket();
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Seating promotion modal
  const [selectedItem, setSelectedItem] = useState<WaitlistItem | null>(null);
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState<any | null>(null);

  // Manual waitlist add modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSize, setNewSize] = useState(4);
  const [newZone, setNewZone] = useState('MAIN');
  const [newNotes, setNewNotes] = useState('');

  const fetchWaitlist = async () => {
    try {
      const res = await api.get('/waitlist');
      setWaitlist(res.data.waitlist);
    } catch (e) {
      console.error(e);
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
    fetchWaitlist();
    fetchTables();

    if (socket) {
      socket.on('waitlistUpdated', (data: any) => {
        if (data.waitlist && Array.isArray(data.waitlist)) {
          setWaitlist(data.waitlist);
        } else {
          fetchWaitlist();
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('waitlistUpdated');
      }
    };
  }, [socket]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/waitlist', {
        clientName: newName,
        clientPhone: newPhone,
        clientEmail: newEmail,
        partySize: Number(newSize),
        zone: newZone,
        notes: newNotes
      });
      
      setIsAddOpen(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewSize(4);
      setNewNotes('');
      fetchWaitlist();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al agregar a la lista de espera');
    }
  };

  const handlePromoteClick = async (item: WaitlistItem) => {
    setSelectedItem(item);
    setIsPromoteOpen(true);
    setAiRecommendation(null);
    setSelectedTableId('');

    // Fetch AI table recommendation for this party size and zone
    try {
      const res = await api.get('/reservations/ai-recommendation', {
        params: {
          partySize: item.partySize,
          zone: item.zone,
          dateTime: new Date().toISOString()
        }
      });
      if (res.data.recommendation) {
        setAiRecommendation(res.data.recommendation);
        setSelectedTableId(res.data.recommendation.recommendedTableIds[0]);
      }
    } catch (e) {
      console.error('Failed to load AI recommendation:', e);
    }
  };

  const handlePromoteSubmit = async () => {
    if (!selectedItem || !selectedTableId) return;

    try {
      await api.post(`/waitlist/${selectedItem.id}/promote`, {
        tableId: selectedTableId
      });
      alert('Cliente sentado con éxito. Notificaciones automáticas enviadas.');
      setIsPromoteOpen(false);
      setSelectedItem(null);
      fetchWaitlist();
      fetchTables();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al asignar la mesa');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Deseas remover este cliente de la lista?')) return;
    try {
      await api.delete(`/waitlist/${id}`);
      fetchWaitlist();
    } catch (e) {
      alert('Error al eliminar');
    }
  };

  // Available tables filtering
  const availableTables = tables.filter(t => t.status === 'AVAILABLE');

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 page-transition">
      
      {/* Waitlist Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-border bg-panel/30 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold tracking-wider uppercase text-foreground/80">Cola de Espera (Waitlist)</h2>
        </div>
        <Button variant="outline" size="sm" icon={Plus} onClick={() => setIsAddOpen(true)}>
          Agregar a la Cola
        </Button>
      </div>

      {/* Grid container */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-foreground/50">Cargando cola de espera...</div>
      ) : (
        <div className="grid md:grid-cols-4 gap-6 items-start">
          
          {/* Left panel: Info summary */}
          <div className="md:col-span-1 bg-panel border border-panel-border p-5 rounded-2xl flex flex-col gap-4 text-xs">
            <span className="font-semibold text-foreground/50 uppercase tracking-wider">Métricas de Espera</span>
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between font-medium"><span>Clientes en cola:</span><span className="font-bold text-white">{waitlist.length}</span></div>
              <div className="flex justify-between font-medium"><span>Mesas libres:</span><span className="font-bold text-emerald-400">{availableTables.length}</span></div>
              <div className="flex justify-between font-medium"><span>Est. Tiempo de espera:</span><span className="font-bold text-primary">{waitlist.length * 15} minutos</span></div>
            </div>
          </div>

          {/* Right list: Queue cards */}
          <div className="md:col-span-3 bg-panel border border-panel-border rounded-3xl p-5 shadow-sm min-h-[400px]">
            {waitlist.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-foreground/45 gap-1.5 py-20">
                <HelpCircle className="w-6 h-6 opacity-35" />
                <p className="text-xs">No hay clientes esperando mesa.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {waitlist.map((item, index) => (
                  <div 
                    key={item.id}
                    className="flex flex-col md:flex-row md:items-center justify-between border border-border bg-background/50 p-4 rounded-xl shadow-sm transition-all gap-4 group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Queue position index */}
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-foreground font-extrabold text-xs">
                        #{index + 1}
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <h4 className="text-sm font-bold text-white">{item.clientName}</h4>
                        <div className="flex items-center gap-3 text-[11px] text-foreground/45">
                          <span className="font-mono text-slate-350">{item.clientPhone}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {item.partySize}p</span>
                          <span>•</span>
                          <span className="font-semibold text-foreground/60">{item.zone}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Hace {Math.round((new Date().getTime() - new Date(item.createdAt).getTime()) / 60000)}m</span>
                        </div>
                        {item.notes && <p className="text-[11px] text-slate-400 italic mt-1">Nota: {item.notes}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" icon={ArrowUpRight} onClick={() => handlePromoteClick(item)} className="border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10">
                        Sentar en Mesa
                      </Button>
                      <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(item.id)} className="hover:text-red-500 hover:bg-red-500/10 text-foreground/50" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* MANUAL WAITLIST ADD MODAL */}
      <Dialog isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Agregar a la Cola de Espera">
        <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
          <Input 
            label="Nombre Completo" 
            placeholder="Juan López" 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)} 
            required 
          />
          <Input 
            label="Celular" 
            placeholder="+34600111222" 
            value={newPhone} 
            onChange={(e) => setNewPhone(e.target.value)} 
            required 
          />
          <Input 
            label="Correo Electrónico" 
            type="email" 
            placeholder="juan@email.com" 
            value={newEmail} 
            onChange={(e) => setNewEmail(e.target.value)} 
            required 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Comensales" 
              type="number" 
              min={1} 
              value={newSize} 
              onChange={(e) => setNewSize(Number(e.target.value))} 
              required 
            />
            <Select 
              label="Zona Deseada" 
              value={newZone} 
              onChange={(e) => setNewZone(e.target.value)}
              options={[
                { value: 'MAIN', label: 'Salón Principal' },
                { value: 'TERRACE', label: 'Terraza' },
                { value: 'VIP', label: 'Zona VIP' },
                { value: 'BAR', label: 'Barra' }
              ]}
            />
          </div>
          <Input 
            label="Notas" 
            placeholder="Ej. Cerca del bar, alérgica a la pimienta" 
            value={newNotes} 
            onChange={(e) => setNewNotes(e.target.value)} 
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" type="button" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Agregar a la Cola</Button>
          </div>
        </form>
      </Dialog>

      {/* SEATING PROMOTION / SUGGESTION DIALOG */}
      <Dialog isOpen={isPromoteOpen} onClose={() => setIsPromoteOpen(false)} title="Asignación y Seating de Mesa">
        {selectedItem && (
          <div className="flex flex-col gap-4">
            <div className="bg-panel border border-border p-4 rounded-xl text-xs flex flex-col gap-1 text-slate-300">
              <div className="font-bold text-white text-sm mb-1">{selectedItem.clientName}</div>
              <div>Grupo: <strong className="text-white">{selectedItem.partySize} personas</strong></div>
              <div>Zona de preferencia: <strong>{selectedItem.zone}</strong></div>
            </div>

            {/* AI suggest panel */}
            {aiRecommendation ? (
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex flex-col gap-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                  🤖 Recomendación Inteligente (Heurística de IA):
                </span>
                <p className="text-xs italic text-slate-350 leading-relaxed">
                  {aiRecommendation.explanation}
                </p>
                <div className="text-[10px] text-foreground/45">
                  Precisión de optimización: <strong className="text-emerald-400">{aiRecommendation.score}%</strong>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-foreground/50">Cargando recomendación IA de seating...</div>
            )}

            {/* Selection dropdown */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-xs font-semibold text-foreground/55 uppercase">Seleccionar Mesa de Destino:</label>
              <Select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                options={[
                  { value: '', label: 'Selecciona una mesa...' },
                  ...availableTables.map(t => ({
                    value: t.id,
                    label: `${t.name} (Capacidad: ${t.capacity}p - ${t.zone})`
                  }))
                ]}
                className="bg-panel border-border"
              />
            </div>

            <div className="flex justify-end gap-2 mt-4 border-t border-border pt-4">
              <Button variant="outline" onClick={() => setIsPromoteOpen(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handlePromoteSubmit} disabled={!selectedTableId}>
                Sentar Cliente e Iniciar Alerta
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
export default WaitlistPage;
