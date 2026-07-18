import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Button, Input, Dialog, Badge } from '../components/ui';
import { Search, UserCheck, Cake, Heart, Award, ArrowUpRight, DollarSign, Calendar } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthday?: string | null;
  anniversary?: string | null;
  notes?: string | null;
  tags: string; // JSON string array
  isVip: boolean;
  createdAt: string;
}

interface ClientHistory {
  totalReservations: number;
  visits: number;
  noShows: number;
  estimatedConsumption: number;
  list: any[];
}

export const CRMPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Client details dialog state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [history, setHistory] = useState<ClientHistory | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data.clients);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSelectClient = async (client: Client) => {
    setSelectedClient(client);
    setHistoryLoading(true);
    setIsDetailOpen(true);
    
    try {
      const res = await api.get(`/clients/${client.id}/history`);
      setHistory(res.data.history);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleToggleVip = async (client: Client) => {
    try {
      const updatedVip = !client.isVip;
      const res = await api.put(`/clients/${client.id}`, { isVip: updatedVip });
      alert(`Cliente marcado como ${updatedVip ? 'VIP' : 'Normal'}.`);
      
      // Update local state
      setClients(clients.map(c => c.id === client.id ? { ...c, isVip: updatedVip } : c));
      setSelectedClient({ ...client, isVip: updatedVip });
    } catch (e) {
      alert('Error al modificar estado VIP');
    }
  };

  // Filter clients by search query
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const getTagsArray = (tagsString?: string): string[] => {
    try {
      return JSON.parse(tagsString || '[]');
    } catch {
      return [];
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 page-transition">
      
      {/* Search Header toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-border bg-panel/30 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <UserCheck className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold tracking-wider uppercase text-foreground/80 font-mono">Base de Clientes CRM</h2>
        </div>
        <div className="w-full md:w-80">
          <Input
            placeholder="Buscar por nombre, email o celular..."
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-panel border-border"
          />
        </div>
      </div>

      {/* CRM client cards list */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-foreground/50">Cargando base de datos CRM...</div>
      ) : (
        <div className="bg-panel border border-panel-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-background/85 border-b border-border uppercase font-semibold text-foreground/50 tracking-wider">
                  <th className="p-4">Nombre</th>
                  <th className="p-4">Teléfono</th>
                  <th className="p-4">Correo</th>
                  <th className="p-4">Etiquetas</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-foreground/40 italic">No se encontraron clientes registrados.</td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const tags = getTagsArray(client.tags);
                    
                    return (
                      <tr 
                        key={client.id}
                        className="border-b border-border hover:bg-background/25 transition-colors cursor-pointer font-medium"
                        onClick={() => handleSelectClient(client)}
                      >
                        <td className="p-4 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                            {client.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              {client.name} 
                              {client.isVip && <span className="text-[9px] font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 rounded">VIP</span>}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-300 font-mono">{client.phone}</td>
                        <td className="p-4 text-slate-450">{client.email}</td>
                        <td className="p-4 flex gap-1.5 flex-wrap">
                          {tags.map((tag, i) => (
                            <Badge key={i} variant={tag === 'VIP' ? 'success' : tag === 'Frecuente' ? 'purple' : 'info'}>
                              {tag}
                            </Badge>
                          ))}
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" icon={ArrowUpRight} onClick={() => handleSelectClient(client)}>
                            Detalles
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLIENT ANALYTICS DETAIL MODAL */}
      <Dialog isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Ficha del Cliente">
        {selectedClient && (
          <div className="flex flex-col gap-5 text-sm">
            
            {/* Header info */}
            <div className="bg-panel border border-border p-4 rounded-xl flex flex-col gap-3 relative">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedClient.name}</h3>
                  <span className="text-[10px] font-mono text-foreground/45">ID: {selectedClient.id}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleToggleVip(selectedClient)}
                  className={selectedClient.isVip ? 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10' : 'border-slate-500/30 text-slate-400'}
                >
                  {selectedClient.isVip ? 'Quitar VIP' : 'Marcar VIP'}
                </Button>
              </div>

              <div className="flex flex-col gap-1 text-xs border-t border-border/80 pt-2.5 text-slate-300">
                <div>Celular: <span className="font-mono">{selectedClient.phone}</span></div>
                <div>Email: <span>{selectedClient.email}</span></div>
              </div>

              {/* Birthday and anniversary alerts */}
              <div className="flex gap-4 text-xs font-semibold text-foreground/60 border-t border-border/80 pt-2.5">
                {selectedClient.birthday && (
                  <span className="flex items-center gap-1.5"><Cake className="w-3.5 h-3.5 text-primary" /> Cumpleaños: {new Date(selectedClient.birthday).toLocaleDateString()}</span>
                )}
                {selectedClient.anniversary && (
                  <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-red-400" /> Aniversario: {new Date(selectedClient.anniversary).toLocaleDateString()}</span>
                )}
              </div>

              {selectedClient.notes && (
                <div className="border-t border-border/85 pt-2 flex flex-col gap-0.5 text-xs text-foreground/60">
                  <span className="font-bold text-foreground/45">Notas del Cliente (Alergias/Preferencias):</span>
                  <p className="italic leading-relaxed">{selectedClient.notes}</p>
                </div>
              )}
            </div>

            {/* Aggregated history blocks */}
            {historyLoading ? (
              <div className="text-center text-foreground/50 py-6">Consolidando historial de visitas...</div>
            ) : history ? (
              <div className="flex flex-col gap-4">
                
                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-panel border border-border p-3 rounded-xl flex flex-col gap-0.5">
                    <span className="text-[10px] text-foreground/45 uppercase font-bold tracking-wide">Visitas</span>
                    <span className="text-base font-extrabold text-white">{history.visits}</span>
                  </div>
                  <div className="bg-panel border border-border p-3 rounded-xl flex flex-col gap-0.5">
                    <span className="text-[10px] text-foreground/45 uppercase font-bold tracking-wide">No Shows</span>
                    <span className="text-base font-extrabold text-red-400">{history.noShows}</span>
                  </div>
                  <div className="bg-panel border border-border p-3 rounded-xl flex flex-col gap-0.5">
                    <span className="text-[10px] text-foreground/45 uppercase font-bold tracking-wide">Consumo</span>
                    <span className="text-base font-extrabold text-emerald-400">${Number(history.estimatedConsumption).toLocaleString('es-CO')}</span>
                  </div>
                </div>

                {/* History table */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wide">Historial Reciente de Reservas:</span>
                  <div className="max-h-44 overflow-y-auto border border-border rounded-xl">
                    {history.list.length === 0 ? (
                      <p className="text-center py-6 text-xs text-foreground/40 italic">Ninguna reserva histórica.</p>
                    ) : (
                      history.list.map((res: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 border-b border-border last:border-0 text-xs">
                          <span className="font-mono text-slate-350">{new Date(res.dateTime).toLocaleDateString()} {new Date(res.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="font-bold text-foreground/60">{res.partySize} personas</span>
                          <Badge variant={res.status === 'COMPLETED' ? 'success' : res.status === 'CANCELLED' ? 'error' : res.status === 'NO_SHOW' ? 'neutral' : 'info'}>
                            {res.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            ) : null}

            <div className="flex justify-end mt-2">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar Ficha</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
export default CRMPage;
