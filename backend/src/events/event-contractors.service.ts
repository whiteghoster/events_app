import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AddEventContractorDto } from './dto/event-contractor.dto';

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

  private normalizeWorkDate(workDate?: string | null) {
    return workDate || null;
  }

  private normalizeShift(shift?: string | null) {
    return shift || null;
  }

  private keyFor(contractorId: string, shift?: string | null, workDate?: string | null) {
    return `${contractorId}::${shift ?? '__NULL__'}::${workDate ?? '__NULL__'}`;
  }

  private async upsertContractorsIndividually(
    rows: Array<{
      event_id: string;
      contractor_id: string;
      shift: string | null;
      member_quantity: number;
      work_date: string | null;
    }>,
  ) {
    for (const row of rows) {
      const { error } = await this.supabase
        .from('event_contractors')
        .upsert(row, {
          onConflict: 'event_id,contractor_id,shift,work_date',
          ignoreDuplicates: false,
        });

      if (error) {
        throw new BadRequestException(`Failed to save contractors: ${error.message}`);
      }
    }
  }

  async addEventContractor(eventId: string, dto: AddEventContractorDto) {
    const payload = {
      event_id: eventId,
      contractor_id: dto.contractor_id,
      shift: this.normalizeShift(dto.shift),
      member_quantity: dto.member_quantity || 0,
      work_date: this.normalizeWorkDate(dto.work_date),
    };

    const { data, error } = await this.supabase
      .from('event_contractors')
      .upsert(payload, {
        onConflict: 'event_id,contractor_id,shift,work_date',
        ignoreDuplicates: false,
      })
      .select(`
        *,
        contractor:contractors(id, name)
      `)
      .single();

    if (error) {
      throw new BadRequestException(`Failed to save contractor: ${error.message}`);
    }

    return data;
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
      .select('id, contractor_id, shift, work_date')
      .eq('event_id', eventId);

    const existingKeys = (existing || []).map(entry => ({
      id: entry.id,
      key: this.keyFor(
        entry.contractor_id,
        this.normalizeShift(entry.shift),
        this.normalizeWorkDate(entry.work_date),
      ),
    }));
    const newKeys = new Set(
      contractors.map(entry =>
        this.keyFor(
          entry.contractor_id,
          this.normalizeShift(entry.shift),
          this.normalizeWorkDate(entry.work_date),
        ),
      ),
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
        const shift = this.normalizeShift(entry.shift);
        const workDate = this.normalizeWorkDate(entry.work_date);
        return [
          this.keyFor(entry.contractor_id, shift, workDate),
          { ...entry, shift, work_date: workDate },
        ];
      }),
    );
    const toUpsert = [...uniqueContractors.values()].map(c => ({
      event_id: eventId,
      contractor_id: c.contractor_id,
      shift: this.normalizeShift(c.shift),
      member_quantity: c.member_quantity || 0,
      work_date: this.normalizeWorkDate(c.work_date),
    }));

    if (toUpsert.length > 0) {
      const { error } = await this.supabase
        .from('event_contractors')
        .upsert(toUpsert, {
          onConflict: 'event_id,contractor_id,shift,work_date',
          ignoreDuplicates: false,
        });

      if (error) {
        if (error.message?.includes('cannot affect row a second time')) {
          await this.upsertContractorsIndividually(toUpsert);
        } else {
          throw new BadRequestException(`Failed to save contractors: ${error.message}`);
        }
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
