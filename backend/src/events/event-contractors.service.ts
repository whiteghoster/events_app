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
      work_date?: string;
    }>,
    universalWorkDates?: {
      workFrom?: string;
      workTo?: string;
    },
  ) {
    const { data: existing } = await this.supabase
      .from('event_contractors')
      .select('contractor_id')
      .eq('event_id', eventId);

    const existingIds = new Set(existing?.map(e => e.contractor_id) || []);
    const newIds = new Set(contractors.map(c => c.contractor_id));

    const toRemove = [...existingIds].filter(id => !newIds.has(id));
    if (toRemove.length > 0) {
      await this.supabase
        .from('event_contractors')
        .delete()
        .eq('event_id', eventId)
        .in('contractor_id', toRemove);
    }

    const toUpsert = contractors.map(c => ({
      event_id: eventId,
      contractor_id: c.contractor_id,
      shift: c.shift || null,
      member_quantity: c.member_quantity || 0,
      work_date: c.work_date || null,
    }));

    if (toUpsert.length > 0) {
      const { error } = await this.supabase
        .from('event_contractors')
        .upsert(toUpsert, {
          onConflict: 'event_id,contractor_id',
          ignoreDuplicates: false,
        });

      if (error) {
        throw new BadRequestException(`Failed to save contractors: ${error.message}`);
      }
    }

    // Save universal contractor work dates to the events table
    if (universalWorkDates) {
      const { error: updateError } = await this.supabase
        .from('events')
        .update({
          contractors_work_from: universalWorkDates.workFrom || null,
          contractors_work_to: universalWorkDates.workTo || null,
        })
        .eq('id', eventId);

      if (updateError) {
        throw new BadRequestException(`Failed to save universal work dates: ${updateError.message}`);
      }
    }

    return this.findAllByEvent(eventId);
  }
}
