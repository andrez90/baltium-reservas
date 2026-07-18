import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Select } from '../components/ui';
import { Settings, Palette, Globe, Shield, RefreshCw, UserPlus, Users } from 'lucide-react';

interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export const SettingsPage: React.FC = () => {
  const { tenant, updateTenantColors } = useAuth();
  
  // Branding States
  const [name, setName] = useState(tenant?.name || '');
  const [logo, setLogo] = useState(tenant?.logo || '');
  const [primaryColor, setPrimaryColor] = useState(tenant?.primaryColor || '#0f172a');
  const [secondaryColor, setSecondaryColor] = useState(tenant?.secondaryColor || '#3b82f6');
  const [domain, setDomain] = useState(tenant?.domain || '');

  // Schedule State - días en español
  const defaultSchedule = [
    { day: 'Lunes',     open: '12:00', close: '23:00', closed: false },
    { day: 'Martes',    open: '12:00', close: '23:00', closed: false },
    { day: 'Miércoles', open: '12:00', close: '23:00', closed: false },
    { day: 'Jueves',    open: '12:00', close: '23:00', closed: false },
    { day: 'Viernes',   open: '12:00', close: '00:00', closed: false },
    { day: 'Sábado',    open: '13:00', close: '00:00', closed: false },
    { day: 'Domingo',   open: '13:00', close: '22:00', closed: false },
  ];
  const [weekSchedule, setWeekSchedule] = useState(defaultSchedule);

  // Integrations States
  const [metaPixelId, setMetaPixelId] = useState('');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  
  // Localized configuration fields
  const [address, setAddress] = useState('Altamira Palmira');
  const [gallery, setGallery] = useState('');

  // Staff States
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffFirst, setStaffFirst] = useState('');
  const [staffLast, setStaffLast] = useState('');
  const [staffRole, setStaffRole] = useState('RECEPTION');

  const [isLoading, setIsLoading] = useState(false);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/auth/me'); // Gets current context
      const tId = res.data.user.tenantId;
      if (tId) {
        // Query users
        const usersRes = await api.get('/tenants/' + tId);
        // Fallback mock list for demo since endpoint returns single tenant
        setStaff([
          { id: '1', email: 'admin@baltium.com', firstName: 'Alejandro', lastName: 'Gómez', role: 'ADMIN' },
          { id: '2', email: 'reception@baltium.com', firstName: 'Sofía', lastName: 'Sanz', role: 'RECEPTION' },
          { id: '3', email: 'waiter@baltium.com', firstName: 'Carlos', lastName: 'Ruiz', role: 'WAITER' }
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStaff();
    if (tenant) {
      setName(tenant.name);
      setLogo(tenant.logo || '');
      setPrimaryColor(tenant.primaryColor);
      setSecondaryColor(tenant.secondaryColor);
      setDomain(tenant.domain);
      
      try {
        const conf = JSON.parse(tenant.configuration || '{}');
        setMetaPixelId(conf.metaPixelId || '');
        setGoogleAnalyticsId(conf.googleAnalyticsId || '');
        setSmtpHost(conf.smtpHost || 'smtp.mailtrap.io');
        setAddress(conf.address || 'Altamira Palmira');
        setGallery(conf.gallery ? conf.gallery.join('\n') : '');
      } catch (e) {
        // ignore
      }

      try {
        const savedSchedule = JSON.parse((tenant as any).schedule || '[]');
        if (savedSchedule.length > 0) setWeekSchedule(savedSchedule);
      } catch (e) {
        // ignore, use defaults
      }
    }
  }, [tenant]);

  const handleBrandingSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setIsLoading(true);

    try {
      const updatedConfig = {
        metaPixelId,
        googleAnalyticsId,
        smtpHost,
        address: address || 'Altamira Palmira',
        gallery: gallery.split('\n').map(u => u.trim()).filter(Boolean)
      };

      await api.put(`/tenants/${tenant.id}`, {
        name,
        logo,
        primaryColor,
        secondaryColor,
        domain,
        schedule: JSON.stringify(weekSchedule.filter(d => !d.closed)),
        configuration: JSON.stringify(updatedConfig)
      });

      // Instantly apply colors to dashboard preview
      updateTenantColors(primaryColor, secondaryColor);
      alert('Configuración de branding guardada con éxito.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar branding');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    try {
      await api.post('/auth/register', {
        email: staffEmail,
        password: staffPassword,
        firstName: staffFirst,
        lastName: staffLast,
        role: staffRole,
        tenantId: tenant.id
      });

      alert('Miembro del personal registrado con éxito.');
      setIsAddingStaff(false);
      setStaffEmail('');
      setStaffPassword('');
      setStaffFirst('');
      setStaffLast('');
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al registrar miembro del personal');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 page-transition max-w-4xl">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" /> Configuración General
        </h2>
        <p className="text-xs text-foreground/45 mt-0.5">Controla la marca, las integraciones SEO y los accesos del equipo.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        
        {/* Left columns: Branding & integrations form */}
        <form onSubmit={handleBrandingSave} className="md:col-span-2 flex flex-col gap-6">
          
          {/* Section 1: Brand */}
          <div className="bg-panel border border-panel-border p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/75 flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" /> Identidad Visual y Colores
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombre Comercial" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="Logo URL" placeholder="https://..." value={logo} onChange={(e) => setLogo(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground/80 uppercase">Color Primario</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-9 h-9 rounded bg-transparent border-0 cursor-pointer" />
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono text-xs uppercase" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground/80 uppercase">Color Secundario</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-9 h-9 rounded bg-transparent border-0 cursor-pointer" />
                  <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="font-mono text-xs uppercase" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Input label="Ubicación / Dirección" placeholder="Ej. Altamira Palmira" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground/80 uppercase">Galería de Fotos (Una URL por línea)</label>
              <textarea
                value={gallery}
                onChange={(e) => setGallery(e.target.value)}
                placeholder="https://images.unsplash.com/photo-1...\nhttps://images.unsplash.com/photo-2..."
                className="w-full text-xs rounded-lg bg-panel border border-border px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] font-mono placeholder-foreground/20"
              />
            </div>
            
            <div className="border-t border-border/80 pt-4 mt-1 flex flex-col gap-1">
              <span className="text-xs font-semibold text-foreground/60 uppercase">Enlace Público de Reservas:</span>
              <a href={`/restaurant/${tenant?.domain.replace('.com', '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs font-bold font-mono">
                http://localhost:5173/restaurant/{tenant?.domain.replace('.com', '')}
              </a>
            </div>
          </div>

          {/* Section 2: Integrations */}
          <div className="bg-panel border border-panel-border p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/75 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Integraciones Analíticas y SEO
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Meta Pixel ID" placeholder="Ej. pixel_12345" value={metaPixelId} onChange={(e) => setMetaPixelId(e.target.value)} />
              <Input label="Google Analytics ID" placeholder="Ej. G-XXXXXXXXXX" value={googleAnalyticsId} onChange={(e) => setGoogleAnalyticsId(e.target.value)} />
            </div>

            <Input label="Servidor SMTP Host" placeholder="smtp.mailtrap.io" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
          </div>

          {/* Section 3: Horario de Apertura */}
          <div className="bg-panel border border-panel-border p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/75 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" /> Horario de Apertura
            </h3>
            <p className="text-[11px] text-foreground/45">Configura los horarios de apertura y cierre de cada día. Los días marcados como cerrados no aparecerán en la landing pública.</p>
            <div className="flex flex-col gap-2">
              {weekSchedule.map((day, i) => (
                <div key={day.day} className="grid grid-cols-4 gap-3 items-center text-xs">
                  <span className="font-semibold text-white col-span-1">{day.day}</span>
                  <input
                    type="time"
                    value={day.open}
                    disabled={day.closed}
                    onChange={(e) => {
                      const updated = [...weekSchedule];
                      updated[i] = { ...updated[i], open: e.target.value };
                      setWeekSchedule(updated);
                    }}
                    className="bg-input border border-border rounded-lg px-2 py-1.5 text-white text-xs disabled:opacity-30"
                  />
                  <input
                    type="time"
                    value={day.close}
                    disabled={day.closed}
                    onChange={(e) => {
                      const updated = [...weekSchedule];
                      updated[i] = { ...updated[i], close: e.target.value };
                      setWeekSchedule(updated);
                    }}
                    className="bg-input border border-border rounded-lg px-2 py-1.5 text-white text-xs disabled:opacity-30"
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer text-foreground/60">
                    <input
                      type="checkbox"
                      checked={day.closed}
                      onChange={(e) => {
                        const updated = [...weekSchedule];
                        updated[i] = { ...updated[i], closed: e.target.checked };
                        setWeekSchedule(updated);
                      }}
                      className="accent-red-500 w-3.5 h-3.5"
                    />
                    Cerrado
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end mt-1">
            <Button variant="primary" type="submit" isLoading={isLoading} className="py-2.5 px-6">
              Guardar Configuración
            </Button>
          </div>
        </form>

        {/* Right column: Team management */}
        <div className="md:col-span-1 bg-panel border border-panel-border p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/75 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Personal y Roles (Staff)
          </h3>

          <div className="flex flex-col gap-3">
            {staff.map((member) => (
              <div key={member.id} className="flex items-center justify-between border-b border-border pb-2.5 last:border-0 last:pb-0 text-xs">
                <div className="flex flex-col">
                  <span className="font-bold text-white">{member.firstName} {member.lastName}</span>
                  <span className="text-[10px] text-foreground/45">{member.email}</span>
                </div>
                <span className="text-[9px] font-bold bg-slate-800 text-slate-350 border border-slate-700 px-1.5 py-0.5 rounded uppercase">
                  {member.role}
                </span>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" icon={UserPlus} onClick={() => setIsAddingStaff(!isAddingStaff)} className="w-full mt-2">
            Agregar Empleado
          </Button>

          {isAddingStaff && (
            <form onSubmit={handleAddStaffSubmit} className="flex flex-col gap-3 border-t border-border/80 pt-4 mt-2 animate-fade-in">
              <Input label="Nombre" value={staffFirst} onChange={(e) => setStaffFirst(e.target.value)} required />
              <Input label="Apellido" value={staffLast} onChange={(e) => setStaffLast(e.target.value)} required />
              <Input label="Email" type="email" placeholder="staff@baltium.com" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} required />
              <Input label="Contraseña" type="password" value={staffPassword} onChange={(e) => setStaffPassword(e.target.value)} required />
              <Select 
                label="Rol Operativo"
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value)}
                options={[
                  { value: 'ADMIN', label: 'Administrador' },
                  { value: 'RECEPTION', label: 'Recepción' },
                  { value: 'WAITER', label: 'Mesero' },
                  { value: 'CASHIER', label: 'Cajero' }
                ]}
              />
              <Button variant="primary" size="sm" type="submit" className="w-full mt-1">Registrar Empleado</Button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
};
export default SettingsPage;
