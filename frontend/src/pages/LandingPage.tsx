import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Select } from '../components/ui';
import { Calendar, Users, MessageSquare, Clock, MapPin, Send, HelpCircle, PhoneCall, Utensils } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SimulatorMessage {
  id: string;
  type: 'EMAIL' | 'WHATSAPP' | 'SMS';
  to: string;
  subject?: string;
  message: string;
  timestamp: string;
  status: 'SENT' | 'FAILED';
}

// Traducción de días de la semana de inglés a español
const dayTranslation: Record<string, string> = {
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miércoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sábado',
  Sunday: 'Domingo',
  // Por si vienen abreviados
  Mon: 'Lun',
  Tue: 'Mar',
  Wed: 'Mié',
  Thu: 'Jue',
  Fri: 'Vie',
  Sat: 'Sáb',
  Sun: 'Dom',
};

const translateDay = (day: string): string => dayTranslation[day] ?? day;

export const LandingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { syncProfile } = useAuth();
  
  // Tenant details
  const [restaurantName, setRestaurantName] = useState('Baltium Gastrobar');
  const [tenantId, setTenantId] = useState('');
  const [logo, setLogo] = useState('');
  const [schedule, setSchedule] = useState<any[]>([]);

  // Booking form states
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [zone, setZone] = useState('MAIN');
  const [celebration, setCelebration] = useState('NONE');
  const [notes, setNotes] = useState('');
  const [tablePurchased, setTablePurchased] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(15);
  const [purchasePaymentMethod, setPurchasePaymentMethod] = useState('TARJETA');

  const [isLoading, setIsLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);

  // Menu items list state
  const [menuItems, setMenuItems] = useState<any[]>([]);

  // Simulator Drawer states
  const [simulatorMessages, setSimulatorMessages] = useState<SimulatorMessage[]>([]);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(true);

  // 1. Fetch Tenant data based on slug (or fallback to gastrobar-baltium)
  useEffect(() => {
    const fetchTenant = async () => {
      const lookupDomain = slug ? `${slug}.com` : 'gastrobar-baltium.com';
      try {
        const res = await axios.get(`http://localhost:3001/api/tenants/domain/${lookupDomain}`);
        const t = res.data.tenant;
        setTenantId(t.id);
        setRestaurantName(t.name);
        setLogo(t.logo || '');
        setSchedule(JSON.parse(t.schedule || '[]'));
        
        // Dynamically apply primary/secondary branding colors to CSS properties
        const root = document.documentElement;
        root.style.setProperty('--primary-color', t.primaryColor);
        root.style.setProperty('--secondary-color', t.secondaryColor);
      } catch (err) {
        console.error('Error fetching tenant details:', err);
      }
    };
    fetchTenant();
  }, [slug]);

  useEffect(() => {
    const fetchMenu = async () => {
      if (tenantId) {
        try {
          const res = await axios.get(`http://localhost:3001/api/menu?tenantId=${tenantId}`);
          setMenuItems(res.data.menu);
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchMenu();
  }, [tenantId]);

  // 2. Poll notification simulator messages for the drawer
  useEffect(() => {
    const fetchSimulator = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/notifications/simulator');
        setSimulatorMessages(res.data.notifications);
      } catch (e) {
        // ignore errors
      }
    };
    fetchSimulator();
    const interval = setInterval(fetchSimulator, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const bookingPayload = {
      clientName,
      clientPhone,
      clientEmail,
      dateTime: `${bookingDate}T${bookingTime}:00`,
      partySize: Number(partySize),
      zone,
      celebration,
      notes,
      tenantId: tenantId || undefined,
      tablePurchased,
      purchaseAmount: tablePurchased ? Number(purchaseAmount) : null,
      purchasePaymentMethod: tablePurchased ? purchasePaymentMethod : null
    };

    try {
      const res = await axios.post('http://localhost:3001/api/reservations', bookingPayload);
      setIsLoading(false);
      setBookingSuccess(res.data);
      
      // Fire confetti burst!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Clear fields
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setBookingDate('');
      setBookingTime('');
      setPartySize(2);
      setNotes('');
    } catch (err: any) {
      setIsLoading(false);
      alert(err.response?.data?.error || 'Error al procesar tu reserva. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative pb-12">
      {/* Dynamic Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-white">
                🍽️
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">{restaurantName}</h1>
              <span className="text-[10px] uppercase font-semibold text-primary">Reservas en línea</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <a href="#galeria" className="hover:text-white transition-colors">Galería</a>
            <a href="#horario" className="hover:text-white transition-colors">Horarios</a>
            <a href="#reservar" className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">Reservar Ahora</a>
          </div>
        </div>
      </header>

      {/* Hero Booking Wrapper */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 grid md:grid-cols-5 gap-8 items-start">
        
        {/* Left column: Info details */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Disfruta de una Experiencia Gastronómica Única
            </h2>
            <p className="text-sm text-slate-400">
              Reserva tu mesa en segundos de forma gratuita y recibe confirmación automática al instante en tu celular por WhatsApp e Email.
            </p>
          </div>

          {/* Schedule list */}
          <div id="horario" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Horarios de Apertura
            </h3>
            <div className="flex flex-col gap-2.5 text-xs text-slate-400">
              {schedule.length > 0 ? (
                schedule.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between border-b border-slate-800/50 pb-1.5">
                    <span className="font-medium text-slate-300">{translateDay(item.day)}</span>
                    <span>{item.open} - {item.close}</span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between">
                  <span>Lunes a Domingo</span>
                  <span>12:00 - 23:00</span>
                </div>
              )}
            </div>
          </div>

          {/* Location mock details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Nuestra Ubicación
            </h3>
            <div className="flex flex-col gap-2 text-xs text-slate-400">
              <p className="text-slate-300">Paseo de la Castellana 124, Madrid, España</p>
              <div className="h-28 rounded-xl bg-slate-800 border border-slate-700/50 relative overflow-hidden flex items-center justify-center">
                <span className="text-[10px] uppercase font-bold tracking-wide text-slate-500">Google Map Placeholder</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Form */}
        <div id="reservar" className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          {bookingSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl shadow-lg">
                ✓
              </div>
              <h3 className="text-xl font-bold text-white">¡Reserva Registrada Exitosamente!</h3>
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl w-full max-w-sm flex flex-col gap-2.5 text-xs text-left">
                <div className="flex justify-between"><span className="text-slate-500">Código de Reserva:</span><span className="font-mono text-primary font-bold uppercase">{bookingSuccess.reservation?.id?.slice(0, 8)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Comensal:</span><span className="text-slate-300">{bookingSuccess.reservation?.clientName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Fecha y Hora:</span><span className="text-slate-300">{new Date(bookingSuccess.reservation?.dateTime).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Personas:</span><span className="text-slate-300 font-bold">{bookingSuccess.reservation?.partySize} personas</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Zona:</span><span className="text-slate-300">{bookingSuccess.reservation?.zone}</span></div>
                {bookingSuccess.aiExplanation && (
                  <div className="border-t border-slate-800/80 pt-2.5 mt-1.5">
                    <span className="text-[10px] font-bold text-primary block uppercase mb-1">Distribución Inteligente (IA):</span>
                    <p className="text-slate-400 italic text-[11px] leading-relaxed">{bookingSuccess.aiExplanation}</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 px-6 mt-2">
                Hemos enviado las notificaciones de confirmación. Puedes revisar tu WhatsApp simulado en la esquina inferior derecha.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => setBookingSuccess(null)}>
                Hacer otra Reserva
              </Button>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4">
              <div className="border-b border-slate-800 pb-3 flex flex-col gap-1">
                <h3 className="text-lg font-bold text-white">Formulario de Reserva</h3>
                <p className="text-xs text-slate-400">Introduce tus datos para buscar mesa disponible.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Nombre Completo" 
                  placeholder="Ej. Juan Pérez" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)} 
                  required 
                  className="bg-slate-950 border-slate-800"
                />
                <Input 
                  label="Celular / WhatsApp" 
                  type="tel" 
                  placeholder="Ej. +34600111222" 
                  value={clientPhone} 
                  onChange={(e) => setClientPhone(e.target.value)} 
                  required 
                  className="bg-slate-950 border-slate-800"
                />
              </div>

              <Input 
                label="Correo Electrónico" 
                type="email" 
                placeholder="Ej. juan@correo.com" 
                value={clientEmail} 
                onChange={(e) => setClientEmail(e.target.value)} 
                required 
                className="bg-slate-950 border-slate-800"
              />

              <div className="grid grid-cols-3 gap-4">
                <Input 
                  label="Fecha" 
                  type="date" 
                  value={bookingDate} 
                  onChange={(e) => setBookingDate(e.target.value)} 
                  required 
                  className="bg-slate-950 border-slate-800"
                />
                <Input 
                  label="Hora" 
                  type="time" 
                  value={bookingTime} 
                  onChange={(e) => setBookingTime(e.target.value)} 
                  required 
                  className="bg-slate-950 border-slate-800"
                />
                <Input 
                  label="Personas" 
                  type="number" 
                  min={1} 
                  max={20}
                  value={partySize} 
                  onChange={(e) => setPartySize(Number(e.target.value))} 
                  required 
                  className="bg-slate-950 border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select 
                  label="Zona Preferida" 
                  value={zone} 
                  onChange={(e) => setZone(e.target.value)}
                  options={[
                    { value: 'MAIN', label: 'Salón Principal' },
                    { value: 'TERRACE', label: 'Terraza' },
                    { value: 'VIP', label: 'Zona VIP' },
                    { value: 'BAR', label: 'Barra' }
                  ]}
                  className="bg-slate-950 border-slate-800"
                />
                <Select 
                  label="Celebración" 
                  value={celebration} 
                  onChange={(e) => setCelebration(e.target.value)}
                  options={[
                    { value: 'NONE', label: 'Ninguna' },
                    { value: 'BIRTHDAY', label: 'Cumpleaños' },
                    { value: 'ANNIVERSARY', label: 'Aniversario' },
                    { value: 'OTHER', label: 'Otro Evento' }
                  ]}
                  className="bg-slate-950 border-slate-800"
                />
              </div>

              {/* COMPRA DE MESA / PREPAGO OPCIONAL */}
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-2.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-300">
                  <input 
                    type="checkbox" 
                    checked={tablePurchased} 
                    onChange={(e) => setTablePurchased(e.target.checked)} 
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-primary focus:ring-primary"
                  />
                  <span>💵 ¿Deseas asegurar tu mesa con un prepago opcional?</span>
                </label>
                
                {tablePurchased && (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in mt-1">
                    <Input 
                      label="Monto del Prepago ($COP)" 
                      type="number" 
                      min={5} 
                      value={purchaseAmount} 
                      onChange={(e) => setPurchaseAmount(Number(e.target.value))} 
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                    <Select 
                      label="Método de Pago" 
                      value={purchasePaymentMethod} 
                      onChange={(e) => setPurchasePaymentMethod(e.target.value)}
                      options={[
                        { value: 'TARJETA', label: 'Tarjeta de Crédito' },
                        { value: 'BIZUM', label: 'Bizum' },
                        { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria' }
                      ]}
                      className="bg-slate-950 border-slate-800 text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Observaciones / Alergias</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. ¿Alguna alergia alimentaria? ¿Mesa cerca de la ventana?"
                  className="w-full text-sm rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-foreground/35 min-h-[70px] resize-none"
                />
              </div>

              <Button variant="primary" type="submit" isLoading={isLoading} className="mt-2 py-3 text-sm">
                Confirmar Reserva Online
              </Button>
            </form>
          )}
        </div>
      </main>

      {/* Menu / Carta Section */}
      {menuItems.length > 0 && (
        <section id="carta" className="max-w-6xl w-full mx-auto px-4 py-12 border-t border-slate-900 page-transition">
          <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400 mb-6 flex items-center gap-2">
            🍽️ Nuestra Carta y Especialidades
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {menuItems.filter(item => item.available).map((item) => (
              <div key={item.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300">
                <div className="h-36 bg-slate-950 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Utensils className="w-10 h-10 text-slate-700" />
                  )}
                </div>
                <div className="p-4 flex flex-col gap-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-bold text-white leading-tight">{item.name}</h4>
                    <span className="text-xs font-bold text-primary font-mono">${item.price.toLocaleString('es-CO')}</span>
                  </div>
                  {item.description && (
                    <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gallery Section */}
      <section id="galeria" className="max-w-6xl w-full mx-auto px-4 py-12 border-t border-slate-900">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400 mb-6 flex items-center gap-2">
          📸 Galería del Restaurante
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&h=300&q=80',
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&h=300&q=80',
            'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&h=300&q=80',
            'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=400&h=300&q=80'
          ].map((url, i) => (
            <div key={i} className="aspect-video rounded-xl bg-slate-800 overflow-hidden border border-slate-800 group cursor-pointer shadow-lg">
              <img src={url} alt="Platillo" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
            </div>
          ))}
        </div>
      </section>

      {/* REAL-TIME WHATSAPP / NOTIFICATION SIMULATOR DRAWER (PREMIUM SaaS ELEMENT) */}
      <div className={`fixed bottom-4 right-4 z-50 rounded-2xl border border-slate-800 shadow-2xl flex flex-col bg-slate-900 text-slate-100 overflow-hidden transition-all duration-300 ${isSimulatorOpen ? 'w-96 h-[480px]' : 'w-48 h-12'}`}>
        {/* Header bar */}
        <div className="flex items-center justify-between p-3.5 bg-slate-950 border-b border-slate-800/80 cursor-pointer"
          onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            SIMULADOR WHATSAPP / SMS
          </div>
          <button className="text-xs opacity-60 hover:opacity-100 font-bold">
            {isSimulatorOpen ? 'Contraer' : 'Expandir'}
          </button>
        </div>

        {isSimulatorOpen && (
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            <div className="p-3 bg-slate-900 border-b border-slate-800/50 text-[10px] text-slate-400 flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>Simula la recepción de notificaciones SMS, WhatsApp y Email salientes del restaurante.</span>
            </div>

            {/* Message feed */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar">
              {simulatorMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center gap-1.5">
                  <Clock className="w-6 h-6 opacity-35" />
                  <p className="text-xs">Esperando notificaciones...</p>
                  <p className="text-[10px] opacity-75">Reserva una mesa para ver la notificación aquí.</p>
                </div>
              ) : (
                simulatorMessages.map((notif) => {
                  const isWa = notif.type === 'WHATSAPP';
                  const isSms = notif.type === 'SMS';
                  const badgeColor = isWa ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : isSms ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20';

                  return (
                    <div key={notif.id} className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-3 shadow gap-2 text-xs relative page-transition">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeColor}`}>
                          {notif.type}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(notif.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-slate-400">Para: {notif.to}</span>
                        {notif.subject && <span className="text-[10px] font-bold text-slate-300">Asunto: {notif.subject}</span>}
                      </div>

                      <p className="text-slate-300 leading-relaxed italic bg-slate-950/50 p-2 border border-slate-850 rounded-lg text-[11px] whitespace-pre-wrap">
                        {notif.message}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
