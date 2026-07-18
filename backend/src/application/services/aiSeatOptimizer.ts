import { Table, Reservation } from '../../domain/entities';

export interface SeatingSuggestion {
  recommendedTableIds: string[];
  explanation: string;
  score: number; // 0 to 100 percentage score of how optimal the fit is
  requiresJoin: boolean;
}

export class AISeatOptimizer {
  /**
   * Suggests the best table (or combined tables) for a new reservation
   * @param partySize Number of guests
   * @param preferredZone The target zone (MAIN, TERRACE, VIP, BAR)
   * @param tables All tables in the restaurant
   * @param activeReservations Existing reservations around the selected time window
   */
  static suggestBestSeating(
    partySize: number,
    preferredZone: string,
    tables: Table[],
    activeReservations: Reservation[]
  ): SeatingSuggestion | null {
    // 1. Filter out tables that are busy or reserved at this time
    const busyTableIds = new Set(
      activeReservations
        .map(r => r.tableId)
        .filter((id): id is string => id !== null && id !== undefined)
    );

    const availableTables = tables.filter(
      t => t.status === 'AVAILABLE' && !busyTableIds.has(t.id)
    );

    if (availableTables.length === 0) {
      return null;
    }

    // 2. Try to find a single table that fits perfectly
    const singleTableOptions = availableTables.filter(t => t.capacity >= partySize);

    if (singleTableOptions.length > 0) {
      // Sort single tables:
      // - Prioritize preferred zone
      // - Prioritize minimal waste of capacity: (table.capacity - partySize) asc
      // - Prioritize small tables first (to keep large tables free for bigger parties)
      singleTableOptions.sort((a, b) => {
        const zoneA = a.zone.toLowerCase() === preferredZone.toLowerCase() ? 0 : 1;
        const zoneB = b.zone.toLowerCase() === preferredZone.toLowerCase() ? 0 : 1;
        if (zoneA !== zoneB) return zoneA - zoneB;

        const wasteA = a.capacity - partySize;
        const wasteB = b.capacity - partySize;
        if (wasteA !== wasteB) return wasteA - wasteB;

        return a.capacity - b.capacity;
      });

      const bestTable = singleTableOptions[0];
      const waste = bestTable.capacity - partySize;
      // Score decreases as waste increases
      const score = Math.max(50, 100 - waste * 10);

      return {
        recommendedTableIds: [bestTable.id],
        explanation: `Se recomienda la Mesa "${bestTable.name}" en la zona ${bestTable.zone}. Capacidad: ${bestTable.capacity} personas. Sobran ${waste} asientos.`,
        score,
        requiresJoin: false,
      };
    }

    // 3. If no single table is big enough, try to suggest joining two tables in the same zone
    // Find combination of 2 tables in the same zone
    const combinations: { t1: Table; t2: Table; combinedCapacity: number }[] = [];
    for (let i = 0; i < availableTables.length; i++) {
      for (let j = i + 1; j < availableTables.length; j++) {
        const t1 = availableTables[i];
        const t2 = availableTables[j];
        if (t1.zone === t2.zone) {
          const combinedCapacity = t1.capacity + t2.capacity;
          if (combinedCapacity >= partySize) {
            combinations.push({ t1, t2, combinedCapacity });
          }
        }
      }
    }

    if (combinations.length > 0) {
      // Sort combinations:
      // - Prioritize preferred zone
      // - Minimize combined waste
      combinations.sort((a, b) => {
        const zoneA = a.t1.zone.toLowerCase() === preferredZone.toLowerCase() ? 0 : 1;
        const zoneB = b.t1.zone.toLowerCase() === preferredZone.toLowerCase() ? 0 : 1;
        if (zoneA !== zoneB) return zoneA - zoneB;

        const wasteA = a.combinedCapacity - partySize;
        const wasteB = b.combinedCapacity - partySize;
        return wasteA - wasteB;
      });

      const bestCombo = combinations[0];
      const waste = bestCombo.combinedCapacity - partySize;
      const score = Math.max(40, 80 - waste * 10); // slightly lower score because it requires joining tables

      return {
        recommendedTableIds: [bestCombo.t1.id, bestCombo.t2.id],
        explanation: `Se sugiere juntar la Mesa "${bestCombo.t1.name}" y la Mesa "${bestCombo.t2.name}" en la zona ${bestCombo.t1.zone}. Capacidad combinada: ${bestCombo.combinedCapacity} personas.`,
        score,
        requiresJoin: true,
      };
    }

    return null;
  }
}
