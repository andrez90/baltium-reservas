import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { FloorPlanCanvas } from '../components/visualizer/FloorPlanCanvas';
import { Button } from '../components/ui';
import { Edit2, Save, X, RefreshCw } from 'lucide-react';
import type { Table } from '../context/AuthContext';

export const FloorPlanPage: React.FC = () => {
  const { socket } = useSocket();
  const [tables, setTables] = useState<Table[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Keep a backup of table coordinates before entering edit mode to allow canceling changes
  const [tablesBackup, setTablesBackup] = useState<Table[]>([]);

  const fetchTables = async () => {
    try {
      const res = await api.get('/tables');
      setTables(res.data.tables);
    } catch (e) {
      console.error('Error loading tables:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();

    // Listen for real-time updates of table statuses (e.g. from bookings status modifications)
    if (socket) {
      socket.on('floorPlanUpdated', (data: { tables: Table[] }) => {
        if (!isEditMode) {
          setTables(data.tables);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('floorPlanUpdated');
      }
    };
  }, [socket, isEditMode]);

  const handleEnterEditMode = () => {
    setTablesBackup(JSON.parse(JSON.stringify(tables)));
    setIsEditMode(true);
  };

  const handleCancelEditMode = () => {
    setTables(tablesBackup);
    setIsEditMode(false);
  };

  const handleSaveLayout = async () => {
    setSaving(true);
    try {
      // Map tables to payload: id, x, y, width, height, status
      const payload = tables.map(t => ({
        id: t.id,
        x: t.x,
        y: t.y,
        width: t.width,
        height: t.height,
        status: t.status
      }));

      await api.put('/tables/layout', { tables: payload });
      alert('Distribución del plano de mesas guardado con éxito.');
      setIsEditMode(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar la distribución.');
    } finally {
      setSaving(false);
    }
  };

  const handleTablesUpdate = (updated: Table[]) => {
    setTables(updated);
  };

  const handleTableCreate = async (newTable: Omit<Table, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) => {
    try {
      await api.post('/tables', newTable);
      fetchTables();
    } catch (e) {
      alert('Error al agregar mesa.');
    }
  };

  const handleTableDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta mesa?')) return;
    try {
      await api.delete(`/tables/${id}`);
      fetchTables();
    } catch (e) {
      alert('Error al eliminar mesa.');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 page-transition">
      
      {/* Visual Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Plano de Salones (Mesas)</h2>
          <p className="text-xs text-foreground/45 mt-0.5">Controla la distribución visual de tu local e identifica la ocupación.</p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditMode ? (
            <Button variant="outline" size="sm" icon={Edit2} onClick={handleEnterEditMode}>
              Editar Distribución
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" icon={X} onClick={handleCancelEditMode}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" icon={Save} isLoading={saving} onClick={handleSaveLayout}>
                Guardar Plano
              </Button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-foreground/50 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span>Cargando plano visual...</span>
        </div>
      ) : (
        <FloorPlanCanvas 
          tables={tables}
          isEditMode={isEditMode}
          onTablesUpdate={handleTablesUpdate}
          onTableCreate={handleTableCreate}
          onTableDelete={handleTableDelete}
        />
      )}

    </div>
  );
};
export default FloorPlanPage;
