import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Button, Input, Select, Dialog } from '../components/ui';
import { Utensils, Plus, Trash2, Edit, Save, ToggleLeft, ToggleRight, AlertCircle, RefreshCw } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category: 'ENTRADA' | 'PLATO_FUERTE' | 'POSTRE' | 'BEBIDA';
  imageUrl?: string | null;
  available: boolean;
}

export const MenuPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState<'ENTRADA' | 'PLATO_FUERTE' | 'POSTRE' | 'BEBIDA'>('ENTRADA');
  const [imageUrl, setImageUrl] = useState('');
  const [available, setAvailable] = useState(true);

  const fetchMenu = async () => {
    try {
      const res = await api.get('/menu');
      setMenuItems(res.data.menu);
    } catch (e) {
      console.error('Error fetching menu:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/menu', {
        name,
        description: description || null,
        price: Number(price),
        category,
        imageUrl: imageUrl || null,
        available
      });

      alert('Plato agregado al menú exitosamente.');
      setIsAddModalOpen(false);
      resetForm();
      fetchMenu();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al agregar el plato.');
    }
  };

  const handleEditClick = (item: MenuItem) => {
    setSelectedItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setPrice(item.price);
    setCategory(item.category);
    setImageUrl(item.imageUrl || '');
    setAvailable(item.available);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      await api.put(`/menu/${selectedItem.id}`, {
        name,
        description: description || null,
        price: Number(price),
        category,
        imageUrl: imageUrl || null,
        available
      });

      alert('Plato actualizado exitosamente.');
      setIsEditModalOpen(false);
      resetForm();
      fetchMenu();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al actualizar el plato.');
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      const updatedStatus = !item.available;
      await api.put(`/menu/${item.id}`, { available: updatedStatus });
      setMenuItems(menuItems.map(m => m.id === item.id ? { ...m, available: updatedStatus } : m));
    } catch (e) {
      alert('Error al modificar disponibilidad.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este plato de la carta?')) return;
    try {
      await api.delete(`/menu/${id}`);
      fetchMenu();
    } catch (e) {
      alert('Error al eliminar el plato.');
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice(0);
    setCategory('ENTRADA');
    setImageUrl('');
    setAvailable(true);
    setSelectedItem(null);
  };

  const categories = [
    { value: 'ALL', label: 'Todo' },
    { value: 'ENTRADA', label: 'Entradas' },
    { value: 'PLATO_FUERTE', label: 'Platos Fuertes' },
    { value: 'POSTRE', label: 'Postres' },
    { value: 'BEBIDA', label: 'Bebidas' }
  ];

  const filteredItems = activeCategory === 'ALL' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 page-transition">
      
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-border bg-panel/30 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <Utensils className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold tracking-wider uppercase text-foreground/80 font-mono">Gestión de Menú y Carta</h2>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Category Tabs */}
          <div className="flex rounded-lg border border-border overflow-hidden bg-background">
            {categories.map((cat) => (
              <button 
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`text-xs px-3.5 py-1.5 font-bold transition-all ${activeCategory === cat.value ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" icon={Plus} onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
            Nuevo Plato
          </Button>
        </div>
      </div>

      {/* Grid Menu cards */}
      {loading ? (
        <div className="flex-grow flex items-center justify-center text-foreground/50 gap-2 py-16">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span>Cargando carta del restaurante...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredItems.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-foreground/40 gap-1.5">
              <AlertCircle className="w-6 h-6 opacity-40" />
              <p className="text-xs">No hay platos registrados en esta categoría.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div 
                key={item.id}
                className={`bg-panel border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group transition-all duration-300 hover:shadow-lg ${item.available ? 'border-panel-border' : 'border-red-500/10 opacity-70'}`}
              >
                {/* Visual Image */}
                <div className="h-40 w-full relative bg-slate-900/50 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <Utensils className="w-12 h-12 text-slate-700" />
                  )}
                  
                  {/* Category label overlay */}
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-800 text-[10px] uppercase font-bold text-slate-300 px-2 py-0.5 rounded">
                    {item.category.replace('_', ' ')}
                  </div>

                  {!item.available && (
                    <div className="absolute inset-0 bg-red-950/20 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-[10px] font-extrabold tracking-wider uppercase text-red-200 border border-red-500/30 bg-red-950/80 px-3 py-1 rounded-full shadow">
                        No Disponible
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 flex flex-col gap-2 flex-grow">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-white leading-snug">{item.name}</h4>
                    <span className="text-sm font-extrabold text-primary font-mono">${item.price.toLocaleString('es-CO')}</span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-foreground/45 leading-relaxed flex-grow line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="border-t border-border p-3.5 bg-background/50 flex items-center justify-between">
                  <button 
                    onClick={() => handleToggleAvailable(item)} 
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    {item.available ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                        <span className="text-[10px] font-bold">Disponible</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-slate-500" />
                        <span className="text-[10px] font-bold">Agotado</span>
                      </>
                    )}
                  </button>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditClick(item)} 
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* ADD PLATO MODAL */}
      <Dialog isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Agregar Plato a la Carta">
        <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
          <Input label="Nombre del Plato" placeholder="Ej. Solomillo al Whisky" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Precio ($COP)" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
            <Select 
              label="Categoría"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              options={[
                { value: 'ENTRADA', label: 'Entradas' },
                { value: 'PLATO_FUERTE', label: 'Platos Fuertes' },
                { value: 'POSTRE', label: 'Postres' },
                { value: 'BEBIDA', label: 'Bebidas' }
              ]}
            />
          </div>
          <Input label="Imagen URL" placeholder="https://images.unsplash.com/..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/80 uppercase">Descripción</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ingredientes o notas de preparación..."
              className="w-full text-sm rounded-lg bg-panel/50 border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-foreground/35 min-h-[80px]"
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Agregar Plato</Button>
          </div>
        </form>
      </Dialog>

      {/* EDIT PLATO MODAL */}
      <Dialog isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Plato de la Carta">
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
          <Input label="Nombre del Plato" value={name} onChange={(e) => setName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Precio ($COP)" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
            <Select 
              label="Categoría"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              options={[
                { value: 'ENTRADA', label: 'Entradas' },
                { value: 'PLATO_FUERTE', label: 'Platos Fuertes' },
                { value: 'POSTRE', label: 'Postres' },
                { value: 'BEBIDA', label: 'Bebidas' }
              ]}
            />
          </div>
          <Input label="Imagen URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground/80 uppercase">Descripción</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm rounded-lg bg-panel/50 border border-border px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-foreground/35 min-h-[80px]"
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Guardar Cambios</Button>
          </div>
        </form>
      </Dialog>

    </div>
  );
};
export default MenuPage;
