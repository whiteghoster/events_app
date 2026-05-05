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

    // Remove contractors that are no longer in the list
    const toRemove = [...existingIds].filter(id => !newIds.has(id));
    if (toRemove.length > 0) {
      await this.supabase
        .from('event_contractors')
        .delete()
        .eq('event_id', eventId)
        .in('contractor_id', toRemove);
    }

    // Update or insert contractors
    for (const contractor of contractors) {
      if (existingIds.has(contractor.contractor_id)) {
        // Update existing
        await this.supabase
          .from('event_contractors')
          .update({
            shift: contractor.shift || null,
            member_quantity: contractor.member_quantity || 0,
          })
          .eq('event_id', eventId)
          .eq('contractor_id', contractor.contractor_id);
      } else {
        // Insert new
        await this.supabase
          .from('event_contractors')
          .insert({
            event_id: eventId,
            contractor_id: contractor.contractor_id,
            shift: contractor.shift || null,
            member_quantity: contractor.member_quantity || 0,
          });
      }
    }

    // Return updated list
    return this.findAllByEvent(eventId);
  }
}
