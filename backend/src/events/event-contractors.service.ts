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
      .select('id, contractor_id, work_date')
      .eq('event_id', eventId);

    const normalizeWorkDate = (workDate?: string | null) => (workDate ? workDate : null);
    const keyFor = (contractorId: string, workDate?: string | null) =>
      `${contractorId}::${workDate ?? '__NULL__'}`;

    const existingKeys = (existing || []).map(entry => ({
      id: entry.id,
      key: keyFor(entry.contractor_id, entry.work_date),
    }));
    const newKeys = new Set(
      contractors.map(entry => keyFor(entry.contractor_id, normalizeWorkDate(entry.work_date))),
    );

    const toRemoveIds = existingKeys
      .filter(entry => !newKeys.has(entry.key))
      .map(entry => entry.id);
    if (toRemoveIds.length > 0) {
      await this.supabase
        .from('event_contractors')
        .delete()
        .eq('event_id', eventId)
        .in('id', toRemoveIds);
    }

    const uniqueContractors = new Map(
      contractors.map(entry => {
        const workDate = normalizeWorkDate(entry.work_date);
        return [keyFor(entry.contractor_id, workDate), { ...entry, work_date: workDate }];
      }),
    );
    const toUpsert = [...uniqueContractors.values()].map(c => ({
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
          onConflict: 'event_id,contractor_id,work_date',
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
