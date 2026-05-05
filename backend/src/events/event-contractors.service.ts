import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class EventContractorsService {
  constructor(private readonly databaseService: DatabaseService) {}

  private get supabase() {
    return this.databaseService.getClient();
  }

  async findAllByEvent(eventId: string) {
    const { data, error } = await this.supabase
      .from('event_contractors')
      .select(`
        *,
        contractor:contractors(id, name)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new BadRequestException(`Failed to fetch event contractors: ${error.message}`);
    }

    return data || [];
  }

  async syncEventContractors(
    eventId: string,
    contractors: Array<{
      contractor_id: string;
      shift?: string;
      member_quantity?: number;
    }>,
  ) {
    // Get existing contractors for this event
    const { data: existing } = await this.supabase
      .from('event_contractors')
      .select('contractor_id')
      .eq('event_id', eventId);

    const existingIds = new Set(existing?.map(e => e.contractor_id) || []);
    const newIds = new Set(contractors.map(c => c.contractor_id));

    // Batch 1: Remove contractors that are no longer in the list
    const toRemove = [...existingIds].filter(id => !newIds.has(id));
    if (toRemove.length > 0) {
      await this.supabase
        .from('event_contractors')
        .delete()
        .eq('event_id', eventId)
        .in('contractor_id', toRemove);
    }

    // Batch 2: Update existing contractors in a single query using upsert
    const toUpsert = contractors.map(c => ({
      event_id: eventId,
      contractor_id: c.contractor_id,
      shift: c.shift || null,
      member_quantity: c.member_quantity || 0,
    }));

    if (toUpsert.length > 0) {
      // Use upsert with onConflict to handle both insert and update in one query
      await this.supabase
        .from('event_contractors')
        .upsert(toUpsert, { 
          onConflict: 'event_id,contractor_id',
          ignoreDuplicates: false // Update on conflict
        });
    }

    // Return updated list
    return this.findAllByEvent(eventId);
  }
}
