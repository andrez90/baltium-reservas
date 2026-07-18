import React, { useState, useRef, useEffect } from 'react';
import type { Table, TableStatus } from '../../context/AuthContext';
import { Button, Input, Select, Dialog, Badge } from '../ui';
import { Plus, Trash2, Maximize, Move, HelpCircle } from 'lucide-react';

interface FloorPlanCanvasProps {
  tables: Table[];
  onTablesUpdate: (updatedTables: Table[]) => void;
  onTableDelete?: (id: string) => void;
  onTableCreate?: (table: Omit<Table, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) => void;
  isEditMode: boolean;
  onTableSelect?: (table: Table) => void;
}

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
  tables,
  onTablesUpdate,
  onTableDelete,
  onTableCreate,
  isEditMode,
  onTableSelect
}) => {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  
  // Table creation form states
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newTableShape, setNewTableShape] = useState('rectangular');
  const [newTableZone, setNewTableZone] = useState('MAIN');

  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle table placement drag updates (responsive percentage coords mapping)
  const handleMouseDown = (e: React.MouseEvent, table: Table) => {
    if (!isEditMode) return;
    e.preventDefault();
    setDraggedTableId(table.id);
    
    // Calculate drag offset relative to the table's current x and y positions
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      
      // Calculate offset in grid pixels
      const gridWidth = rect.width;
      const gridHeight = rect.height;
      
      const currentX = (table.x / 1000) * gridWidth;
      const currentY = (table.y / 1000) * gridHeight;
      
      setDragOffset({
        x: clientX - currentX,
        y: clientY - currentY
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggedTableId || !isEditMode) return;
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        let clientX = e.clientX - rect.left;
        let clientY = e.clientY - rect.top;
        
        // Subtract offset
        let targetX = clientX - dragOffset.x;
        let targetY = clientY - dragOffset.y;
        
        // Bounds checking
        targetX = Math.max(0, Math.min(targetX, rect.width - 80));
        targetY = Math.max(0, Math.min(targetY, rect.height - 80));
        
        // Convert back to 0-1000 grid space
        const xPercentage = Math.round((targetX / rect.width) * 1000);
        const yPercentage = Math.round((targetY / rect.height) * 1000);
        
        // Update table coordinates
        const updated = tables.map(t => {
          if (t.id === draggedTableId) {
            return { ...t, x: xPercentage, y: yPercentage };
          }
          return t;
        });
        
        onTablesUpdate(updated);
      }
    };

    const handleMouseUp = () => {
      if (draggedTableId) {
        setDraggedTableId(null);
      }
    };

    if (draggedTableId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedTableId, dragOffset, tables, isEditMode, onTablesUpdate]);

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    if (isEditMode) return;
    
    if (onTableSelect) {
      onTableSelect(table);
    }
    setIsStateModalOpen(true);
  };

  const handleSaveState = (status: TableStatus) => {
    if (selectedTable) {
      const updated = tables.map(t => {
        if (t.id === selectedTable.id) {
          return { ...t, status };
        }
        return t;
      });
      onTablesUpdate(updated);
      setIsStateModalOpen(false);
    }
  };

  const handleCreateTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName) return;

    if (onTableCreate) {
      onTableCreate({
        name: newTableName,
        capacity: Number(newTableCapacity),
        shape: newTableShape,
        zone: newTableZone,
        status: 'AVAILABLE',
        x: 100, // Spawn at grid coordinates
        y: 100,
        width: newTableShape === 'round' ? 80 : 100,
        height: newTableShape === 'round' ? 80 : 80
      });
    }

    // Reset fields
    setNewTableName('');
    setNewTableCapacity(4);
    setNewTableShape('rectangular');
    setNewTableZone('MAIN');
    setIsCreateModalOpen(false);
  };

  // Color code maps for statuses
  const statusColors: { [key in TableStatus]: string } = {
    AVAILABLE: 'bg-emerald-500 border-emerald-600 shadow-emerald-500/20 text-emerald-950',
    RESERVED: 'bg-blue-500 border-blue-600 shadow-blue-500/20 text-blue-950',
    OCCUPIED: 'bg-purple-500 border-purple-600 shadow-purple-500/20 text-purple-950',
    CLEANING: 'bg-amber-500 border-amber-600 shadow-amber-500/20 text-amber-950',
    OUT_OF_SERVICE: 'bg-slate-500 border-slate-600 shadow-slate-500/20 text-slate-200'
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Visual Canvas Toolbar */}
      <div className="flex items-center justify-between border border-border bg-panel/30 p-4 rounded-xl">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-foreground/70">
            {isEditMode ? '🛠️ Editor de Distribución (Arrastra las Mesas)' : '📍 Mapa de Mesas en Tiempo Real'}
          </h3>
          <div className="flex items-center gap-2 text-xs text-foreground/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Libre
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Reservada
            <span className="w-2 h-2 rounded-full bg-purple-500"></span> Ocupada
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Limpiando
          </div>
        </div>

        {isEditMode && onTableCreate && (
          <Button variant="outline" size="sm" icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
            Nueva Mesa
          </Button>
        )}
      </div>

      {/* Grid Floor Plan Canvas Container */}
      <div 
        ref={canvasRef}
        className="relative w-full h-[500px] border border-border rounded-xl bg-panel/10 floorplan-grid overflow-hidden shadow-inner page-transition"
      >
        {tables.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-foreground/40 gap-2">
            <HelpCircle className="w-8 h-8 opacity-50" />
            <p className="text-sm">No hay mesas agregadas. Pulsa en Editar plano para comenzar.</p>
          </div>
        ) : (
          tables.map((table) => {
            const isRound = table.shape === 'round';
            const colorClass = statusColors[table.status] || 'bg-slate-500 border-slate-600';
            
            // Render at responsive percentages based on stored 0-1000 coordinates
            const leftPct = `${table.x / 10}%`;
            const topPct = `${table.y / 10}%`;
            
            return (
              <div
                key={table.id}
                onMouseDown={(e) => handleMouseDown(e, table)}
                onClick={() => handleTableClick(table)}
                style={{
                  position: 'absolute',
                  left: leftPct,
                  top: topPct,
                  cursor: isEditMode ? 'move' : 'pointer',
                  width: `${table.width}px`,
                  height: `${table.height}px`,
                  touchAction: 'none'
                }}
                className={`flex flex-col items-center justify-center border-2 text-center shadow-lg transition-shadow select-none hover:shadow-xl hover:scale-[1.01] ${isRound ? 'rounded-full' : 'rounded-xl'} ${colorClass} ${draggedTableId === table.id ? 'opacity-70 scale-95 border-dashed border-white' : ''}`}
              >
                {/* Visual state handler */}
                <div className="absolute top-1 right-1">
                  {isEditMode && (
                    <div className="p-0.5 bg-background/25 rounded hover:bg-red-500/20 text-foreground cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onTableDelete) onTableDelete(table.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-100" />
                    </div>
                  )}
                </div>

                <span className="text-xs font-bold tracking-tight">{table.name}</span>
                <span className="text-[10px] font-medium opacity-80">Cap. {table.capacity}p</span>
                <span className="text-[9px] font-semibold tracking-wider opacity-60 uppercase mt-0.5">{table.zone}</span>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE TABLE MODAL */}
      <Dialog isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Crear Nueva Mesa">
        <form onSubmit={handleCreateTableSubmit} className="flex flex-col gap-4">
          <Input 
            label="Nombre de la Mesa" 
            placeholder="Ej. Mesa 12, Barra 2" 
            value={newTableName} 
            onChange={(e) => setNewTableName(e.target.value)} 
            required 
          />
          <Input 
            label="Capacidad (Comensales)" 
            type="number" 
            min={1} 
            value={newTableCapacity} 
            onChange={(e) => setNewTableCapacity(Number(e.target.value))} 
            required 
          />
          <Select 
            label="Forma"
            value={newTableShape}
            onChange={(e) => setNewTableShape(e.target.value)}
            options={[
              { value: 'rectangular', label: 'Rectangular' },
              { value: 'round', label: 'Redonda (Mesa Redonda)' }
            ]}
          />
          <Select 
            label="Zona de Ubicación"
            value={newTableZone}
            onChange={(e) => setNewTableZone(e.target.value)}
            options={[
              { value: 'MAIN', label: 'Salón Principal' },
              { value: 'TERRACE', label: 'Terraza exterior' },
              { value: 'VIP', label: 'Zona VIP Reservada' },
              { value: 'BAR', label: 'Barra' }
            ]}
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Agregar Mesa</Button>
          </div>
        </form>
      </Dialog>

      {/* STATE CONTROL / SEATING INFO MODAL */}
      <Dialog isOpen={isStateModalOpen} onClose={() => setIsStateModalOpen(false)} title={selectedTable?.name || 'Gestión de Mesa'}>
        {selectedTable && (
          <div className="flex flex-col gap-4 text-sm">
            <div className="bg-panel border border-border p-4 rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground/60">Ubicación:</span>
                <span className="font-bold">{selectedTable.zone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground/60">Capacidad Máxima:</span>
                <span className="font-bold">{selectedTable.capacity} personas</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground/60">Estado Actual:</span>
                <Badge variant={
                  selectedTable.status === 'AVAILABLE' ? 'success' :
                  selectedTable.status === 'RESERVED' ? 'info' :
                  selectedTable.status === 'OCCUPIED' ? 'purple' :
                  selectedTable.status === 'CLEANING' ? 'warning' : 'neutral'
                }>
                  {selectedTable.status}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-foreground/70 uppercase">Cambiar Estado de la Mesa:</span>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleSaveState('AVAILABLE')} className="border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10">
                  Libre (Disponible)
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSaveState('OCCUPIED')} className="border-purple-500/20 text-purple-500 hover:bg-purple-500/10">
                  Ocupado (Comiendo)
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSaveState('CLEANING')} className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10">
                  Limpiando (En Limpieza)
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSaveState('OUT_OF_SERVICE')} className="border-slate-500/20 text-slate-400 hover:bg-slate-500/10">
                  Fuera de Servicio
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsStateModalOpen(false)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
