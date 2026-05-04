import { IsString, IsOptional, IsDateString, IsUUID, IsIn } from 'class-validator';
import { EventStatus } from '../../common/types';

// Valid status values (lowercase to match frontend and database)
const VALID_EVENT_STATUSES = ['live', 'hold', 'finished'];

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  event_date?: string;

  @IsString()
  @IsOptional()
  client_name?: string;

  @IsString()
  @IsOptional()
  company_name?: string;

  @IsString()
  @IsOptional()
  contact_phone?: string;

  @IsString()
  @IsOptional()
  venue?: string;

  @IsString()
  @IsOptional()
  venue_address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  head_karigar_name?: string;

  @IsString()
  @IsOptional()
  manager_name?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  delivery_from_date?: string;

  @IsDateString()
  @IsOptional()
  delivery_to_date?: string;

  @IsUUID()
  @IsOptional()
  assigned_to?: string;

  @IsIn(VALID_EVENT_STATUSES)
  @IsOptional()
  status?: EventStatus;
}