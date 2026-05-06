import { IsString, IsNotEmpty, IsOptional, IsDateString, IsUUID, IsArray, ValidateNested, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsNotEmpty()
  event_date: string;

  @IsString()
  @IsNotEmpty()
  client_name: string;

  @IsString()
  @IsOptional()
  company_name?: string;

  @IsString()
  @IsOptional()
  contact_phone?: string;

  @IsString()
  @IsNotEmpty()
  venue: string;

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

  @IsUUID()
  @IsOptional()
  contractor_id?: string;

  @IsDateString()
  @IsOptional()
  event_from_date?: string;

  @IsDateString()
  @IsOptional()
  event_end_date?: string;

  @IsString()
  @IsOptional()
  shift?: string;

  @IsOptional()
  member_quantity?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventContractorEntry)
  contractors?: EventContractorEntry[];
}

export class EventContractorEntry {
  @IsUUID()
  contractor_id: string;

  @IsOptional()
  @IsString()
  @IsIn(['day', 'night'])
  shift?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  member_quantity?: number;

  @IsOptional()
  @IsDateString()
  work_date?: string;
}